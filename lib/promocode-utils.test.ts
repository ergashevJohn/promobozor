import { describe, expect, it } from "vitest";
import { getPromocodeRedirectUrl } from "./promocode-utils";
import type { Promocode } from "@/components/public/types";

const promocode = {
  id: "promo-1",
  type: "code",
  code: "CODE",
  link: null,
  discountType: "amount",
  discountValue: 6000,
  currency: "UZS",
  status: "active",
  isFeatured: false,
  viewsCount: 0,
  copyCount: 0,
  likesCount: 0,
  dislikesCount: 0,
  expiresAt: null,
  translations: [],
  store: {
    websiteUrl: "https://uzum.uz",
    translations: [],
  },
} satisfies Promocode;

describe("getPromocodeRedirectUrl", () => {
  it("uses the campaign link for a code offer detail action", () => {
    expect(getPromocodeRedirectUrl({ ...promocode, link: "https://go.uzum.uz/l/campaign" })).toBe(
      "https://go.uzum.uz/l/campaign"
    );
  });

  it("falls back to the associated store homepage", () => {
    expect(getPromocodeRedirectUrl(promocode)).toBe("https://uzum.uz");
  });
});
