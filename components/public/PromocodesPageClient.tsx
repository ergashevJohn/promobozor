"use client";

import FilterBar from "@/components/public/FilterBar";
import PromocodeList from "@/components/public/PromocodeList";
import SearchBar from "@/components/public/SearchBar";
import ServerPagination from "@/components/public/ServerPagination";
import type { Promocode } from "@/components/public/types";
import { SkeletonCardGrid } from "@/components/ui/skeleton-card";
import { useBrowserSearchParams } from "@/lib/hooks/use-browser-search-params";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const ITEMS_PER_PAGE = 24;

const FILTER_QUERY_KEYS = [
  "storeId",
  "categoryId",
  "brandId",
  "search",
  "sortBy",
  "featured",
] as const;

export type PromocodesInitialSectionData = {
  currentPage: number;
  totalPages: number;
  totalPromocodesCount: number;
  promocodesList: Promocode[];
};

type FilterItem = {
  id: string;
  translations: Array<{
    language: string;
    name: string;
    slug: string;
  }>;
};

type CardTranslations = {
  featured: string;
  verified: string;
  fresh: string;
  popular: string;
  endingSoon: string;
  unlimited: string;
  unknownStore: string;
  storeTitle: string;
  promocodeTitle: string;
  activateLink: string;
  details: string;
  viewDetails: string;
  storeOffer: string;
  brandOffer: string;
  directDeal: string;
  codeReady: string;
  dealRoute: string;
  promoCodeLabel: string;
  copy: string;
  copied: string;
  getDeal: string;
  like: string;
  dislike: string;
  expired: string;
  disabled: string;
  codeCopied: string;
  copyError: string;
};

export type PromocodesPageTranslations = {
  pageTitle: string;
  pageDescription: string;
  offersFound: string;
  page: string;
  searchLabel: string;
  pagination: string;
  previous: string;
  next: string;
  noPromocodes: string;
  noPromocodesDescription: string;
  emptyHint: string;
  resetFiltersCta: string;
  lowResultTitle: string;
  lowResultDescription: string;
  filter: {
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
  card: CardTranslations;
};

type PromocodesPageClientProps = {
  locale: string;
  initialSectionData: PromocodesInitialSectionData;
  stores: FilterItem[];
  categories: FilterItem[];
  brands: FilterItem[];
  translations: PromocodesPageTranslations;
  /** SSR default list (PromocodeListOptimized + pagination) for unfiltered page 1 */
  children: ReactNode;
};

function searchParamsToRecord(searchParams: URLSearchParams): Record<string, string> {
  const record: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (value) {
      record[key] = value;
    }
  });
  return record;
}

function hasActiveFilters(searchParams: URLSearchParams): boolean {
  return FILTER_QUERY_KEYS.some((key) => {
    const value = searchParams.get(key);
    return value !== null && value !== "";
  });
}

function needsClientFetch(searchParams: URLSearchParams): boolean {
  if (hasActiveFilters(searchParams)) {
    return true;
  }
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  return page > 1;
}

function approximateTotal(
  offset: number,
  listLength: number,
  total?: number,
  hasMore?: boolean
): number {
  if (typeof total === "number" && Number.isFinite(total) && total >= 0) {
    return total;
  }
  if (hasMore) {
    return offset + listLength + 1;
  }
  return offset + listLength;
}

export default function PromocodesPageClient({
  locale,
  initialSectionData,
  stores,
  categories,
  brands,
  translations,
  children,
}: PromocodesPageClientProps) {
  const searchParams = useBrowserSearchParams();
  const currentParams = useMemo(() => searchParamsToRecord(searchParams), [searchParams]);
  const shouldFetch = useMemo(() => needsClientFetch(searchParams), [searchParams]);
  const paramsKey = searchParams.toString();

  const [fetchedData, setFetchedData] = useState<PromocodesInitialSectionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const sectionData: PromocodesInitialSectionData = shouldFetch
    ? (fetchedData ?? initialSectionData)
    : initialSectionData;

  useEffect(() => {
    if (!shouldFetch) {
      setIsLoading(false);
      setFetchError(false);
      setFetchedData(null);
      return;
    }

    const activeParams = new URLSearchParams(paramsKey);
    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setFetchError(false);

      const currentPage = Math.max(1, parseInt(activeParams.get("page") || "1", 10) || 1);
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const query = new URLSearchParams({
        lang: locale,
        limit: String(ITEMS_PER_PAGE),
        offset: String(offset),
      });

      for (const key of FILTER_QUERY_KEYS) {
        const value = activeParams.get(key);
        if (value) {
          query.set(key, value);
        }
      }

      try {
        const response = await fetch(`/api/promocodes?${query.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as {
          promocodes?: Promocode[];
          total?: number;
          hasMore?: boolean;
        };

        const promocodesList = Array.isArray(data.promocodes) ? data.promocodes : [];
        const totalPromocodesCount = approximateTotal(
          offset,
          promocodesList.length,
          data.total,
          data.hasMore
        );
        const totalPages = Math.max(1, Math.ceil(totalPromocodesCount / ITEMS_PER_PAGE));

        if (!cancelled) {
          setFetchedData({
            currentPage,
            totalPages,
            totalPromocodesCount,
            promocodesList,
          });
        }
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        console.error("Error fetching promocodes:", error);
        if (!cancelled) {
          setFetchError(true);
          setFetchedData({
            currentPage: Math.max(1, parseInt(activeParams.get("page") || "1", 10) || 1),
            totalPages: 1,
            totalPromocodesCount: 0,
            promocodesList: [],
          });
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [shouldFetch, paramsKey, locale, initialSectionData]);

  const storeIdFilter = currentParams.storeId;
  const categoryIdFilter = currentParams.categoryId;
  const brandIdFilter = currentParams.brandId;
  const searchQuery = currentParams.search;
  const hasListFilters = !!(storeIdFilter || categoryIdFilter || brandIdFilter || searchQuery);

  const paginationSearchParams: Record<string, string | undefined> = {
    storeId: currentParams.storeId,
    categoryId: currentParams.categoryId,
    brandId: currentParams.brandId,
    search: currentParams.search,
    sortBy: currentParams.sortBy,
    featured: currentParams.featured,
  };

  return (
    <>
      <section className="brand-hero relative -mt-[4.75rem] overflow-hidden pt-[4.75rem]">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute top-[-20%] left-1/2 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(232,78,66,0.14),transparent_68%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(232,78,66,0.18),transparent_68%)]" />
          <div className="absolute bottom-[-30%] left-1/2 h-[22rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(15,20,25,0.06),transparent_70%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(248,250,252,0.05),transparent_70%)]" />
        </div>

        <div className="page-shell relative pt-8 pb-6 md:pt-12 md:pb-10">
          <header className="mb-4 text-center md:mb-8">
            <h1 className="text-foreground mx-auto text-2xl font-semibold tracking-tight text-balance md:max-w-[20ch] md:text-4xl md:leading-[1.1]">
              {translations.pageTitle}
            </h1>
            <p className="text-muted-foreground mx-auto mt-2 line-clamp-2 max-w-[40ch] text-sm leading-6 md:mt-3 md:line-clamp-none md:max-w-[48ch] md:text-base md:leading-7">
              {translations.pageDescription}
            </p>
          </header>

          <div className="mb-3 md:mb-5">
            <SearchBar
              key={`search-${paramsKey}`}
              currentParams={currentParams}
              navigationMode="submit"
              targetPath="/promocodes"
            />
          </div>

          <FilterBar
            key={`filters-${paramsKey}`}
            pathname={`/${locale}/promocodes`}
            stores={stores}
            categories={categories}
            brands={brands}
            currentParams={currentParams}
            translations={translations.filter}
          />
        </div>
      </section>

      <div className="page-shell py-5 md:py-8">
        {isLoading ? (
          <SkeletonCardGrid count={ITEMS_PER_PAGE} />
        ) : shouldFetch ? (
          <section>
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-[color:var(--secondary)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]">
                {sectionData.totalPromocodesCount} {translations.offersFound}
              </div>
              {sectionData.totalPages > 1 && (
                <div className="bg-card rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted-foreground)]">
                  {translations.page} {sectionData.currentPage}/{sectionData.totalPages}
                </div>
              )}
              {searchQuery && (
                <div className="bg-card rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted-foreground)]">
                  {translations.searchLabel}{" "}
                  <span className="font-semibold text-[color:var(--foreground)]">
                    {searchQuery}
                  </span>
                </div>
              )}
              {fetchError && (
                <div className="bg-card rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted-foreground)]">
                  {translations.noPromocodesDescription}
                </div>
              )}
            </div>

            <PromocodeList
              promocodes={sectionData.promocodesList}
              translations={{
                noPromocodes: translations.noPromocodes,
                noPromocodesDescription: translations.noPromocodesDescription,
                emptyHint: translations.emptyHint,
                emptyActionLabel: hasListFilters ? translations.resetFiltersCta : undefined,
                emptyActionHref: hasListFilters ? "/promocodes" : undefined,
                card: translations.card,
              }}
            />

            {sectionData.totalPromocodesCount > 0 &&
              sectionData.totalPromocodesCount <= 3 &&
              hasListFilters && (
                <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--secondary)]/80 p-4 text-sm shadow-[0_18px_40px_-32px_rgba(17,24,39,0.25)]">
                  <div className="font-semibold text-[color:var(--foreground)]">
                    {translations.lowResultTitle}
                  </div>
                  <p className="mt-2 text-[color:var(--muted-foreground)]">
                    {translations.lowResultDescription}
                  </p>
                </div>
              )}

            <ServerPagination
              currentPage={sectionData.currentPage}
              totalPages={sectionData.totalPages}
              baseUrl="/promocodes"
              searchParams={paginationSearchParams}
              translations={{
                ariaLabel: translations.pagination,
                previous: translations.previous,
                next: translations.next,
                page: translations.page,
              }}
            />
          </section>
        ) : (
          children
        )}
      </div>
    </>
  );
}
