import { describe, expect, it } from "vitest";
import { normalizePromokodAliasSlug, resolvePromokodAliasTarget } from "./promokod-alias";

describe("promokod alias helpers", () => {
  it("strips competitor suffixes", () => {
    expect(normalizePromokodAliasSlug("yandex-eats-promokod")).toBe("yandex-eats");
    expect(normalizePromokodAliasSlug("payme-promocode")).toBe("payme");
    expect(normalizePromokodAliasSlug("payme")).toBe("payme");
  });

  it("prefers store over brand when both match", () => {
    expect(
      resolvePromokodAliasTarget({
        slug: "uzum",
        storeSlug: "uzum",
        brandSlug: "uzum",
      })
    ).toEqual({ type: "store", slug: "uzum" });
  });

  it("falls back to normalized slug hits", () => {
    expect(
      resolvePromokodAliasTarget({
        slug: "payme-promokod",
        storeSlug: null,
        brandSlug: null,
        storeSlugNormalized: null,
        brandSlugNormalized: "payme",
      })
    ).toEqual({ type: "brand", slug: "payme" });
  });
});
