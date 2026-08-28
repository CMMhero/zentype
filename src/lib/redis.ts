import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/**
 * Upstash REST Redis client. Returns null when credentials are absent —
 * every consumer must have a fallback path (Postgres or in-memory).
 */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn(
      "[zentype] UPSTASH_REDIS_REST_URL/TOKEN not set — leaderboards fall back to Postgres, prompts are uncached.",
    );
    client = null;
    return client;
  }
  client = new Redis({ url, token });
  return client;
}

export const LB_TTL_DAYS = 365;

/** score encodes wpm*1000 + accuracy so ties break by accuracy */
export function lbScore(wpm: number, accuracy: number): number {
  return Math.round(wpm * 1000 + Math.max(0, Math.min(100, Math.round(accuracy))));
}

export function lbDecode(score: number): { wpm: number; accuracy: number } {
  const s = Math.round(score);
  return { wpm: Math.floor(s / 1000), accuracy: s % 1000 };
}
