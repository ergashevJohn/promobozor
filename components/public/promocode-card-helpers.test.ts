import { describe, expect, it } from "vitest";
import { summarizeConditions, truncateAtCodePoint } from "./promocode-card-helpers";

describe("truncateAtCodePoint", () => {
  it("does not split emoji surrogate pairs", () => {
    // 89 ASCII chars + flag emoji (2 code units, 1 code point) would break with String#slice
    const prefix = "a".repeat(89);
    const withEmoji = `${prefix}🇺🇿 extra`;
    const truncated = truncateAtCodePoint(withEmoji, 90);
    expect(truncated.endsWith("…")).toBe(true);
    expect(truncated.includes("\uFFFD")).toBe(false);
    // High surrogate alone must not appear
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(truncated)).toBe(false);
  });
});

describe("summarizeConditions", () => {
  it("returns null for empty input", () => {
    expect(summarizeConditions(null)).toBeNull();
    expect(summarizeConditions("")).toBeNull();
    expect(summarizeConditions("   ")).toBeNull();
  });

  it("keeps short text intact", () => {
    expect(summarizeConditions("First order only")).toBe("First order only");
  });

  it("strips HTML and truncates safely around emoji", () => {
    const long = `${"x".repeat(80)} <b>promo</b> 🇺🇿 end-of-conditions-text`;
    const result = summarizeConditions(long);
    expect(result).not.toBeNull();
    expect(result!.includes("<b>")).toBe(false);
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(result!)).toBe(false);
  });
});
