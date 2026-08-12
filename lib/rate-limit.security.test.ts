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
    // CI/Vercel may inherit RATE_LIMIT_DISABLED=true from project env; force limiting on.
    vi.stubEnv("RATE_LIMIT_DISABLED", "false");
    execute.mockResolvedValueOnce([{ count: 1, reset_at: new Date(Date.now() + 60_000) }]);

    const { checkRateLimitKey, RateLimits } = await import("./rate-limit");
    const result = await checkRateLimitKey("ip:promo-1", RateLimits.actionDedup);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("returns unsuccessful when Postgres count exceeds limit", async () => {
    vi.stubEnv("RATE_LIMIT_DISABLED", "false");
    execute.mockResolvedValueOnce([{ count: 2, reset_at: new Date(Date.now() + 60_000) }]);

    const { checkRateLimitKey, RateLimits } = await import("./rate-limit");
    const result = await checkRateLimitKey("ip:promo-2", RateLimits.actionDedup);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("falls back to in-memory when Postgres fails", async () => {
    vi.stubEnv("RATE_LIMIT_DISABLED", "false");
    execute.mockRejectedValue(new Error("db down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { checkRateLimitKey } = await import("./rate-limit");
    const key = `fallback-${Date.now()}`;
    const config = { name: "fallback", limit: 1, timeWindow: 60_000, persistent: true };

    const first = await checkRateLimitKey(key, config);
    const second = await checkRateLimitKey(key, config);

    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("scopes counters by config name so routes do not share a budget", async () => {
    vi.stubEnv("RATE_LIMIT_DISABLED", "false");
    const { checkRateLimit } = await import("./rate-limit");
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });

    const analytics = { name: "analytics-scope-test", limit: 1, timeWindow: 60_000 };
    const og = { name: "og-scope-test", limit: 1, timeWindow: 60_000 };

    expect((await checkRateLimit(request, analytics)).success).toBe(true);
    expect((await checkRateLimit(request, analytics)).success).toBe(false);
    // Same IP, different bucket - still has its own budget
    expect((await checkRateLimit(request, og)).success).toBe(true);
    expect((await checkRateLimit(request, og)).success).toBe(false);
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
    const config = { name: "prod-guard", limit: 1, timeWindow: 60_000 };

    const first = await checkRateLimitKey(uniqueKey, config);
    const second = await checkRateLimitKey(uniqueKey, config);

    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
  });
});
