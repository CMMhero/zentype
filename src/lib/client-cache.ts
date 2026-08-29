const PREFIX = "zt-cache:";

interface CacheEntry<T> {
  data: T;
  ts: number;
}

/**
 * Get a cached value from localStorage. Returns null on miss or expired.
 */
export function lcGet<T>(key: string, ttlMs: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > ttlMs) {
      localStorage.removeItem(`${PREFIX}${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Set a value in localStorage.
 */
export function lcSet<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // quota exceeded or private browsing -- silently ignore
  }
}

/**
 * Delete a cached value.
 */
export function lcDel(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${PREFIX}${key}`);
}

/**
 * Stale-while-revalidate: returns cached data immediately if available,
 * then fetches fresh data and calls setter when done.
 * Returns true if fresh data was fetched (for knowing when loading is done).
 */
export async function lcRevalidate<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  setter: (data: T) => void,
): Promise<boolean> {
  const cached = lcGet<T>(key, ttlMs);
  if (cached !== null) {
    setter(cached);
  }
  try {
    const fresh = await fetcher();
    lcSet(key, fresh);
    setter(fresh);
    return true;
  } catch {
    return cached !== null;
  }
}
