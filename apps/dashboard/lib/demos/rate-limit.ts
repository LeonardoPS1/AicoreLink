export interface RateLimitOptions {
  windowMs: number;
  max: number;
  globalMax: number;
  /** Injectable clock; defaults to `Date.now`. Kept overridable so window expiry is testable. */
  now?: () => number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  reason: "ok" | "ip" | "global";
}

/**
 * Fixed-window rate limiter with two dimensions (rulings R17/R18):
 *
 * - per key (the caller passes the IP — never the client-controlled `sessionId`),
 * - a global cap shared by every key, so a distributed burst or a shared office
 *   IP cannot keep growing the cost.
 *
 * Expired entries are swept on each `take`, and a fresh window starts on the
 * first request after the previous window has elapsed.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, globalMax } = options;
  const now = options.now ?? (() => Date.now());

  const perKey = new Map<string, { count: number; resetAt: number }>();
  let globalCount = 0;
  let globalResetAt = 0;

  function sweep(currentTime: number): void {
    for (const [key, entry] of perKey) {
      if (entry.resetAt <= currentTime) {
        perKey.delete(key);
      }
    }
  }

  function take(key: string): RateLimitDecision {
    const currentTime = now();
    sweep(currentTime);

    if (globalResetAt <= currentTime) {
      globalCount = 0;
      globalResetAt = currentTime + windowMs;
    }

    const entry = perKey.get(key);

    if (entry && entry.count >= max) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((entry.resetAt - currentTime) / 1000),
        reason: "ip",
      };
    }

    if (globalCount >= globalMax) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((globalResetAt - currentTime) / 1000),
        reason: "global",
      };
    }

    if (entry) {
      entry.count += 1;
    } else {
      perKey.set(key, { count: 1, resetAt: currentTime + windowMs });
    }
    globalCount += 1;

    const count = entry ? entry.count : 1;

    return {
      allowed: true,
      remaining: Math.max(0, max - count),
      retryAfterSeconds: 0,
      reason: "ok",
    };
  }

  function reset(): void {
    perKey.clear();
    globalCount = 0;
    globalResetAt = 0;
  }

  return { take, reset };
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Shared demo limiter, configured from env. Best-effort abuse protection: this
 * counter lives in the process, so it resets on deploy and does not span
 * replicas; a shared store (Upstash Redis) is the next step if the landing ever
 * runs more than one instance (`@upstash/ratelimit` and `redis` are already in
 * package.json, still unused).
 */
export const demoRateLimiter = createRateLimiter({
  windowMs: envInt("DEMO_RATE_WINDOW_MS", 300_000),
  max: envInt("DEMO_RATE_MAX", 8),
  globalMax: envInt("DEMO_RATE_GLOBAL_MAX", 120),
});
