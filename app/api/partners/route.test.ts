import { verifyRecaptcha } from "@/lib/recaptcha";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/csrf", () => ({ csrfProtection: vi.fn().mockResolvedValue({ success: true }) }));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitKey: vi.fn().mockResolvedValue({
    success: true,
    resetTime: Date.now() + 60_000,
  }),
  getHashedRateLimitIdentifier: vi.fn(() => "hashed-ip"),
  RateLimits: { partnerInquiry: { name: "partnerInquiry" } },
}));

vi.mock("@/lib/recaptcha", () => ({
  verifyRecaptcha: vi.fn().mockResolvedValue(true),
}));

const insertValues = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", async () => {
  const schema = await vi.importActual<typeof import("@/db/schema")>("@/db/schema");
  return {
    partnerInquiries: schema.partnerInquiries,
    db: {
      insert: vi.fn(() => ({ values: insertValues })),
    },
  };
});

function partnerBody(overrides: Record<string, unknown> = {}) {
  return {
    company: "Acme",
    contactPerson: "Ada",
    workEmail: "ada@example.com",
    partnerType: "direct_brand",
    requestedFormats: ["listing"],
    campaignDescription: "Spring campaign",
    privacyAccepted: true,
    startedAt: Date.now() - 5_000,
    websiteHoneypot: "",
    recaptchaToken: "token",
    ...overrides,
  };
}

function partnerRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/partners", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/partners", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyRecaptcha).mockResolvedValue(true);
    insertValues.mockResolvedValue(undefined);
  });

  it("rejects a honeypot submission", async () => {
    const response = await POST(
      partnerRequest(partnerBody({ websiteHoneypot: "http://spam.example" }))
    );
    expect(response.status).toBe(400);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("rejects an incomplete inquiry", async () => {
    const response = await POST(partnerRequest(partnerBody({ company: "" })));
    expect(response.status).toBe(400);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("rejects failed recaptcha", async () => {
    vi.mocked(verifyRecaptcha).mockResolvedValue(false);
    const response = await POST(partnerRequest(partnerBody()));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Captcha verification failed." });
    expect(insertValues).not.toHaveBeenCalled();
  });
});
