import { afterEach, describe, expect, it } from "vitest";
import { GONE_SLUGS, isGone, resolveRedirectChain } from "./redirects";

const originalGoneSlugs = new Set(GONE_SLUGS);

afterEach(() => {
  GONE_SLUGS.clear();
  for (const slug of originalGoneSlugs) {
    GONE_SLUGS.add(slug);
  }
});

describe("isGone", () => {
  it("treats promo and promocode type aliases as equivalent", () => {
    GONE_SLUGS.add("promo:legacy-offer");

    expect(isGone("promo", "legacy-offer")).toBe(true);
    expect(isGone("promocode", "legacy-offer")).toBe(true);
  });

  it("supports reverse compatibility when set entry uses promocode prefix", () => {
    GONE_SLUGS.add("promocode:seasonal-deal");

    expect(isGone("promocode", "seasonal-deal")).toBe(true);
    expect(isGone("promo", "seasonal-deal")).toBe(true);
  });

  it("still respects non-promocode types strictly", () => {
    GONE_SLUGS.add("brand:old-brand");

    expect(isGone("brand", "old-brand")).toBe(true);
    expect(isGone("category", "old-brand")).toBe(false);
  });

  it("matches slug-only entries for all types", () => {
    GONE_SLUGS.add("global-removed-slug");

    expect(isGone("promocode", "global-removed-slug")).toBe(true);
    expect(isGone("store", "global-removed-slug")).toBe(true);
  });
});

describe("resolveRedirectChain", () => {
  async function resolveFromMap(
    startPath: string,
    map: Record<string, string | undefined>,
    maxHops?: number
  ) {
    return resolveRedirectChain(startPath, async (fromPath) => map[fromPath] ?? null, maxHops);
  }

  it("returns null when no redirect exists", async () => {
    const result = await resolveFromMap("/en/promocode/unknown", {});
    expect(result).toBeNull();
  });

  it("resolves a single-hop redirect", async () => {
    const result = await resolveFromMap("/a", { "/a": "/b" });
    expect(result).toBe("/b");
  });

  it("resolves multi-hop redirect chains to the final target", async () => {
    const result = await resolveFromMap("/a", {
      "/a": "/b",
      "/b": "/c",
      "/c": "/d",
    });
    expect(result).toBe("/d");
  });

  it("returns null for redirect cycles", async () => {
    const result = await resolveFromMap("/a", {
      "/a": "/b",
      "/b": "/c",
      "/c": "/a",
    });
    expect(result).toBeNull();
  });

  it("returns null for self-referencing redirects", async () => {
    const result = await resolveFromMap("/a", {
      "/a": "/a",
    });
    expect(result).toBeNull();
  });

  it("returns null when chain exceeds max hop budget", async () => {
    const result = await resolveFromMap(
      "/a",
      {
        "/a": "/b",
        "/b": "/c",
        "/c": "/d",
      },
      2
    );
    expect(result).toBeNull();
  });
});
