"use server";

import { getRedis, lbDecode } from "~/lib/redis";
import { getSupabaseServerClient } from "~/lib/supabase/server";
import { boardKey, type GameMode, type LeaderboardEntry } from "~/lib/types";

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

        if (userIds.length === 0) return [];

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
    } catch (e) {
      console.warn("[zentype] redis leaderboard read failed, using Postgres:", e);
    }
  }

  // fallback / date-filtered: aggregate from Postgres
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
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
