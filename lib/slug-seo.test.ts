import { describe, expect, it } from "vitest";
import {
  differentiateFromCompetitor,
  ensureUniqueSlug,
  generateBrandSeoSlug,
  generateCategorySeoSlug,
  generatePromocodeSeoSlug,
  generateStoreSeoSlug,
  stripPromocodeCode,
} from "./slug-seo";

describe("stripPromocodeCode", () => {
  it("removes exact promo code from text", () => {
    expect(stripPromocodeCode("SALOM30 30 000 so'm chegirma", "SALOM30")).toBe(
      "  30 000 so'm chegirma"
    );
  });

  it("returns text unchanged when code is empty", () => {
    expect(stripPromocodeCode("hello", null)).toBe("hello");
    expect(stripPromocodeCode("hello", "")).toBe("hello");
  });
});

describe("generatePromocodeSeoSlug", () => {
  it("builds store + benefit slug without promo code", () => {
    const slug = generatePromocodeSeoSlug({
      storeName: "Yandex Eats",
      title: "SALOM30 30 000 so'm chegirma birinchi buyurtma uchun",
      code: "SALOM30",
      language: "uz",
    });
    expect(slug).toBe("yandex-eats-30-000-som-chegirma-birinchi-buyurtma-uchun");
    expect(slug).not.toContain("salom30");
  });

  it("strips promokod stop-words and code-like tokens", () => {
    const slug = generatePromocodeSeoSlug({
      storeName: "Uzum Bank",
      title: "Uzum Bank tavsiya promokodi JKOTA04TCO",
      code: "JKOTA04TCO",
      language: "uz",
    });
    expect(slug).not.toContain("jkota04tco");
    expect(slug).not.toContain("promokodi");
    expect(slug).toContain("uzum-bank");
  });

  it("strips english promo-code wording", () => {
    const slug = generatePromocodeSeoSlug({
      storeName: "Opal",
      title: "Opal promo code PZW4F 30 day Opal Pro pass",
      code: "PZW4F",
      language: "en",
    });
    expect(slug).not.toMatch(/pzw4f/i);
    expect(slug).not.toContain("promo");
    expect(slug).not.toContain("code");
    expect(slug).toContain("opal");
  });
});

describe("generateStoreSeoSlug", () => {
  it("appends localized deals suffix", () => {
    expect(generateStoreSeoSlug({ storeName: "Yandex Market", language: "uz" })).toBe(
      "yandex-market-chegirmalar"
    );
    expect(generateStoreSeoSlug({ storeName: "Яндекс Маркет", language: "ru" })).toBe(
      "yandeks-market-skidki"
    );
    expect(generateStoreSeoSlug({ storeName: "Yandex Market", language: "en" })).toBe(
      "yandex-market-deals"
    );
  });
});

describe("generateBrandSeoSlug", () => {
  it("appends localized deals suffix", () => {
    expect(generateBrandSeoSlug({ brandName: "Uzum", language: "en" })).toBe("uzum-deals");
  });
});

describe("generateCategorySeoSlug", () => {
  it("slugifies category name", () => {
    expect(generateCategorySeoSlug({ categoryName: "Food Delivery", language: "en" })).toBe(
      "food-delivery"
    );
  });
});

describe("ensureUniqueSlug", () => {
  it("appends numeric suffix on collision", () => {
    const used = new Set(["korzinka-chegirmalar"]);
    expect(ensureUniqueSlug("korzinka-chegirmalar", used)).toBe("korzinka-chegirmalar-2");
    expect(used.has("korzinka-chegirmalar-2")).toBe(true);
  });

  it("allows same owner in Map mode", () => {
    const used = new Map<string, string>([["korzinka-chegirmalar", "id-1"]]);
    expect(ensureUniqueSlug("korzinka-chegirmalar", used, "id-1")).toBe("korzinka-chegirmalar");
  });
});

describe("differentiateFromCompetitor", () => {
  it("adds promobozor marker when slug collides with competitor", () => {
    expect(differentiateFromCompetitor("travel", new Set(["travel"]))).toBe("travel-promobozor");
    expect(differentiateFromCompetitor("fashion", new Set(["food"]))).toBe("fashion");
  });
});

describe("generateSlug still used for base transliteration", () => {
  it("handles cyrillic store names in promocode slug", () => {
    const slug = generatePromocodeSeoSlug({
      storeName: "Яндекс Еда",
      title: "Скидка 40 000 сум на первый заказ",
      code: null,
      language: "ru",
    });
    expect(slug.startsWith("yandeks-eda")).toBe(true);
    expect(slug).toContain("skidka");
  });
});
