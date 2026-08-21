"use client";

import { useQuery } from "@tanstack/react-query";

type FilterItem = {
  id: string;
  translations: Array<{ language: string; name: string; slug: string }>;
};

type FilterCatalog = { stores: FilterItem[]; categories: FilterItem[]; brands: FilterItem[] };

/**
 * Fetch filter catalog data from API.
 * Automatically cached and deduplicated by React Query.
 */
async function fetchFilterCatalog(locale: string): Promise<FilterCatalog> {
  const response = await fetch(`/api/filters?lang=${encodeURIComponent(locale)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as Partial<FilterCatalog>;
  return {
    stores: Array.isArray(data.stores) ? data.stores : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
    brands: Array.isArray(data.brands) ? data.brands : [],
  };
}

/**
 * React Query hook for fetching filter catalog data.
 * Handles caching, request deduplication, race conditions, retries, and refetch-on-focus automatically.
 */
export function useFilterCatalog(locale: string, shouldFetch: boolean) {
  return useQuery({
    queryKey: ["filter-catalog", locale],
    queryFn: () => fetchFilterCatalog(locale),
    enabled: shouldFetch,
    staleTime: 10 * 60 * 1000, // 10 minutes - filters don't change often
    retry: 1,
  });
}
