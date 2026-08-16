"use client";

import FilterBar from "@/components/public/FilterBar";
import { useEffect, useState } from "react";

type FilterItem = {
  id: string;
  translations: Array<{
    language: string;
    name: string;
    slug: string;
  }>;
};

type FilterTranslations = {
  store: string;
  category: string;
  brand: string;
  sortBy: string;
  filters: string;
  kicker: string;
  title: string;
  description: string;
  activeFilters: string;
  allStores: string;
  allCategories: string;
  allBrands: string;
  newest: string;
  popular: string;
  ending: string;
  discount: string;
  clear: string;
  apply: string;
};

type Props = {
  locale: string;
  pathname: string;
  currentParams: Record<string, string>;
  translations: FilterTranslations;
  filterKey: string;
};

/**
 * Loads filter catalog after paint so the default SSR list is not blocked by
 * serializing stores/categories/brands into the client boundary.
 */
export function PromocodesFiltersLazy({
  locale,
  pathname,
  currentParams,
  translations,
  filterKey,
}: Props) {
  const [stores, setStores] = useState<FilterItem[]>([]);
  const [categories, setCategories] = useState<FilterItem[]>([]);
  const [brands, setBrands] = useState<FilterItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`/api/filters?lang=${encodeURIComponent(locale)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as {
          stores?: FilterItem[];
          categories?: FilterItem[];
          brands?: FilterItem[];
        };
        if (!cancelled) {
          setStores(Array.isArray(data.stores) ? data.stores : []);
          setCategories(Array.isArray(data.categories) ? data.categories : []);
          setBrands(Array.isArray(data.brands) ? data.brands : []);
          setReady(true);
        }
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        console.error("Error loading filters:", error);
        if (!cancelled) {
          setReady(true);
        }
      }
    };

    const schedule =
      typeof requestIdleCallback === "function"
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: 1500 })
        : (cb: () => void) => window.setTimeout(cb, 200);

    const idleId = schedule(() => {
      void load();
    });

    return () => {
      cancelled = true;
      controller.abort();
      if (typeof cancelIdleCallback === "function" && typeof idleId === "number") {
        cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId as number);
      }
    };
  }, [locale]);

  if (!ready) {
    // Same FilterBar chrome with empty options — avoids CLS from pulse → form swap
    return (
      <FilterBar
        key={`pending-${filterKey}`}
        pathname={pathname}
        stores={[]}
        categories={[]}
        brands={[]}
        currentParams={currentParams}
        translations={translations}
      />
    );
  }

  return (
    <FilterBar
      key={filterKey}
      pathname={pathname}
      stores={stores}
      categories={categories}
      brands={brands}
      currentParams={currentParams}
      translations={translations}
    />
  );
}
