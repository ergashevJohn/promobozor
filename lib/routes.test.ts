import { describe, expect, it } from "vitest";
import {
  getEntityPath,
  getInternalEntityHref,
  getLegacyEntityPath,
  getListPath,
  isCompetitorPromokodAliasPath,
  resolveEntityTypeFromSegment,
  resolveLegacyLocalizedPath,
  resolveListTypeFromSegment,
} from "./routes";

describe("routes helpers", () => {
  it("builds localized entity paths", () => {
    expect(getEntityPath("uz", "promocode", "yandex-eats-deal")).toBe(
      "/uz/chegirma/yandex-eats-deal"
    );
    expect(getEntityPath("ru", "promocode", "yandeks-eda")).toBe("/ru/promokod/yandeks-eda");
    expect(getEntityPath("en", "promocode", "yandex-eats")).toBe("/en/deal/yandex-eats");
    expect(getEntityPath("uz", "store", "korzinka-chegirmalar")).toBe(
      "/uz/do-kon/korzinka-chegirmalar"
    );
  });

  it("builds localized list paths", () => {
    expect(getListPath("uz", "promocodes")).toBe("/uz/chegirmalar");
    expect(getListPath("ru", "stores")).toBe("/ru/magaziny");
    expect(getListPath("en", "brands")).toBe("/en/brands");
  });

  it("builds legacy and internal hrefs", () => {
    expect(getLegacyEntityPath("uz", "promocode", "old")).toBe("/uz/promocode/old");
    expect(getInternalEntityHref("store", "uzum")).toBe("/store/uzum");
  });

  it("resolves segments to entity/list types", () => {
    expect(resolveEntityTypeFromSegment("chegirma")).toBe("promocode");
    expect(resolveEntityTypeFromSegment("promokod")).toBe("promocode");
    expect(resolveEntityTypeFromSegment("magazin")).toBe("store");
    expect(resolveListTypeFromSegment("chegirmalar")).toBe("promocodes");
    expect(resolveListTypeFromSegment("promocodes")).toBe("promocodes");
  });

  it("maps legacy English paths to localized ones", () => {
    expect(resolveLegacyLocalizedPath("/uz/promocode/old-slug")).toBe("/uz/chegirma/old-slug");
    expect(resolveLegacyLocalizedPath("/uz/promocodes")).toBe("/uz/chegirmalar");
    expect(resolveLegacyLocalizedPath("/en/store/uzum")).toBeNull();
    expect(resolveLegacyLocalizedPath("/uz/chegirma/already")).toBeNull();
  });

  it("detects competitor promokod alias paths", () => {
    expect(isCompetitorPromokodAliasPath("uz", "promokod", "yandex-eats")).toBe(true);
    expect(isCompetitorPromokodAliasPath("ru", "promokod", "yandex-eats")).toBe(false);
    expect(isCompetitorPromokodAliasPath("ru", "promokod", "yandex-eats-promokod")).toBe(true);
  });
});
