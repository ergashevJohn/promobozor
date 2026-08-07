import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const checkRateLimit = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit,
  RateLimits: {
    og: { limit: 60, window: 60_000, persistent: true },
  },
}));

vi.mock("@/lib/safe-url-fetch", () => ({
  fetchApprovedImageAsDataUrl: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/og", () => ({
  ImageResponse: class ImageResponse extends Response {
    constructor(
      _element: unknown,
      init?: { width?: number; height?: number; headers?: HeadersInit }
    ) {
      super("og-image", {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          ...(init?.headers ?? {}),
        },
      });
    }
  },
}));

describe("GET /api/og", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      resetTime: Date.now() + 30_000,
    });

    const { GET } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/og?title=Test");
    const response = await GET(request);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(await response.text()).toContain("Too many requests");
  });

  it("generates an image with cache headers when allowed", async () => {
    checkRateLimit.mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      resetTime: Date.now() + 60_000,
    });

    const { GET } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/og?title=PromoBozor");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=86400");
    expect(checkRateLimit).toHaveBeenCalledTimes(1);
  });
});
