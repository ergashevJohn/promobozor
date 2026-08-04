import { describe, expect, it } from "vitest";
import { generateSlug } from "./slug";

describe("generateSlug", () => {
  it("should handle basic latin text", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
    expect(generateSlug("Promocode 2026")).toBe("promocode-2026");
  });

  it("should handle multiple spaces and special characters", () => {
    expect(generateSlug("  Hello   World!  ")).toBe("hello-world");
    expect(generateSlug("Best @ Deals # Today")).toBe("best-deals-today");
  });

  it("should transfigure cyrillic characters", () => {
    expect(generateSlug("Привет Мир")).toBe("privet-mir");
    expect(generateSlug("Яндекс Еда")).toBe("yandeks-eda"); // ya, n, d, e, k, s
    expect(generateSlug("Скидки и акции")).toBe("skidki-i-aktsii");
  });

  it("should transfigure Uzbek specific characters", () => {
    // ў, қ, ғ, ҳ
    expect(generateSlug("Ўзбекистон")).toBe("ozbekiston");
    expect(generateSlug("Қарши")).toBe("qarshi");
    expect(generateSlug("Ғаллаорол")).toBe("ghallaorol");
    expect(generateSlug("Ҳамма")).toBe("hamma");
  });

  it("should handle mixed scripts", () => {
    expect(generateSlug("Super скидка 50%")).toBe("super-skidka-50");
  });

  it("should truncate long slugs", () => {
    const longText = "a".repeat(150);
    const slug = generateSlug(longText);
    expect(slug.length).toBeLessThan(101);
  });
});
