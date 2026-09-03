"use server";

import { getRedis, lbDecode } from "~/lib/redis";
import { cacheGet, cacheSet } from "~/lib/cache";
import { getSupabasePublicClient } from "~/lib/supabase/server";
import { boardKey, type GameMode, type LeaderboardEntry } from "~/lib/types";

export interface LevelLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  totalXP: number;
}

export async function getLevelLeaderboard(limit = 50): Promise<LevelLeaderboardEntry[]> {
  // Cache for 60s — this is a global community board and only changes when
  // users earn XP, so it doesn't need a fresh query on every page load.
  const cacheKey = `level-lb:${limit}`;
  const cached = await cacheGet<LevelLeaderboardEntry[]>(cacheKey);
  if (cached) return cached;

  const supabase = getSupabasePublicClient();
  if (!supabase) return [];

  let entries: LevelLeaderboardEntry[] = [];
  // Try RPC first (bypasses RLS via SECURITY DEFINER)
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_level_leaderboard",
    { p_limit: limit },
  );
  if (!rpcError && rpcData && rpcData.length > 0) {
    entries = rpcData.map((r: Record<string, unknown>, i: number) => ({
      rank: i + 1,
      userId: r.user_id as string,
      username: (r.username as string) ?? "anon",
      avatarUrl: (r.avatar_url as string) ?? null,
      level: r.level as number,
      totalXP: r.total_xp as number,
    }));
  } else {
    // Fallback: direct query (works if migration 0004/0005 RLS policies exist)
    const { data, error } = await supabase
      .from("user_points")
      .select("user_id, total_xp, level")
      .order("total_xp", { ascending: false })
      .limit(limit);
    if (!error && data && data.length > 0) {
      const ids = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,username,avatar_url")
        .in("id", ids);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      entries = data.map((r, i) => {
        const p = profileMap.get(r.user_id);
        return {
          rank: i + 1,
          userId: r.user_id as string,
          username: p?.username ?? "anon",
          avatarUrl: p?.avatar_url ?? null,
          level: r.level as number,
          totalXP: r.total_xp as number,
        };
      });
    }
  }

  if (entries.length > 0) await cacheSet(cacheKey, entries, 60);
  return entries;
}

export async function getBoardRanks(
  userId: string,
  boards: string[],
): Promise<Record<string, number>> {
  if (boards.length === 0) return {};

  // Fast path: ranks come straight from the Redis sorted sets (all-time),
  // whose score encodes wpm*1000 + accuracy — the same tie-break ordering
  // as the Postgres fallback below. O(log n) per board instead of pulling
  // up to 500 rows per board from Postgres.
  const redis = getRedis();
  if (redis) {
    try {
      const entries = await Promise.all(
        boards.map(async (board) => {
          const [mode, variantStr] = board.split(":");
          const variant = Number(variantStr);
          if (!mode || !variant) return [board, undefined] as const;
          const key = `lb:${boardKey(mode as GameMode, variant)}`;
          const rank = await redis.zrevrank(key, userId);
          return [board, rank !== null && rank !== undefined ? rank + 1 : undefined] as const;
        }),
      );
      const result: Record<string, number> = {};
      for (const [board, rank] of entries) {
        if (rank !== undefined) result[board] = rank;
      }
      return result;
    } catch (e) {
      console.warn("[zentype] redis rank lookup failed, using Postgres:", e);
    }
  }

  const supabase = getSupabasePublicClient();
  if (!supabase) return {};

  // Fallback: parallelize all board rank lookups instead of sequential for-loop
  const entries = await Promise.all(
    boards.map(async (board) => {
      const [mode, variantStr] = board.split(":");
      const variant = Number(variantStr);
      if (!mode || !variant) return [board, undefined] as const;
      // Try RPC first
      const { data: rpcRows, error: rpcErr } = await supabase.rpc(
        "get_wpm_leaderboard",
        { p_mode: mode, p_variant: variant, p_limit: 500 },
      );
      if (!rpcErr && rpcRows && rpcRows.length > 0) {
        const idx = rpcRows.findIndex((r: Record<string, unknown>) => r.user_id === userId);
        return [board, idx !== -1 ? idx + 1 : undefined] as const;
      }
      // Fallback: direct query
      const { data: rows } = await supabase
        .from("test_results")
        .select("user_id,wpm,accuracy")
        .eq("mode", mode)
        .eq("variant", variant)
        .order("wpm", { ascending: false })
        .limit(500);
      if (!rows || rows.length === 0) return [board, undefined] as const;
      const best = new Map<string, { wpm: number; acc: number }>();
      for (const r of rows) {
        const cur = best.get(r.user_id as string);
        if (!cur || (r.wpm as number) > cur.wpm || ((r.wpm as number) === cur.wpm && (r.accuracy as number) > cur.acc)) {
          best.set(r.user_id as string, { wpm: r.wpm as number, acc: r.accuracy as number });
        }
      }
      const sorted = [...best.entries()].sort((a, b) => b[1].wpm - a[1].wpm || b[1].acc - a[1].acc);
      const idx = sorted.findIndex(([id]) => id === userId);
      return [board, idx !== -1 ? idx + 1 : undefined] as const;
    }),
  );

  const result: Record<string, number> = {};
  for (const [board, rank] of entries) {
    if (rank !== undefined) result[board] = rank;
  }
  return result;
}

interface MetaValue {
  username: string;
  avatarUrl: string | null;
  wpm: number;
  accuracy: number;
  consistency: number;
  createdAt: string;
}

export async function getLeaderboard(data: {
  mode: GameMode;
  variant: number;
  limit?: number;
  since?: string;
}): Promise<LeaderboardEntry[]> {
  const limit = Math.min(data.limit ?? 50, 100);

  // For "today"/"week" periods, always use Postgres — Redis sorted sets
  // only store all-time bests per user, so date filtering doesn't work.
  if (!data.since) {
    // fast path: Redis sorted set (all-time only)
    try {
      const redis = getRedis();
      if (redis) {
        const key = `lb:${boardKey(data.mode, data.variant)}`;
        const fetchCount = limit * 4;
        const raw = await redis.zrange(key, 0, fetchCount - 1, { withScores: true });

        // Extract user IDs and scores
        const userIds: string[] = [];
        const scoreMap = new Map<string, number>();
        for (let i = 0; i < raw.length; i += 2) {
          const userId = String(raw[i]);
          const score = Number(raw[i + 1]);
          userIds.push(userId);
          scoreMap.set(userId, score);
        }

        if (userIds.length > 0) {
          // Batch fetch all metadata in one call
          const metaKey = `${key}:meta`;
          const metaValues = await redis.hmget<Record<string, string>>(metaKey, ...userIds);

          const entries: Array<LeaderboardEntry & { _score: number }> = [];
          for (const userId of userIds) {
            const metaJson = metaValues?.[userId] ?? null;
            let meta: Partial<MetaValue> = {};
            try {
              meta = metaJson ? JSON.parse(metaJson) : {};
            } catch { /* ignore */ }
            if (!meta.username) continue;
            const score = scoreMap.get(userId) ?? 0;
            const decoded = lbDecode(score);
            entries.push({
              rank: 0,
              userId,
              username: meta.username,
              avatarUrl: meta.avatarUrl ?? null,
              wpm: decoded.wpm,
              accuracy: meta.accuracy ?? decoded.accuracy,
              consistency: meta.consistency ?? 0,
              createdAt: meta.createdAt ?? new Date(0).toISOString(),
              _score: score,
            });
          }

          if (entries.length > 0) {
            return entries.slice(0, limit).map((e, i) => ({
              rank: i + 1,
              userId: e.userId,
              username: e.username,
              avatarUrl: e.avatarUrl,
              wpm: e.wpm,
              accuracy: e.accuracy,
              consistency: e.consistency,
              createdAt: e.createdAt,
            }));
          }
        }
      }
    } catch (e) {
      console.warn("[zentype] redis leaderboard read failed, using Postgres:", e);
    }
  }

  // fallback / date-filtered: aggregate from Postgres
  const supabase = getSupabasePublicClient();
  if (!supabase) return [];
  // Try RPC first (bypasses RLS via SECURITY DEFINER)
  const { data: rpcRows, error: rpcError } = await supabase.rpc(
    "get_wpm_leaderboard",
    {
      p_mode: data.mode,
      p_variant: data.variant,
      p_limit: limit,
      p_since: data.since ?? null,
    },
  );
  if (!rpcError && rpcRows && rpcRows.length > 0) {
    return rpcRows.map((r: Record<string, unknown>, i: number) => ({
      rank: i + 1,
      userId: r.user_id as string,
      username: (r.username as string) ?? "anon",
      avatarUrl: (r.avatar_url as string) ?? null,
      wpm: Number(r.wpm),
      accuracy: Number(r.accuracy),
      consistency: Number(r.consistency ?? 0),
      createdAt: r.created_at as string,
    }));
  }
  // Fallback: direct query (works if migration 0004 RLS policy exists)
  let q = supabase
    .from("test_results")
    .select("id,user_id,wpm,accuracy,consistency,created_at")
    .eq("mode", data.mode)
    .eq("variant", data.variant)
    .order("wpm", { ascending: false })
    .limit(500);
  if (data.since) q = q.gte("created_at", data.since);
  const { data: rows, error } = await q;
  if (error) {
    console.error("[zentype] leaderboard fallback:", error.message);
    return [];
  }
  const best = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const cur = best.get(r.user_id);
    if (!cur || r.wpm > cur.wpm || (r.wpm === cur.wpm && r.accuracy > cur.accuracy)) {
      best.set(r.user_id, r);
    }
  }
  const ids = [...best.keys()];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,username,avatar_url")
    .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return [...best.values()]
    .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)
    .slice(0, limit)
    .map((r, i) => {
      const p = profileMap.get(r.user_id);
      return {
        rank: i + 1,
        userId: r.user_id,
        username: p?.username ?? "anon",
        avatarUrl: p?.avatar_url ?? null,
        wpm: r.wpm,
        accuracy: r.accuracy,
        consistency: r.consistency ?? 0,
        createdAt: r.created_at,
      };
    });
}
