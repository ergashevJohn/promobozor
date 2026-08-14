import { describe, expect, it } from "vitest";
import { getEntityFaqItems, getHowToSteps } from "./entity-faq";
import { getHubEditorial, listHubEditorialTargets } from "./hub-editorial";
import { normalizePromokodAliasSlug, resolvePromokodAliasTarget } from "./promokod-alias";
import {
  getTopInventoryTargets,
  summarizeInventoryGap,
  TOP_HUB_COUNT,
} from "./seo/inventory-targets";

describe("entity-faq", () => {
  it("returns localized FAQ items that mention the entity", () => {
    const items = getEntityFaqItems("Uzum", "uz");
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items[0]?.question).toContain("Uzum");
    expect(items[0]?.answer).toContain("Uzum");
  });

  it("falls back to uz when locale is unknown", () => {
    const items = getEntityFaqItems("Click", "xx");
    expect(items[0]?.question).toContain("Click");
  });

  it("prefers DB faqJson over templates", () => {
    const items = getEntityFaqItems("Uzum", "uz", [{ question: "Custom Q?", answer: "Custom A." }]);
    expect(items).toEqual([{ question: "Custom Q?", answer: "Custom A." }]);
  });

  it("returns how-to steps for promocode pages", () => {
    const steps = getHowToSteps("10% chegirma", "Uzum", "en");
    expect(steps).toHaveLength(4);
    expect(steps[0]?.text).toContain("10% chegirma");
    expect(steps[2]?.text).toContain("Uzum");
  });

  it("uses howToHtml when provided", () => {
    const steps = getHowToSteps("Sale", "Uzum", "en", {
      howToHtml: "<ol><li>Copy code</li><li>Paste at checkout</li></ol>",
    });
    expect(steps).toHaveLength(2);
    expect(steps[0]?.text).toContain("Copy code");
  });
});

describe("promokod-alias", () => {
  it("strips competitor suffix from slug", () => {
    expect(normalizePromokodAliasSlug("yandex-eats-promokod")).toBe("yandex-eats");
    expect(normalizePromokodAliasSlug("uzum-promocode")).toBe("uzum");
  });

  it("prefers store hits over brand hits", () => {
    expect(
      resolvePromokodAliasTarget({
        slug: "uzum",
        storeSlug: "uzum",
        brandSlug: "uzum",
      })
    ).toEqual({ type: "store", slug: "uzum" });
  });

  it("uses normalized slug fallback", () => {
    expect(
      resolvePromokodAliasTarget({
        slug: "yandex-eats-promokod",
        brandSlugNormalized: "yandex-eats",
      })
    ).toEqual({ type: "brand", slug: "yandex-eats" });
  });
});

describe("hub-editorial + inventory targets", () => {
  it("covers at least top hub count", () => {
    expect(listHubEditorialTargets().length).toBeGreaterThanOrEqual(TOP_HUB_COUNT);
    expect(getTopInventoryTargets().length).toBe(TOP_HUB_COUNT);
  });

  it("resolves editorial copy by slug", () => {
    const hub = getHubEditorial("yandex-eats", "uz");
    expect(hub?.description.length).toBeGreaterThan(80);
    expect(hub?.canonicalSlug).toBe("yandex-eats");
  });

  it("summarizes inventory gaps without inventing counts", () => {
    const gap = summarizeInventoryGap(31);
    expect(gap.meetsFloor).toBe(false);
    expect(gap.deficitToFloor).toBe(119);
    expect(gap.deficitToTarget).toBe(269);
  });
});
