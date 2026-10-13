import { describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/demos/rate-limit";

/**
 * The limiter is exercised with an injected `now` so every window boundary is
 * deterministic and no test has to sleep (ruling R23: the abuse behaviour is
 * unit-tested, never against the real model).
 */
describe("createRateLimiter", () => {
  it("allows exactly `max` calls and rejects the N+1th with reason `ip`", () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 3,
      globalMax: 100,
      now: () => 0,
    });

    for (let i = 0; i < 3; i += 1) {
      expect(limiter.take("1.1.1.1").allowed).toBe(true);
    }

    const denied = limiter.take("1.1.1.1");

    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe("ip");
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("reopens the window once `now` moves past windowMs", () => {
    let current = 0;
    const limiter = createRateLimiter({
      windowMs: 1_000,
      max: 1,
      globalMax: 100,
      now: () => current,
    });

    expect(limiter.take("1.1.1.1").allowed).toBe(true);
    expect(limiter.take("1.1.1.1").allowed).toBe(false);

    current = 1_000;

    const afterWindow = limiter.take("1.1.1.1");

    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.reason).toBe("ok");
  });

  it("keeps distinct keys independent until the global cap is reached", () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 5,
      globalMax: 4,
      now: () => 0,
    });

    // Four different IPs each spend one request; none of them is over its own cap.
    for (let i = 0; i < 4; i += 1) {
      expect(limiter.take(`10.0.0.${i}`).allowed).toBe(true);
    }

    // A fifth, previously unseen IP is still clean, yet the global cap denies it.
    const denied = limiter.take("10.0.0.9");

    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe("global");
  });

  it("decreases `remaining` monotonically", () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 4,
      globalMax: 100,
      now: () => 0,
    });

    const remaining = [0, 1, 2, 3].map(() => limiter.take("1.1.1.1").remaining);

    expect(remaining).toEqual([3, 2, 1, 0]);

    for (let i = 1; i < remaining.length; i += 1) {
      expect(remaining[i]).toBeLessThan(remaining[i - 1]);
    }
  });

  it("reset() clears both the per-key and the global counters", () => {
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 1,
      globalMax: 1,
      now: () => 0,
    });

    expect(limiter.take("1.1.1.1").allowed).toBe(true);
    expect(limiter.take("2.2.2.2").allowed).toBe(false);

    limiter.reset();

    expect(limiter.take("1.1.1.1").allowed).toBe(true);
  });
});
