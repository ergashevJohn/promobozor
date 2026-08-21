"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import LoadMore from "./LoadMore";
import type { Promocode } from "./types";

const EMPTY_FILTERS = {};
const PromocodeList = dynamic(() => import("./PromocodeList"));

export type PromocodeListTranslations = {
  noPromocodes: string;
  noPromocodesDescription: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  emptyHint?: string;
  card: {
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
    conditionsLabel?: string;
    codeCopied: string;
    copyError: string;
  };
};

interface PromocodeListWithPaginationProps {
  /** @deprecated Prefer initialCount + initialIds + children */
  initialPromocodes?: Promocode[];
  /** Number of SSR cards already rendered in children */
  initialCount?: number;
  /** Ids of SSR cards for load-more dedupe */
  initialIds?: string[];
  totalCount: number;
  limit?: number;
  filters?: {
    storeId?: string;
    categoryId?: string;
    brandId?: string;
    search?: string;
    sortBy?: string;
    excludeFeatured?: boolean;
    featured?: boolean;
  };
  translations: PromocodeListTranslations;
  listKicker: string;
  /** Desktop can fill the first page after first paint without blocking mobile. */
  autoLoadDesktopBatches?: number;
  /** SSR initial list (PromocodeListOptimized). Extra pages append client cards. */
  children?: ReactNode;
}

/**
 * Thin client wrapper: SSR list via children; only offset/ids/total cross the boundary
 * (not the full promocode objects) when initialCount/initialIds are provided.
 */
export default function PromocodeListWithPagination({
  initialPromocodes,
  initialCount,
  initialIds,
  totalCount,
  limit = 20,
  filters = EMPTY_FILTERS,
  translations,
  listKicker,
  autoLoadDesktopBatches = 0,
  children,
}: PromocodeListWithPaginationProps) {
  const resolvedCount = initialCount ?? initialPromocodes?.length ?? 0;
  const resolvedIds = initialIds ?? initialPromocodes?.map((p) => p.id) ?? [];
  const [additionalPromocodes, setAdditionalPromocodes] = useState<Promocode[]>([]);

  const visibleCount = resolvedCount + additionalPromocodes.length;
  const hasMore = visibleCount < totalCount;

  const handleLoadMore = (newPromocodes: Promocode[]) => {
    setAdditionalPromocodes((prev) => {
      const existingIds = new Set([...resolvedIds, ...prev.map((p) => p.id)]);
      const unique = newPromocodes.filter((p) => !existingIds.has(p.id));
      return unique.length > 0 ? [...prev, ...unique] : prev;
    });
  };

  return (
    <>
      {totalCount > 0 && (
        <div className="bg-card/95 mb-6 flex items-center justify-between gap-4 rounded-[22px] border border-[color:var(--border)] px-4 py-3 shadow-[0_18px_40px_-30px_rgba(17,24,39,0.35)]">
          <div className="text-sm text-[color:var(--muted-foreground)]">
            <span className="text-foreground font-semibold">{visibleCount}</span> / {totalCount}
          </div>
          <div className="brand-kicker !mb-0">{listKicker}</div>
        </div>
      )}
      {children ??
        (initialPromocodes ? (
          <PromocodeList promocodes={initialPromocodes} translations={translations} />
        ) : null)}
      {additionalPromocodes.length > 0 && (
        <div className="mt-8">
          <PromocodeList promocodes={additionalPromocodes} translations={translations} />
        </div>
      )}
      {hasMore && (
        <LoadMore
          key={visibleCount}
          initialOffset={visibleCount}
          limit={limit}
          filters={filters}
          autoLoadDesktop={additionalPromocodes.length < autoLoadDesktopBatches * limit}
          onLoadMore={handleLoadMore}
        />
      )}
    </>
  );
}
