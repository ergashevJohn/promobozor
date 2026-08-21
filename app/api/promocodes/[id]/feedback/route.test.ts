import { db } from "@/lib/db";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const PROMO_ID = "550e8400-e29b-41d4-a716-446655440000";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/csrf", () => ({ csrfProtection: vi.fn().mockResolvedValue({ success: true }) }));

vi.mock("@/lib/recaptcha", () => ({
  verifyRecaptcha: vi.fn().mockResolvedValue(true),
}));

const checkRateLimitKeyMock = vi.fn().mockResolvedValue({
  success: true,
  resetTime: Date.now() + 60_000,
});

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitKey: (...args: unknown[]) => checkRateLimitKeyMock(...args),
  getHashedRateLimitIdentifier: vi.fn(() => "hashed-ip"),
  RateLimits: {
    feedbackBurst: { name: "feedbackBurst" },
    feedbackDaily: { name: "feedbackDaily" },
    feedbackDedup: { name: "feedbackDedup" },
  },
}));

vi.mock("@/lib/db", async () => {
  const schema = await vi.importActual<typeof import("@/db/schema")>("@/db/schema");
  return {
    promocodes: schema.promocodes,
    promocodeFeedback: schema.promocodeFeedback,
    db: {
      select: vi.fn(),
      transaction: vi.fn(),
    },
  };
});

function feedbackRequest(body: Record<string, unknown>, id = PROMO_ID) {
  return new NextRequest(`http://localhost/api/promocodes/${id}/feedback`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function mockActiveSelect(rows: Array<{ id: string }>) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  vi.mocked(db.select).mockReturnValue({ from } as never);
  return { from, where, limit };
}

describe("POST /api/promocodes/:id/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyRecaptcha).mockResolvedValue(true);
    checkRateLimitKeyMock.mockResolvedValue({
      success: true,
      resetTime: Date.now() + 60_000,
    });
  });

  it("rejects an invalid promocode id before persisting feedback", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/promocodes/not-a-uuid/feedback", { method: "POST" }),
      { params: Promise.resolve({ id: "not-a-uuid" }) }
    );
    expect(response.status).toBe(400);
    expect(checkRateLimitKeyMock).not.toHaveBeenCalled();
  });

  it("requires a failure reason for failed feedback", async () => {
    const response = await POST(feedbackRequest({ result: "failed", source: "card" }), {
      params: Promise.resolve({ id: PROMO_ID }),
    });
    expect(response.status).toBe(400);
    expect(checkRateLimitKeyMock).not.toHaveBeenCalled();
  });

  it("rejects failed recaptcha before checking rate limits", async () => {
    vi.mocked(verifyRecaptcha).mockResolvedValue(false);

    const response = await POST(
      feedbackRequest({ result: "worked", failureReason: null, source: "card" }),
      { params: Promise.resolve({ id: PROMO_ID }) }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Captcha verification failed." });
    expect(checkRateLimitKeyMock).not.toHaveBeenCalled();
    expect(db.select).not.toHaveBeenCalled();
  });

  it("returns 409 for inactive promocodes without consuming rate limits", async () => {
    mockActiveSelect([]);

    const response = await POST(
      feedbackRequest({ result: "worked", failureReason: null, source: "card" }),
      { params: Promise.resolve({ id: PROMO_ID }) }
    );

    expect(response.status).toBe(409);
    expect(checkRateLimitKeyMock).not.toHaveBeenCalled();
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("saves worked feedback for an active promocode", async () => {
    mockActiveSelect([{ id: PROMO_ID }]);
    const insert = vi.fn().mockResolvedValue(undefined);
    const returning = vi.fn().mockResolvedValue([{ needsReview: false }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    const update = vi.fn().mockReturnValue({ set });
    const txSelectLimit = vi.fn().mockResolvedValue([{ id: PROMO_ID }]);
    const txSelectWhere = vi.fn().mockReturnValue({ limit: txSelectLimit });
    const txSelectFrom = vi.fn().mockReturnValue({ where: txSelectWhere });
    const txSelect = vi.fn().mockReturnValue({ from: txSelectFrom });

    vi.mocked(db.transaction).mockImplementation(async (callback) =>
      callback({
        select: txSelect,
        insert: vi.fn().mockReturnValue({ values: insert }),
        update,
      } as never)
    );

    const response = await POST(
      feedbackRequest({
        result: "worked",
        failureReason: null,
        source: "card",
        recaptchaToken: "token",
      }),
      { params: Promise.resolve({ id: PROMO_ID }) }
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true, needsReview: false });
    expect(checkRateLimitKeyMock).toHaveBeenCalledTimes(3);
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
