import { describe, expect, it } from "vitest";
import { isCompetitorPromokodAliasPath, isUnsafeRuPromokodDealSlug } from "./routes";

/**
 * Documents the alias contract used by proxy + promokod-alias-resolve:
 * - UZ/EN /promokod/{slug} → hub alias (301)
 * - RU /promokod/{slug} → deal detail (200) unless slug ends with -promokod/-promocode
 */
describe("promokod alias routing contract", () => {
  it("treats UZ/EN /promokod/* as competitor hub aliases", () => {
    expect(isCompetitorPromokodAliasPath("uz", "promokod", "payme")).toBe(true);
    expect(isCompetitorPromokodAliasPath("en", "promokod", "payme")).toBe(true);
  });

  it("keeps RU /promokod/{deal} as a real deal route", () => {
    expect(isCompetitorPromokodAliasPath("ru", "promokod", "payme")).toBe(false);
    expect(isCompetitorPromokodAliasPath("ru", "promokod", "payme-plus")).toBe(false);
  });

  it("aliases RU only when the competitor suffix is present", () => {
    expect(isCompetitorPromokodAliasPath("ru", "promokod", "payme-promokod")).toBe(true);
    expect(isCompetitorPromokodAliasPath("ru", "promokod", "payme-promocode")).toBe(true);
  });

  it("flags unsafe RU deal slugs that would 301 to a hub", () => {
    expect(isUnsafeRuPromokodDealSlug("click-cashback")).toBe(false);
    expect(isUnsafeRuPromokodDealSlug("click-promokod")).toBe(true);
  });
});
