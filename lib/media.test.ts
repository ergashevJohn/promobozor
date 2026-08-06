import { describe, expect, it } from "vitest";
import { getApprovedImageUrl } from "./media";

describe("getApprovedImageUrl", () => {
  it("accepts local assets and approved ImageKit URLs", () => {
    expect(getApprovedImageUrl("/store-logo.png")).toBe("/store-logo.png");
    expect(getApprovedImageUrl("https://ik.imagekit.io/promobozor/store.png")).toBe(
      "https://ik.imagekit.io/promobozor/store.png"
    );
  });

  it("rejects missing, malformed, and unapproved external URLs", () => {
    expect(getApprovedImageUrl(null)).toBeNull();
    expect(getApprovedImageUrl("not a url")).toBeNull();
    expect(getApprovedImageUrl("https://cdn.example.com/categories/programming.png")).toBeNull();
    expect(getApprovedImageUrl("http://ik.imagekit.io/promobozor/store.png")).toBeNull();
  });
});
