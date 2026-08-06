import { afterEach, describe, expect, it, vi } from "vitest";

describe("rateLimit production guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("ignores RATE_LIMIT_DISABLED in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RATE_LIMIT_DISABLED", "true");

    const { checkRateLimitKey, RateLimits } = await import("./rate-limit");
    const uniqueKey = `prod-guard-${Date.now()}-${Math.random()}`;

    // Exhaust a tiny window by using actionDedup (limit 1)
    const first = await checkRateLimitKey(uniqueKey, RateLimits.actionDedup);
    const second = await checkRateLimitKey(uniqueKey, RateLimits.actionDedup);

    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
  });
});
