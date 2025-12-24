type CacheEntry<T> = {
  value: T;
  createdAtMs: number;
};

// In-memory cache (best-effort). In serverless this is per-instance.
const CACHE = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1h

export function cacheGet<T>(key: string): T | null {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAtMs > DEFAULT_TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T): void {
  CACHE.set(key, { value, createdAtMs: Date.now() });
}
