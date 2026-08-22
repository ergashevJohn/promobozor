export type FilterItem = {
  id: string;
  translations: Array<{ language: string; name: string; slug: string }>;
};

export type FilterCatalog = {
  stores: FilterItem[];
  categories: FilterItem[];
  brands: FilterItem[];
};

const requests = new Map<string, Promise<FilterCatalog>>();

export async function getFilterCatalog(locale: string): Promise<FilterCatalog> {
  const existing = requests.get(locale);
  if (existing) return existing;

  const request = fetch(`/api/filters?lang=${encodeURIComponent(locale)}`)
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as Partial<FilterCatalog>;
      return {
        stores: Array.isArray(data.stores) ? data.stores : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        brands: Array.isArray(data.brands) ? data.brands : [],
      };
    })
    .catch((error) => {
      requests.delete(locale);
      throw error;
    });

  requests.set(locale, request);
  return request;
}

export function clearFilterCatalogCache() {
  requests.clear();
}
