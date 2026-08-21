"use client";

import { Button } from "@/components/ui/button";
import { FunnelSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const FilterBar = dynamic(() => import("@/components/public/FilterBar"));

type FilterItem = {
  id: string;
  translations: Array<{ language: string; name: string; slug: string }>;
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

type FilterCatalog = { stores: FilterItem[]; categories: FilterItem[]; brands: FilterItem[] };

type Props = {
  locale: string;
  pathname: string;
  currentParams: Record<string, string>;
  translations: FilterTranslations;
  filterKey: string;
};

const EMPTY_CATALOG: FilterCatalog = { stores: [], categories: [], brands: [] };
const catalogRequests = new Map<string, Promise<FilterCatalog>>();

function getFilterCatalog(locale: string): Promise<FilterCatalog> {
  const cached = catalogRequests.get(locale);
  if (cached) return cached;

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
      catalogRequests.delete(locale);
      throw error;
    });

  catalogRequests.set(locale, request);
  return request;
}

/** Loads the filter catalog and select UI only after the visitor opens filters. */
export function PromocodesFiltersLazy({
  locale,
  pathname,
  currentParams,
  translations,
  filterKey,
}: Props) {
  const hasActiveFilters = useMemo(
    () => Boolean(currentParams.storeId || currentParams.categoryId || currentParams.brandId),
    [currentParams.brandId, currentParams.categoryId, currentParams.storeId]
  );
  const [isOpen, setIsOpen] = useState(hasActiveFilters);
  const [catalog, setCatalog] = useState<FilterCatalog>(EMPTY_CATALOG);
  const [isLoading, setIsLoading] = useState(hasActiveFilters);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void getFilterCatalog(locale)
      .then((data) => {
        if (active) setCatalog(data);
      })
      .catch((error) => console.error("Error loading filters:", error))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, locale]);

  return (
    <div className="mb-5 md:mb-6">
      {!isOpen ? (
        <Button
          type="button"
          variant="outline"
          className="bg-card min-h-12 w-full justify-center gap-2 md:w-auto md:px-5"
          aria-expanded="false"
          aria-controls="promocode-filters"
          onClick={() => {
            setIsLoading(true);
            setIsOpen(true);
          }}
        >
          <FunnelSimpleIcon size={18} aria-hidden="true" />
          {translations.filters}
        </Button>
      ) : isLoading ? (
        <div
          id="promocode-filters"
          className="bg-card/70 h-12 rounded-2xl border border-[color:var(--border)] md:h-44"
          aria-live="polite"
          aria-label={translations.filters}
        />
      ) : (
        <div id="promocode-filters">
          <FilterBar
            key={filterKey}
            pathname={pathname}
            stores={catalog.stores}
            categories={catalog.categories}
            brands={catalog.brands}
            currentParams={currentParams}
            translations={translations}
          />
        </div>
      )}
    </div>
  );
}
