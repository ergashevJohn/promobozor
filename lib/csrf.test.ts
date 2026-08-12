import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("csrf", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      CSRF_SECRET: "test-csrf-secret-at-least-32-characters",
    };
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.DISABLE_CSRF;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("generates a token that csrfProtection accepts", async () => {
    const { generateCsrfToken, csrfProtection } = await import("./csrf");
    const token = generateCsrfToken();

    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "x-csrf-token": token,
      },
    });

    await expect(csrfProtection(request)).resolves.toEqual({ success: true });
  });

  it("rejects mutating requests without a token", async () => {
    const { csrfProtection } = await import("./csrf");

    const request = new Request("http://localhost/api/contact", {
      method: "POST",
    });

    await expect(csrfProtection(request)).resolves.toEqual({
      success: false,
      error: "Invalid CSRF token. Please refresh the page and try again.",
    });
  });

  it("allows GET requests without a token", async () => {
    const { csrfProtection } = await import("./csrf");

    const request = new Request("http://localhost/api/csrf", {
      method: "GET",
    });

    await expect(csrfProtection(request)).resolves.toEqual({ success: true });
  });

  it("falls back to legacy NEXTAUTH_SECRET in non-production when CSRF_SECRET is missing", async () => {
    delete process.env.CSRF_SECRET;
    vi.stubEnv("NODE_ENV", "test");
    process.env.NEXTAUTH_SECRET = "legacy-nextauth-secret-at-least-32-chars";

    const { generateCsrfToken, csrfProtection } = await import("./csrf");
    const token = generateCsrfToken();

    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "x-csrf-token": token,
      },
    });

    await expect(csrfProtection(request)).resolves.toEqual({ success: true });
  });

  it("requires CSRF_SECRET in production and ignores NEXTAUTH_SECRET fallback", async () => {
    delete process.env.CSRF_SECRET;
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXTAUTH_SECRET = "legacy-nextauth-secret-at-least-32-chars";

    const { generateCsrfToken } = await import("./csrf");
    expect(() => generateCsrfToken()).toThrow(/CSRF_SECRET must be set/);
  });
});
