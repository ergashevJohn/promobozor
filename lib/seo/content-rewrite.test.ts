import { describe, expect, it } from "vitest";
import {
  BODY_WORD_FLOOR,
  buildEntityRewrite,
  buildPromocodeRewrite,
  formatDiscount,
  isThinEntityBody,
  plainText,
  wordCount,
} from "./content-rewrite";

describe("content rewrite", () => {
  it("cleans legacy HTML, escaped newlines, and emoji", () => {
    expect(plainText("<p>Yangi 🚀 taklif</p>\\n<b>Shartlar</b>")).toBe("Yangi taklif Shartlar");
  });

  it("uses editorial word floors instead of a 80-character gate", () => {
    expect(BODY_WORD_FLOOR.store).toBe(150);
    expect(BODY_WORD_FLOOR.brand).toBe(120);
    expect(isThinEntityBody("brand", "<p>Qisqa matn.</p>")).toBe(true);
    expect(wordCount("<p>bir ikki uch</p>")).toBe(3);
  });

  it("formats structured discounts without inventing values", () => {
    expect(
      formatDiscount({ discountType: "amount", discountValue: 40000, currency: "UZS" }, "uz")
    ).toContain("40");
    expect(
      formatDiscount({ discountType: "percent", discountValue: 20, currency: "USD" }, "en")
    ).toBe("20%");
    expect(
      formatDiscount({ discountType: "amount", discountValue: 0, currency: "UZS" }, "uz")
    ).toBe("maxsus bonus");
  });

  it.each(["uz", "ru", "en"] as const)(
    "rewrites an entity into substantial, localized content for %s",
    (locale) => {
      const result = buildEntityRewrite({
        kind: "brand",
        locale,
        name: "Hostinger",
        existingDescription:
          locale === "ru"
            ? "Hostinger предоставляет веб-хостинг, VPS и домены."
            : locale === "en"
              ? "Hostinger provides web hosting, VPS, and domain services."
              : "Hostinger veb hosting, VPS va domen xizmatlarini taklif qiladi.",
        deals: [
          {
            title: "Hostinger 20% discount",
            discountType: "percent",
            discountValue: 20,
            currency: "USD",
            type: "link",
            minOrderAmount: null,
            expiresAt: null,
          },
        ],
      });

      expect(wordCount(result.bodyHtml)).toBeGreaterThanOrEqual(120);
      expect(result.bodyHtml).toContain("Hostinger");
      expect(result.bodyHtml).toContain("20%");
      expect(result.faqJson).toHaveLength(3);
      expect(result.metaTitle.length).toBeLessThanOrEqual(60);
      expect(result.metaDescription.length).toBeLessThanOrEqual(155);
    }
  );

  it("states zero active offers instead of implying inventory", () => {
    const result = buildEntityRewrite({
      kind: "store",
      locale: "en",
      name: "Example",
      existingDescription: "Example is an online shop.",
      deals: [],
    });

    expect(result.bodyHtml).toContain("no active offers");
    expect(result.faqJson[0]?.answer).toContain("no active");
  });

  it("rewrites a promocode from structured value and existing terms", () => {
    const input = {
      locale: "uz",
      title: "Birinchi buyurtmaga chegirma",
      existingConditions: "<p>Faqat yangi foydalanuvchilar uchun.</p>",
      entityName: "Yandex Eats",
      discountType: "amount",
      discountValue: 40000,
      currency: "UZS",
      type: "code",
      minOrderAmount: 130000,
      expiresAt: new Date("2026-12-31T00:00:00.000Z"),
    } as const;
    const result = buildPromocodeRewrite(input);

    expect(result.shortDescription).toContain("40");
    expect(result.conditions).toContain("Faqat yangi foydalanuvchilar uchun");
    expect(result.conditions).toContain("130");
    expect(result.howToHtml).toContain("<ol>");
    expect(result.faqJson).toHaveLength(3);
    expect(result.metaTitle.length).toBeLessThanOrEqual(60);

    const repeated = buildPromocodeRewrite({
      ...input,
      existingConditions: result.conditions,
    });
    expect(repeated.conditions).toBe(result.conditions);
  });
});
