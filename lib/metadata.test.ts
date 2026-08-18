import { describe, expect, it } from "vitest";
import {
  generateFullMetadata,
  generateCategoryTitle,
  generatePromocodeDescription,
  generatePromocodeTitle,
  generateStoreDescription,
  generateStoreTitle,
  getBaseUrl,
} from "./metadata";

describe("Metadata Generation", () => {
  describe("blog index alternates", () => {
    it.each(["uz", "ru", "en"] as const)(
      "generates a self-canonical and all hreflang links for %s",
      (locale) => {
        const baseUrl = getBaseUrl();
        const metadata = generateFullMetadata(
          "Blog",
          "Guide collection",
          `/${locale}/blog`,
          undefined,
          "website",
          locale,
          "/blog"
        );

        expect(metadata.alternates).toEqual({
          canonical: `${baseUrl}/${locale}/blog`,
          languages: {
            "x-default": `${baseUrl}/uz/blog`,
            uz: `${baseUrl}/uz/blog`,
            ru: `${baseUrl}/ru/blog`,
            en: `${baseUrl}/en/blog`,
          },
        });
      }
    );
  });

  describe("generateStoreTitle", () => {
    it("generates correct title for Uzbek", () => {
      const title = generateStoreTitle("Uzum", 5, "uz");
      expect(title).toContain("Uzum Promokodlari");
      expect(title).toContain("5 ta chegirma");
    });

    it("generates correct title for Russian", () => {
      const title = generateStoreTitle("Uzum", 5, "ru");
      expect(title).toContain("Промокоды Uzum");
      expect(title).toContain("5 скидок");
    });
  });

  describe("generateStoreDescription", () => {
    it("uses custom description if provided", () => {
      const longDesc =
        "Custom description that is definitely longer than fifty characters to pass the validation check.";
      const desc = generateStoreDescription("Uzum", longDesc, 5, 2, "uz");
      expect(desc).toBe(longDesc);
    });

    it("generates default description if custom is null", () => {
      const desc = generateStoreDescription("Uzum", null, 10, 3, "uz");
      expect(desc).toContain("Uzum do'kondagi eng yaxshi promokodlar");
      expect(desc).toContain("10 ta promokod");
      expect(desc).toContain("3 ta eksklusiv taklif");
    });
  });

  describe("generatePromocodeTitle", () => {
    it("includes discount if present", () => {
      const title = generatePromocodeTitle("Super Sale", "Uzum", "50%", "uz");
      expect(title).toContain("Super Sale - 50%");
      expect(title).toContain("Uzum Promokodi");
    });

    it("omits discount if null", () => {
      const title = generatePromocodeTitle("Free Delivery", "Yandex", null, "en");
      expect(title).toBe("Free Delivery | Yandex Promocode");
    });
  });

  describe("generatePromocodeDescription", () => {
    it("includes conditions", () => {
      const desc = generatePromocodeDescription(
        "Promo 2026",
        "Store",
        "20%",
        "Min order 100k",
        "uz"
      );
      expect(desc).toContain("Shartlar: Min order 100k");
    });

    it("prefers shortDescription over conditions", () => {
      const desc = generatePromocodeDescription(
        "Promo 2026",
        "Store",
        "20%",
        "Long conditions text that should be ignored",
        "en",
        "Short snippet for SERP"
      );
      expect(desc).toContain("Short snippet for SERP");
      expect(desc).not.toContain("Long conditions");
    });
  });

  describe("Multi-language fallback", () => {
    it("falls back to Uzbek if language not found", () => {
      const title = generateCategoryTitle("Electronics", 5, "fr"); // French not supported
      expect(title).toContain("Electronics Promokodlari"); // Uzbek fallback
    });
  });
});
