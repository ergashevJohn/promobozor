"use client";

import { Button } from "@/components/ui/button";
import { FunnelSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useFilterCatalog } from "./hooks/use-filter-catalog";

const FilterBar = dynamic(() => import("@/components/public/FilterBar"));

type FilterItem = {
  id: string;
  translations: Array<{ language: string; name: string; slug: string }>;
};

type FilterCatalog = { stores: FilterItem[]; categories: FilterItem[]; brands: FilterItem[] };

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

const EMPTY_CATALOG: FilterCatalog = { stores: [], categories: [], brands: [] };

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
  const { data: catalog = EMPTY_CATALOG, isLoading } = useFilterCatalog(locale, isOpen);

  return (
    <div className="mb-5 md:mb-6">
      {!isOpen ? (
        <Button
          type="button"
          variant="outline"
          className="bg-card min-h-12 w-full justify-center gap-2 md:w-auto md:px-5"
          aria-expanded="false"
          aria-controls="promocode-filters"
          onClick={() => setIsOpen(true)}
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
