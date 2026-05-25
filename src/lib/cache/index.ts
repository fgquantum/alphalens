// ============================================================
// AlphaLens v6 — In-Memory Cache with TTL
// Production: swap for Upstash Redis
// ============================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

// TTL in seconds for each data type
export const TTL = {
  quote: 60,            // 1 min
  financials: 86400,    // 24h
  alphaScore: 86400,    // 24h
  news: 1800,           // 30 min
  history: 300,         // 5 min
  macro: 3600,          // 1h
  etfHoldings: 86400,   // 24h
  insider: 43200,       // 12h
  screener: 600,        // 10 min
  ai: 86400,            // 24h (CRITICAL for staying under free limits)
  peers: 86400,         // 24h
  companyProfile: 604800, // 7 days
  search: 300,          // 5 min
} as const;

/**
 * Cache wrapper: returns cached data if fresh, otherwise calls fetcher
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing && Date.now() < existing.expiresAt) {
    return existing.data;
  }

  try {
    const data = await fetcher();
    store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return data;
  } catch (error) {
    // Redundant check: keep service online by using the last cached value during downtime
    if (existing) {
      console.warn(`[CACHE] Fetcher failed for key "${key}". Falling back to expired/stale value. Error:`, error);
      return existing.data;
    }
    // If no cache exists, we must propagate the error so double fallback logic at call-site can trigger
    throw error;
  }
}

/**
 * Invalidate a specific cache key
 */
export function invalidate(key: string): void {
  store.delete(key);
}

/**
 * Invalidate all keys matching a prefix
 */
export function invalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

/**
 * Get cache stats (for debugging)
 */
export function cacheStats() {
  let active = 0;
  let expired = 0;
  const now = Date.now();
  for (const entry of store.values()) {
    if (now < entry.expiresAt) active++;
    else expired++;
  }
  return { total: store.size, active, expired };
}

// Periodic cleanup of expired entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now >= entry.expiresAt) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
