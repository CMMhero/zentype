"use server";

import { getSupabaseServerClient } from "~/lib/supabase/server";
import { getRedis, lbScore } from "~/lib/redis";
import { isPlausible } from "~/lib/stats";
import { boardKey, type GameMode, type TestResult } from "~/lib/types";

type SaveInput = Omit<TestResult, "id" | "createdAt">;

async function requireUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, user: data.user } : null;
}

export async function saveResult(
  data: SaveInput,
): Promise<{ saved: boolean; id: string | null; reason?: string }> {
  if (!isPlausible({ ...data, mode: data.mode })) {
    return { saved: false, id: null, reason: "implausible" };
  }
  const ctx = await requireUser();
  if (!ctx) return { saved: false, id: null, reason: "guest" };

  const row = {
    user_id: ctx.user.id,
    mode: data.mode,
    variant: data.variant,
    source: data.source,
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

  return { saved: true, id: inserted.id };
}

interface DbResultRow {
  id: string;
  created_at: string;
  mode: GameMode;
  variant: number;
  source: TestResult["source"];
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
    wpm: r.wpm,
    rawWpm: r.raw_wpm,
    accuracy: r.accuracy,
    consistency: r.consistency,
    chars: r.chars,
    timeline: r.timeline,
  };
}

const RESULT_COLUMNS =
  "id,created_at,mode,variant,source,wpm,raw_wpm,accuracy,consistency,chars,timeline";

export async function getUserResults(opts?: {
  limit?: number;
  offset?: number;
  since?: string;
}): Promise<TestResult[]> {
  const ctx = await requireUser();
  if (!ctx) return [];
  const data = opts ?? {};
  let q = ctx.supabase
    .from("test_results")
    .select(RESULT_COLUMNS)
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
  const { data: rows, error } = await ctx.supabase
    .from("test_results")
    .select(RESULT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("[zentype] getUserStats:", error.message);
    return null;
  }
  const results = (rows as unknown as DbResultRow[]).map(mapRow);
  if (results.length === 0) {
    return {
      testsCompleted: 0,
      timeTypedSeconds: 0,
      avgWpm10: 0,
      avgWpmAll: 0,
      avgAccuracy: 0,
      avgConsistency: 0,
      charsTyped: 0,
      bestByBoard: {},
    };
  }
  const last10 = results.slice(0, 10);
  const bestByBoard: Record<string, number> = {};
  for (const r of results) {
    const k = boardKey(r.mode, r.variant);
    if (!bestByBoard[k] || r.wpm > bestByBoard[k]) bestByBoard[k] = r.wpm;
  }
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  return {
    testsCompleted: results.length,
    timeTypedSeconds: sum(results.map((r) => (r.mode === "time" ? r.variant : 8))),
    avgWpm10: Math.round(sum(last10.map((r) => r.wpm)) / last10.length),
    avgWpmAll: Math.round(sum(results.map((r) => r.wpm)) / results.length),
    avgAccuracy: Math.round(sum(results.map((r) => r.accuracy)) / results.length),
    avgConsistency: Math.round(sum(results.map((r) => r.consistency)) / results.length),
    charsTyped: sum(results.map((r) => r.chars.correct + r.chars.incorrect + r.chars.extra)),
    bestByBoard,
  };
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

export interface PublicProfile {
  userId: string;
  username: string;
  avatarUrl: string | null;
  stats: AggregatedStats | null;
  results: TestResult[];
}

export async function getPublicProfile(
  userId: string,
): Promise<PublicProfile | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users?.find((u) => u.id === userId);
  const meta = authUser?.user_metadata ?? {};
  const username = profile?.username ||
    (meta["user_name"] as string) ||
    (meta["preferred_username"] as string) ||
    "unknown";
  const avatarUrl = (meta["avatar_url"] as string) || (meta["picture"] as string) || null;
  const { data: rows } = await supabase
    .from("test_results")
    .select(RESULT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1000);
  const results = (rows as unknown as DbResultRow[]).map(mapRow);
  if (results.length === 0) {
    return { userId, username, avatarUrl, stats: null, results: [] };
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
    timeTypedSeconds: sum(results.map((r) => (r.mode === "time" ? r.variant : 8))),
    avgWpm10: Math.round(sum(last10.map((r) => r.wpm)) / last10.length),
    avgWpmAll: Math.round(sum(results.map((r) => r.wpm)) / results.length),
    avgAccuracy: Math.round(sum(results.map((r) => r.accuracy)) / results.length),
    avgConsistency: Math.round(sum(results.map((r) => r.consistency)) / results.length),
    charsTyped: sum(results.map((r) => r.chars.correct + r.chars.incorrect + r.chars.extra)),
    bestByBoard,
  };
  return { userId, username, avatarUrl, stats, results };
}

/** Search users by username prefix (for command palette). */
export async function searchUsers(
  query: string,
): Promise<Array<{ userId: string; username: string; avatarUrl: string | null }>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase || !query.trim()) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,username,avatar_url")
    .ilike("username", `%${query.trim()}%`)
    .limit(8);
  if (!profiles) return [];
  return profiles.map((p) => ({
    userId: p.id,
    username: p.username,
    avatarUrl: p.avatar_url,
  }));
}
