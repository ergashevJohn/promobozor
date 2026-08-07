import { afterEach, describe, expect, it, vi } from "vitest";

const execute = vi.fn();

vi.mock("@/db", () => ({
  db: {
    execute,
  },
}));

describe("persistent rate limit (Postgres)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses Postgres RETURNING count for persistent configs", async () => {
    execute.mockResolvedValueOnce([{ count: 1, reset_at: new Date(Date.now() + 60_000) }]);

    const { checkRateLimitKey, RateLimits } = await import("./rate-limit");
    const result = await checkRateLimitKey("ip:promo-1", RateLimits.actionDedup);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("returns unsuccessful when Postgres count exceeds limit", async () => {
    execute.mockResolvedValueOnce([{ count: 2, reset_at: new Date(Date.now() + 60_000) }]);

    const { checkRateLimitKey, RateLimits } = await import("./rate-limit");
    const result = await checkRateLimitKey("ip:promo-2", RateLimits.actionDedup);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("falls back to in-memory when Postgres fails", async () => {
    execute.mockRejectedValue(new Error("db down"));

    const { checkRateLimitKey } = await import("./rate-limit");
    const key = `fallback-${Date.now()}`;
    const config = { limit: 1, window: 60_000, persistent: true };

    const first = await checkRateLimitKey(key, config);
    const second = await checkRateLimitKey(key, config);

    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
  });
});

describe("rateLimit production guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("ignores RATE_LIMIT_DISABLED in production (memory path)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RATE_LIMIT_DISABLED", "true");

    // Non-persistent config avoids DB in this guard test
    const { checkRateLimitKey } = await import("./rate-limit");
    const uniqueKey = `prod-guard-${Date.now()}-${Math.random()}`;
    const config = { limit: 1, window: 60_000 };

    const first = await checkRateLimitKey(uniqueKey, config);
    const second = await checkRateLimitKey(uniqueKey, config);

    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
  });
});
