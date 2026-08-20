import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/csrf", () => ({ csrfProtection: vi.fn().mockResolvedValue({ success: true }) }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitKey: vi.fn().mockResolvedValue({ success: true, resetTime: Date.now() + 60_000 }),
  getHashedRateLimitIdentifier: vi.fn(() => "hashed-ip"),
  RateLimits: { feedbackBurst: {}, feedbackDaily: {}, feedbackDedup: {} },
}));
vi.mock("@/lib/db", async () => {
  const schema = await vi.importActual<typeof import("@/db/schema")>("@/db/schema");
  return { promocodes: schema.promocodes, promocodeFeedback: schema.promocodeFeedback, db: {} };
});

describe("POST /api/promocodes/:id/feedback", () => {
  it("rejects an invalid promocode id before persisting feedback", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/promocodes/not-a-uuid/feedback", { method: "POST" }),
      { params: Promise.resolve({ id: "not-a-uuid" }) }
    );
    expect(response.status).toBe(400);
  });

  it("requires a failure reason for failed feedback", async () => {
    const response = await POST(
      new NextRequest(
        "http://localhost/api/promocodes/550e8400-e29b-41d4-a716-446655440000/feedback",
        {
          method: "POST",
          body: JSON.stringify({ result: "failed", source: "card" }),
        }
      ),
      { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) }
    );
    expect(response.status).toBe(400);
  });
});
