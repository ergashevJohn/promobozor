import { describe, expect, it } from "vitest";
import { secureCompare } from "./secure-compare";

describe("secureCompare", () => {
  it("returns true for equal secrets", () => {
    expect(secureCompare("super-secret-value", "super-secret-value")).toBe(true);
  });

  it("returns false for unequal or missing values", () => {
    expect(secureCompare("super-secret-value", "other-secret-value")).toBe(false);
    expect(secureCompare("abc", "abcd")).toBe(false);
    expect(secureCompare(null, "secret")).toBe(false);
    expect(secureCompare("secret", undefined)).toBe(false);
  });
});
