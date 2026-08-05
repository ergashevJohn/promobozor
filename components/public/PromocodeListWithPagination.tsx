"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import LoadMore from "./LoadMore";
import PromocodeList from "./PromocodeList";
import type { Promocode } from "./types";

const EMPTY_FILTERS = {};

interface PromocodeListWithPaginationProps {
  initialPromocodes: Promocode[];
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
  translations: {
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
}

export default function PromocodeListWithPagination({
  initialPromocodes,
  totalCount,
  limit = 20,
  filters = EMPTY_FILTERS,
  translations,
}: PromocodeListWithPaginationProps) {
  const tCommon = useTranslations("common");
  const [additionalPromocodes, setAdditionalPromocodes] = useState<Promocode[]>([]);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const initialIdsKey = useMemo(
    () => JSON.stringify(initialPromocodes.map((p) => p.id)),
    [initialPromocodes]
  );

  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
  const [prevIdsKey, setPrevIdsKey] = useState(initialIdsKey);

  if (prevFiltersKey !== filtersKey || prevIdsKey !== initialIdsKey) {
    setPrevFiltersKey(filtersKey);
    setPrevIdsKey(initialIdsKey);
    setAdditionalPromocodes([]);
  }

  const promocodes = useMemo(
    () => [...initialPromocodes, ...additionalPromocodes],
    [initialPromocodes, additionalPromocodes]
  );

  const handleLoadMore = (newPromocodes: Promocode[]) => {
    setAdditionalPromocodes((prev) => {
      const existingIds = new Set([
        ...initialPromocodes.map((p) => p.id),
        ...prev.map((p) => p.id),
      ]);
      const unique = newPromocodes.filter((p) => !existingIds.has(p.id));
      return unique.length > 0 ? [...prev, ...unique] : prev;
    });
  };

  const hasMore = promocodes.length < totalCount;

  return (
    <>
      {totalCount > 0 && (
        <div className="bg-card/95 mb-6 flex items-center justify-between gap-4 rounded-[22px] border border-[color:var(--border)] px-4 py-3 shadow-[0_18px_40px_-30px_rgba(17,24,39,0.35)]">
          <div className="text-sm text-[color:var(--muted-foreground)]">
            <span className="text-foreground font-semibold">{promocodes.length}</span> /{" "}
            {totalCount}
          </div>
          <div className="brand-kicker !mb-0">{tCommon("listKicker")}</div>
        </div>
      )}
      <PromocodeList promocodes={promocodes} translations={translations} />
      {hasMore && (
        <LoadMore
          initialOffset={promocodes.length}
          limit={limit}
          filters={filters}
          onLoadMore={handleLoadMore}
        />
      )}
    </>
  );
}
