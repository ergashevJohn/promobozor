import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { db } from "@/lib/db";

const PROMO_ID = "550e8400-e29b-41d4-a716-446655440000";
const INACTIVE_ID = "550e8400-e29b-41d4-a716-446655440001";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(null),
  RateLimits: {
    publicAction: { name: "publicAction", limit: 10, window: 60_000, persistent: true },
  },
}));

vi.mock("@/lib/validation", () => ({
  extractIpAddress: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@/lib/db", async () => {
  const schema = await vi.importActual<typeof import("@/db/schema")>("@/db/schema");
  const update = vi.fn();
  const insert = vi.fn();

  return {
    promocodes: schema.promocodes,
    activityLogs: schema.activityLogs,
    db: {
      update,
      insert,
      transaction: vi.fn(
        async (
          callback: (tx: { update: typeof update; insert: typeof insert }) => Promise<unknown>
        ) => callback({ update, insert })
      ),
    },
  };
});

describe("POST /api/promocodes/[id]/copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid promocode ids", async () => {
    const request = new NextRequest("http://localhost:3000/api/promocodes/not-a-uuid/copy", {
      method: "POST",
    });

    const response = await POST(request, { params: Promise.resolve({ id: "not-a-uuid" }) });

    expect(response.status).toBe(400);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("increments copy count and logs activity for active promocodes", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: PROMO_ID }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    const values = vi.fn().mockResolvedValue(undefined);

    vi.mocked(db.update).mockReturnValue({ set } as never);
    vi.mocked(db.insert).mockReturnValue({ values } as never);

    const request = new NextRequest(`http://localhost:3000/api/promocodes/${PROMO_ID}/copy`, {
      method: "POST",
      headers: {
        "user-agent": "vitest",
      },
    });

    const response = await POST(request, { params: Promise.resolve({ id: PROMO_ID }) });

    expect(response.status).toBe(200);
    expect(returning).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledTimes(1);
  });

  it("rejects copy tracking for inactive promocodes", async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });

    vi.mocked(db.update).mockReturnValue({ set } as never);
    vi.mocked(db.insert).mockReturnValue({ values: vi.fn() } as never);

    const request = new NextRequest(`http://localhost:3000/api/promocodes/${INACTIVE_ID}/copy`, {
      method: "POST",
      headers: {
        "user-agent": "vitest",
      },
    });

    const response = await POST(request, { params: Promise.resolve({ id: INACTIVE_ID }) });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: "Promocode is inactive or expired" });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
