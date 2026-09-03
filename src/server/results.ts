"use server";

import { getSupabaseServerClient, getSupabasePublicClient } from "~/lib/supabase/server";
import { getRedis, lbScore } from "~/lib/redis";
import { isPlausible } from "~/lib/stats";
import { boardKey, type GameMode, type TestResult } from "~/lib/types";
import { cacheGet, cacheSet, cacheDel } from "~/lib/cache";

type SaveInput = Omit<TestResult, "id" | "createdAt">;

/** Estimate elapsed seconds for a test result. Time mode = variant (exact).
 *  Words mode = round(variant * 60 / wpm), clamped 5-600s. */
function estimateSeconds(mode: GameMode, variant: number, wpm: number): number {
  if (mode === "time") return variant;
  return Math.max(5, Math.min(600, Math.round((variant * 60) / Math.max(wpm, 1))));
}

async function requireUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, user: data.user } : null;
}

export async function saveResult(
  data: SaveInput,
): Promise<{ saved: boolean; id: string | null; reason?: string; isPB?: boolean }> {
  if (!isPlausible({ ...data, mode: data.mode })) {
    return { saved: false, id: null, reason: "implausible" };
  }
  const ctx = await requireUser();
  if (!ctx) return { saved: false, id: null, reason: "guest" };

  // Capture the previous best on this board (mode + variant, matching the
  // stats bestByBoard keying) before inserting, so the caller can tell
  // whether this test is a new personal best.
  let prevBest = 0;
  try {
    const { data: prev } = await ctx.supabase
      .from("test_results")
      .select("wpm")
      .eq("user_id", ctx.user.id)
      .eq("mode", data.mode)
      .eq("variant", data.variant)
      .order("wpm", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prev) prevBest = Number(prev.wpm) || 0;
  } catch (e) {
    console.warn("[zentype] prev best lookup failed:", e);
  }

  const row = {
    user_id: ctx.user.id,
    mode: data.mode,
    variant: data.variant,
    source: data.source,
    punctuation: data.punctuation ?? false,
    numbers: data.numbers ?? false,
    wpm: data.wpm,
    raw_wpm: data.rawWpm,
    accuracy: data.accuracy,
    consistency: data.consistency,
    chars: data.chars,
    timeline: data.timeline,
  };

  const { data: inserted, error } = await ctx.supabase
    .from("test_results")
    .insert(row)
    .select("id")
    .single();
  if (error || !inserted) {
    console.error("[zentype] saveResult insert failed:", error?.message);
    return { saved: false, id: null, reason: error?.message };
  }

  // leaderboard update
  try {
    const redis = getRedis();
    if (redis && data.accuracy >= 80) {
      const key = `lb:${boardKey(data.mode as GameMode, data.variant)}`;
      const metaKey = `${key}:meta`;
      const prev = await redis.zscore(key, ctx.user.id);
      const score = lbScore(data.wpm, data.accuracy);
      if (prev === null || prev === undefined || score > Number(prev)) {
        await redis
          .multi()
          .zadd(key, { score, member: ctx.user.id })
          .hset(metaKey, {
            [ctx.user.id]: JSON.stringify({
              username: (ctx.user.user_metadata?.["user_name"] as string) ||
                ctx.user.email?.split("@")[0] ||
                "anon",
              avatarUrl:
                (ctx.user.user_metadata?.["avatar_url"] as string) ?? null,
              wpm: data.wpm,
              accuracy: data.accuracy,
              consistency: data.consistency,
              createdAt: new Date().toISOString(),
            }),
          })
          .zremrangebyrank(key, 0, -1001)
          .expire(key, 60 * 60 * 24 * 365)
          .expire(metaKey, 60 * 60 * 24 * 365)
          .exec();
      }
    }
  } catch (e) {
    console.warn("[zentype] leaderboard update skipped:", e);
  }

  // Invalidate caches so profile shows fresh data
  await cacheDel(`stats:${ctx.user.id}`);
  await cacheDel(`ach-stats:${ctx.user.id}`);
  await cacheDel(`pub-profile:${ctx.user.id}`);
  const uname = (
    (ctx.user.user_metadata?.["user_name"] as string) ||
    ctx.user.email?.split("@")[0] ||
    ""
  ).toLowerCase();
  if (uname) await cacheDel(`pub-profile:${uname}`);

  return { saved: true, id: inserted.id, isPB: data.wpm > prevBest };
}

interface DbResultRow {
  id: string;
  created_at: string;
  mode: GameMode;
  variant: number;
  source: TestResult["source"];
  punctuation: boolean;
  numbers: boolean;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  consistency: number;
  chars: TestResult["chars"];
  timeline: TestResult["timeline"];
}

function mapRow(r: DbResultRow): TestResult {
  return {
    id: r.id,
    createdAt: r.created_at,
    mode: r.mode,
    variant: r.variant,
    source: r.source,
    punctuation: r.punctuation ?? false,
    numbers: r.numbers ?? false,
    wpm: r.wpm,
    rawWpm: r.raw_wpm,
    accuracy: r.accuracy,
    consistency: r.consistency,
    chars: r.chars,
    timeline: r.timeline,
  };
}

const RESULT_COLUMNS =
  "id,created_at,mode,variant,source,punctuation,numbers,wpm,raw_wpm,accuracy,consistency,chars,timeline";

const LITE_COLUMNS =
  "id,created_at,mode,variant,source,punctuation,numbers,wpm,raw_wpm,accuracy,consistency";

/** Fetch a single result by ID with full columns (chars + timeline). */
export async function getResultById(id: string): Promise<TestResult | null> {
  const ctx = await requireUser();
  if (!ctx) return null;
  const { data: row, error } = await ctx.supabase
    .from("test_results")
    .select(RESULT_COLUMNS)
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .single();
  if (error || !row) return null;
  return mapRow(row as unknown as DbResultRow);
}

export async function getUserResults(opts?: {
  limit?: number;
  offset?: number;
  since?: string;
  /** When true, omit timeline and chars (heavy JSON) for list views */
  lite?: boolean;
}): Promise<TestResult[]> {
  const ctx = await requireUser();
  if (!ctx) return [];
  const data = opts ?? {};
  const columns = data.lite ? LITE_COLUMNS : RESULT_COLUMNS;
  let q = ctx.supabase
    .from("test_results")
    .select(columns)
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .limit(Math.min(data.limit ?? 100, 500));
  if (data.since) q = q.gte("created_at", data.since);
  if (data.offset) q = q.range(data.offset, data.offset + Math.min(data.limit ?? 100, 500) - 1);
  const { data: rows, error } = await q;
  if (error) {
    console.error("[zentype] getUserResults:", error.message);
    return [];
  }
  return (rows as unknown as DbResultRow[]).map(mapRow);
}

export interface AggregatedStats {
  testsCompleted: number;
  timeTypedSeconds: number;
  avgWpm10: number;
  avgWpmAll: number;
  avgAccuracy: number;
  avgConsistency: number;
  charsTyped: number;
  bestByBoard: Record<string, number>;
}

export async function getUserStats(): Promise<AggregatedStats | null> {
  const ctx = await requireUser();
  if (!ctx) return null;

  // Check cache first (60s TTL -- avoids 1000-row scan on every profile load)
  const cacheKey = `stats:${ctx.user.id}`;
  const cached = await cacheGet<AggregatedStats>(cacheKey);
  if (cached) return cached;

  // Select only columns needed for aggregation — omitting timeline (large JSON)
  // and source/punctuation/numbers which aren't used in stats.
  const STATS_COLUMNS =
    "id,created_at,mode,variant,wpm,raw_wpm,accuracy,consistency,chars";
  const { data: rows, error } = await ctx.supabase
    .from("test_results")
    .select(STATS_COLUMNS)
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("[zentype] getUserStats:", error.message);
    return null;
  }
  const results = (rows as unknown as DbResultRow[]).map(mapRow);
  if (results.length === 0) {
    const empty: AggregatedStats = {
      testsCompleted: 0,
      timeTypedSeconds: 0,
      avgWpm10: 0,
      avgWpmAll: 0,
      avgAccuracy: 0,
      avgConsistency: 0,
      charsTyped: 0,
      bestByBoard: {},
    };
    await cacheSet(cacheKey, empty, 60);
    return empty;
  }
  const last10 = results.slice(0, 10);
  const bestByBoard: Record<string, number> = {};
  for (const r of results) {
    const k = boardKey(r.mode, r.variant);
    if (!bestByBoard[k] || r.wpm > bestByBoard[k]) bestByBoard[k] = r.wpm;
  }
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const stats: AggregatedStats = {
    testsCompleted: results.length,
    timeTypedSeconds: sum(results.map((r) => estimateSeconds(r.mode, r.variant, r.wpm))),
    avgWpm10: Math.round(sum(last10.map((r) => r.wpm)) / last10.length),
    avgWpmAll: Math.round(sum(results.map((r) => r.wpm)) / results.length),
    avgAccuracy: Math.round(sum(results.map((r) => r.accuracy)) / results.length),
    avgConsistency: Math.round(sum(results.map((r) => r.consistency)) / results.length),
    charsTyped: sum(results.map((r) => r.chars.correct + r.chars.incorrect + r.chars.extra)),
    bestByBoard,
  };
  await cacheSet(cacheKey, stats, 60);
  return stats;
}

export async function mergeLocalResults(
  results: TestResult[],
): Promise<{ merged: number }> {
  const ctx = await requireUser();
  if (!ctx || results.length === 0) return { merged: 0 };
  const rows = results
    .filter((r) => isPlausible({ ...r, mode: r.mode }))
    .slice(0, 200)
    .map((r) => ({
      user_id: ctx.user.id,
      mode: r.mode,
      variant: r.variant,
      source: r.source,
      punctuation: r.punctuation ?? false,
      numbers: r.numbers ?? false,
      wpm: r.wpm,
      raw_wpm: r.rawWpm,
      accuracy: r.accuracy,
      consistency: r.consistency,
      chars: r.chars,
      timeline: r.timeline,
      local_id: r.id,
    }));
  if (rows.length === 0) return { merged: 0 };
  const { error } = await ctx.supabase.from("test_results").upsert(rows, {
    onConflict: "local_id,user_id",
    ignoreDuplicates: true,
  });
  if (error) {
    console.error("[zentype] mergeLocalResults:", error.message);
    return { merged: 0 };
  }
  return { merged: rows.length };
}

export async function deleteMyData(): Promise<{ ok: boolean }> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false };
  const { error } = await ctx.supabase
    .from("test_results")
    .delete()
    .eq("user_id", ctx.user.id);
  return { ok: !error };
}

export interface PublicProfileResult {
  id: string;
  createdAt: string;
  mode: GameMode;
  variant: number;
  wpm: number;
  accuracy: number;
}

export interface PublicProfile {
  userId: string;
  username: string;
  avatarUrl: string | null;
  joinedAt: string | null;
  stats: AggregatedStats | null;
  /**
   * Lightweight per-result summaries for the activity calendar.
   * Deliberately excludes timeline/chars/rawWpm -- shipping them for 1000
   * tests produced megabyte payloads that froze the browser's main thread
   * while parsing (and again when caching to localStorage).
   */
  results: PublicProfileResult[];
}

export async function getMyJoinDate(): Promise<string | null> {
  const ctx = await requireUser();
  if (!ctx) return null;
  // Join date is immutable — cache it for a day
  const cacheKey = `joindate:${ctx.user.id}`;
  const cached = await cacheGet<string>(cacheKey);
  if (cached) return cached;
  const { data } = await ctx.supabase
    .from("profiles")
    .select("created_at")
    .eq("id", ctx.user.id)
    .maybeSingle();
  const joinedAt = (data?.created_at as string | null) ?? null;
  if (joinedAt) await cacheSet(cacheKey, joinedAt, 86400);
  return joinedAt;
}

export async function getPublicProfile(
  identifier: string,
): Promise<PublicProfile | null> {
  // Cache public profiles briefly (30s) to avoid repeated heavy queries
  const cached = await cacheGet<PublicProfile>(`pub-profile:${identifier.toLowerCase()}`);
  if (cached) return cached;

  const supabase = getSupabasePublicClient();
  if (!supabase) return null;
  // Try username lookup first, then fallback to userId
  let userId: string | null = null;
  let username: string | null = null;
  let avatarUrl: string | null = null;

  let joinedAt: string | null = null;
  const { data: profileByUsername } = await supabase
    .from("profiles")
    .select("id,username,avatar_url,created_at")
    .ilike("username", identifier)
    .maybeSingle();
  if (profileByUsername) {
    userId = profileByUsername.id;
    username = profileByUsername.username;
    avatarUrl = profileByUsername.avatar_url;
    joinedAt = profileByUsername.created_at as string | null;
  } else {
    // Try as userId
    const { data: profileById } = await supabase
      .from("profiles")
      .select("id,username,avatar_url,created_at")
      .eq("id", identifier)
      .maybeSingle();
    if (profileById) {
      userId = profileById.id;
      username = profileById.username;
      avatarUrl = profileById.avatar_url;
      joinedAt = profileById.created_at as string | null;
    }
  }
  if (!userId) return null;

  // avatar and username come from the profiles table (set on signup)
  // No auth.admin.listUsers() call — it requires the service role key and
  // crashes the entire function when using the anon/public client.

  // Try RPC for stats (bypasses RLS)
  const { data: statsRow, error: statsErr } = await supabase.rpc(
    "get_public_profile_stats",
    { p_user_id: userId },
  );
  let stats: AggregatedStats | null = null;
  if (!statsErr && statsRow && statsRow.length > 0) {
    const s = statsRow[0];
    const bbb = (typeof s.best_by_board === "string" ? JSON.parse(s.best_by_board) : s.best_by_board ?? {}) as Record<string, number>;
    stats = {
      testsCompleted: Number(s.tests_completed ?? 0),
      timeTypedSeconds: Number(s.time_typed_seconds ?? 0),
      avgWpm10: Number(s.avg_wpm_10 ?? 0),
      avgWpmAll: Number(s.avg_wpm_all ?? 0),
      avgAccuracy: Number(s.avg_accuracy ?? 0),
      avgConsistency: Number(s.avg_consistency ?? 0),
      charsTyped: Number(s.chars_typed ?? 0),
      bestByBoard: bbb,
    };
  }

  // Lightweight summaries only -- the profile UI just needs per-day counts
  // for the activity calendar. 365 rows covers the 12-month view.
  const toPublicResult = (r: Record<string, unknown>): PublicProfileResult => ({
    id: r.id as string,
    createdAt: r.created_at as string,
    mode: r.mode as GameMode,
    variant: r.variant as number,
    wpm: r.wpm as number,
    accuracy: r.accuracy as number,
  });

  // Try RPC for results (bypasses RLS)
  const { data: rpcResults, error: rpcErr } = await supabase.rpc(
    "get_user_results_public",
    { p_user_id: userId, p_limit: 365 },
  );
  let results: PublicProfileResult[] = [];
  if (!rpcErr && rpcResults && rpcResults.length > 0) {
    results = rpcResults.map(toPublicResult);
  } else {
    // Fallback: direct query
    const { data: rows } = await supabase
      .from("test_results")
      .select("id,created_at,mode,variant,wpm,accuracy")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(365);
    results = ((rows ?? []) as unknown as Record<string, unknown>[]).map(toPublicResult);
  }

  if (results.length === 0 && !stats) {
    return { userId, username: username ?? "unknown", avatarUrl, joinedAt, stats: null, results: [] };
  }

  // Compute stats from full rows if the stats RPC didn't return them
  if (!stats && results.length > 0) {
    const { data: fullRows } = await supabase
      .from("test_results")
      .select(RESULT_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1000);
    const full = (fullRows as unknown as DbResultRow[] | null)?.map(mapRow) ?? [];
    const last10 = full.slice(0, 10);
    const bestByBoard: Record<string, number> = {};
    for (const r of full) {
      const k = boardKey(r.mode, r.variant);
      if (!bestByBoard[k] || r.wpm > bestByBoard[k]) bestByBoard[k] = r.wpm;
    }
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    stats = {
      testsCompleted: full.length,
      timeTypedSeconds: sum(full.map((r) => estimateSeconds(r.mode, r.variant, r.wpm))),
      avgWpm10: Math.round(sum(last10.map((r) => r.wpm)) / last10.length),
      avgWpmAll: Math.round(sum(full.map((r) => r.wpm)) / full.length),
      avgAccuracy: Math.round(sum(full.map((r) => r.accuracy)) / full.length),
      avgConsistency: Math.round(sum(full.map((r) => r.consistency)) / full.length),
      charsTyped: sum(full.map((r) => r.chars.correct + r.chars.incorrect + r.chars.extra)),
      bestByBoard,
    };
  }

  const profile: PublicProfile = { userId, username: username ?? "unknown", avatarUrl, joinedAt, stats, results };
  await cacheSet(`pub-profile:${identifier.toLowerCase()}`, profile, 30);
  return profile;
}

/** Search users by username prefix (for command palette). */
export async function searchUsers(
  query: string,
): Promise<Array<{ userId: string; username: string; avatarUrl: string | null }>> {
  const supabase = getSupabasePublicClient();
  if (!supabase || !query.trim()) return [];
  // Cache 60s — the command palette re-queries on every keystroke
  const cacheKey = `search:${query.trim().toLowerCase()}`;
  const cached = await cacheGet<Array<{ userId: string; username: string; avatarUrl: string | null }>>(cacheKey);
  if (cached) return cached;

  let result: Array<{ userId: string; username: string; avatarUrl: string | null }> = [];
  // Try RPC first
  const { data: rpcData, error: rpcErr } = await supabase.rpc("search_users", {
    p_query: query.trim(),
    p_limit: 8,
  });
  if (!rpcErr && rpcData && rpcData.length > 0) {
    result = rpcData.map((r: Record<string, unknown>) => ({
      userId: r.id as string,
      username: r.username as string,
      avatarUrl: (r.avatar_url as string) ?? null,
    }));
  } else {
    // Fallback: direct query
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,username,avatar_url")
      .ilike("username", `%${query.trim()}%`)
      .limit(8);
    if (profiles) {
      result = profiles.map((p) => ({
        userId: p.id,
        username: p.username,
        avatarUrl: p.avatar_url,
      }));
    }
  }
  if (result.length > 0) await cacheSet(cacheKey, result, 60);
  return result;
}

export async function getPublicStats(): Promise<{
  totalUsers: number;
  totalTests: number;
  totalSeconds: number;
  totalXpEarned: number;
} | null> {
  // Cache for 5 minutes -- this hits multiple aggregate tables
  const cached = await cacheGet<{ totalUsers: number; totalTests: number; totalSeconds: number; totalXpEarned: number }>("public-stats");
  if (cached) return cached;

  const supabase = await getSupabasePublicClient();
  if (!supabase) return null;

  try {
    const [{ count: totalUsers }, { count: totalTests }, { data: xpData }, { data: tests }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("test_results").select("id", { count: "exact", head: true }),
      supabase.from("user_points").select("total_xp"),
      supabase.from("test_results").select("variant,mode,wpm"),
    ]);

    const totalXpEarned = xpData?.reduce((sum, r) => sum + (r.total_xp ?? 0), 0) ?? 0;

    let totalSeconds = 0;
    if (tests) {
      for (const r of tests) {
        totalSeconds += estimateSeconds(r.mode as GameMode, r.variant, r.wpm ?? 50);
      }
    }

    const result = {
      totalUsers: totalUsers ?? 0,
      totalTests: totalTests ?? 0,
      totalSeconds,
      totalXpEarned,
    };
    await cacheSet("public-stats", result, 300);
    return result;
  } catch {
    return null;
  }
}
