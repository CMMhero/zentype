import { getRedis } from "~/lib/redis";

const PREFIX = "cache:";

/**
 * Get a cached value by key. Returns null on miss or when Redis is unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(`${PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with a TTL in seconds.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(`${PREFIX}${key}`, JSON.stringify(value), { ex: ttlSeconds });
  } catch {
    // best effort -- don't break the app if cache write fails
  }
}

/**
 * Delete a cached value (or multiple by prefix).
 */
export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(`${PREFIX}${key}`);
  } catch {
    // best effort
  }
}

/**
 * Delete all keys matching a prefix. Uses SCAN to avoid blocking.
 */
export async function cacheDelPrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    let cursor = "0";
    do {
      const result = await redis.scan(cursor, { match: `${PREFIX}${prefix}*`, count: 50 });
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // best effort
  }
}
