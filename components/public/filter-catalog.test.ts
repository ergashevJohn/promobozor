import { afterEach, describe, expect, it, vi } from "vitest";
import { clearFilterCatalogCache, getFilterCatalog } from "./filter-catalog";

describe("filter catalog cache", () => {
  afterEach(() => {
    clearFilterCatalogCache();
    vi.unstubAllGlobals();
  });

  it("deduplicates concurrent requests for the same locale", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        stores: [{ id: "store", translations: [] }],
        categories: [],
        brands: [],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([getFilterCatalog("en"), getFilterCatalog("en")]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first.stores).toHaveLength(1);
  });

  it("does not retain a failed request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getFilterCatalog("uz")).rejects.toThrow("HTTP 500");
    await expect(getFilterCatalog("uz")).resolves.toEqual({
      stores: [],
      categories: [],
      brands: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
