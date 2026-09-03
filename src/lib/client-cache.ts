const PREFIX = "zt-cache:";

interface CacheEntry<T> {
  data: T;
  ts: number;
}

/**
 * Get a cached value from localStorage. Returns null on miss or expired.
 */
export function lcGet<T>(key: string, ttlMs: number): T | null {
  const entry = lcGetEntry<T>(key, ttlMs);
  return entry ? entry.data : null;
}

/**
 * Like lcGet, but also returns the entry's age so callers can decide whether
 * the cached value is fresh enough to skip a network refetch entirely.
 */
export function lcGetEntry<T>(
  key: string,
  ttlMs: number,
): { data: T; ageMs: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    const ageMs = Date.now() - entry.ts;
    if (ageMs > ttlMs) {
      localStorage.removeItem(`${PREFIX}${key}`);
      return null;
    }
    return { data: entry.data, ageMs };
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
 * Delete every cached value whose key starts with the given prefix.
 */
export function lcDelPrefix(prefix: string): void {
  if (typeof window === "undefined") return;
  try {
    const full = `${PREFIX}${prefix}`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(full)) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    // ignore
  }
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
