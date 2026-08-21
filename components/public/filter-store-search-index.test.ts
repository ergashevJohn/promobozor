import { describe, expect, it } from "vitest";
import type { StoreSearchIndexItem } from "@/components/public/StoresDirectoryGrid";
import { filterStoreSearchIndex } from "./filter-store-search-index";

function store(
  partial: Partial<StoreSearchIndexItem> & Pick<StoreSearchIndexItem, "id">
): StoreSearchIndexItem {
  return {
    name: partial.name ?? partial.id,
    slug: partial.slug ?? partial.id,
    searchText: partial.searchText ?? partial.id,
    logoUrl: partial.logoUrl ?? null,
    promocodesCount: partial.promocodesCount ?? 0,
    ...partial,
  };
}

describe("filterStoreSearchIndex", () => {
  const uzum = store({
    id: "1",
    name: "Uzum",
    slug: "uzum",
    searchText: "uzum market tashkent",
    promocodesCount: 4,
  });
  const yandex = store({
    id: "2",
    name: "Yandex Eats",
    slug: "yandex-eats",
    searchText: "yandex eats yetkazib berish",
    logoUrl: "https://cdn.example/yandex.png",
    promocodesCount: 9,
  });
  const click = store({
    id: "3",
    name: "Click",
    slug: "click",
    searchText: "click to'lov",
    promocodesCount: 2,
  });

  it("returns null for empty or whitespace-only queries so SSR grid stays mounted", () => {
    expect(filterStoreSearchIndex([uzum], "")).toBeNull();
    expect(filterStoreSearchIndex([uzum], "   ")).toBeNull();
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterStoreSearchIndex([uzum, click], "payme")).toEqual([]);
  });

  it("matches case-insensitively after trimming the query", () => {
    expect(filterStoreSearchIndex([uzum, yandex, click], "  EATS ")).toEqual([
      {
        id: "2",
        name: "Yandex Eats",
        slug: "yandex-eats",
        logoUrl: "https://cdn.example/yandex.png",
        promocodesCount: 9,
      },
    ]);
  });

  it("preserves original index order for multiple matches", () => {
    expect(filterStoreSearchIndex([yandex, uzum, click], "a")).toEqual([
      {
        id: "2",
        name: "Yandex Eats",
        slug: "yandex-eats",
        logoUrl: "https://cdn.example/yandex.png",
        promocodesCount: 9,
      },
      {
        id: "1",
        name: "Uzum",
        slug: "uzum",
        logoUrl: null,
        promocodesCount: 4,
      },
    ]);
  });

  it("omits searchText from directory items", () => {
    const [match] = filterStoreSearchIndex([yandex], "yandex") ?? [];
    expect(match).toBeDefined();
    expect(match).not.toHaveProperty("searchText");
  });

  it("skips holes in sparse indexes the same way filter() would", () => {
    const sparse = [uzum, , click] as StoreSearchIndexItem[];
    expect(filterStoreSearchIndex(sparse, "click")).toEqual([
      {
        id: "3",
        name: "Click",
        slug: "click",
        logoUrl: null,
        promocodesCount: 2,
      },
    ]);
  });
});
