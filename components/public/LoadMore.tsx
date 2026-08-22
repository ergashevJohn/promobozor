"use client";

import { Button } from "@/components/ui/button";
import { sanitizeSearchQuery } from "@/lib/search";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import type { Promocode } from "./types";

interface LoadMoreProps {
  initialOffset: number;
  limit: number;
  filters: {
    storeId?: string;
    categoryId?: string;
    brandId?: string;
    search?: string;
    sortBy?: string;
    excludeFeatured?: boolean;
    featured?: boolean;
  };
  onLoadMore: (promocodes: Promocode[]) => void;
}

export default function LoadMore({ initialOffset, limit, filters, onLoadMore }: LoadMoreProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Use initialOffset as a key to reset state when offset changes
  // The parent component can use: <LoadMore key={initialOffset} ... />
  // This ensures fresh state when navigation occurs

  const handleLoadMore = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const sanitizedSearch = sanitizeSearchQuery(filters.search);
      const params = new URLSearchParams({
        lang: locale,
        limit: limit.toString(),
        offset: initialOffset.toString(),
        ...(filters.storeId && { storeId: filters.storeId }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.brandId && { brandId: filters.brandId }),
        ...(sanitizedSearch && { search: sanitizedSearch }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.excludeFeatured && { excludeFeatured: "true" }),
        ...(filters.featured && { featured: "true" }),
      });

      const response = await fetch(`/api/promocodes?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.promocodes && Array.isArray(data.promocodes) && data.promocodes.length > 0) {
        onLoadMore(data.promocodes);
        setHasMore(data.hasMore !== false && data.promocodes.length === limit);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more promocodes:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [filters, initialOffset, isLoading, limit, locale, onLoadMore]);

  if (!hasMore) {
    return null;
  }

  return (
    <div className="mt-12 flex justify-center">
      <Button
        onClick={handleLoadMore}
        disabled={isLoading}
        variant="outline"
        size="lg"
        className="bg-card min-w-[220px] rounded-2xl border-[color:var(--border)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent-red)] hover:shadow-[0_20px_40px_-28px_rgba(17,24,39,0.45)] active:scale-95"
      >
        {isLoading ? (
          <>
            <CircleNotchIcon className="mr-2 h-4 w-4 animate-spin" />
            {t("loading")}
          </>
        ) : (
          <>{t("loadMore")}</>
        )}
      </Button>
    </div>
  );
}
