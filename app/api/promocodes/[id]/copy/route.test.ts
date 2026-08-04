import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { db } from "@/lib/db";

vi.mock("@/lib/validation", () => ({
  extractIpAddress: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@/lib/db", async () => {
  const schema = await vi.importActual<typeof import("@/db/schema")>("@/db/schema");

  return {
    promocodes: schema.promocodes,
    activityLogs: schema.activityLogs,
    db: {
      update: vi.fn(),
      insert: vi.fn(),
    },
  };
});

describe("POST /api/promocodes/[id]/copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("increments copy count and logs activity for active promocodes", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "promo-1" }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    const values = vi.fn().mockResolvedValue(undefined);

    vi.mocked(db.update).mockReturnValue({ set } as never);
    vi.mocked(db.insert).mockReturnValue({ values } as never);

    const request = new NextRequest("http://localhost:3000/api/promocodes/promo-1/copy", {
      method: "POST",
      headers: {
        "user-agent": "vitest",
      },
    });

    const response = await POST(request, { params: Promise.resolve({ id: "promo-1" }) });

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

    const request = new NextRequest("http://localhost:3000/api/promocodes/promo-2/copy", {
      method: "POST",
      headers: {
        "user-agent": "vitest",
      },
    });

    const response = await POST(request, { params: Promise.resolve({ id: "promo-2" }) });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: "Promocode is inactive or expired" });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
