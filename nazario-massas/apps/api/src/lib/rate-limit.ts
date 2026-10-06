/** Fixed-window in-memory limiter. Swap for Redis/Upstash when running more than one instance. */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key: string): { allowed: boolean; retryAfter: number } {
      const now = Date.now();
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
      }
      const entry = hits.get(key);
      if (!entry || entry.resetAt < now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfter: 0 };
      }
      entry.count++;
      return { allowed: entry.count <= limit, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    },
    reset(key: string) {
      hits.delete(key);
    },
  };
}
