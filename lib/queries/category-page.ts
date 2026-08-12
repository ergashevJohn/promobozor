/**
 * Category page data fetching helpers
 */

import {
  brands,
  brandTranslations,
  categories,
  categoryTranslations,
  db,
  promocodes,
  promocodeTranslations,
  stores,
  storeTranslations,
} from "@/lib/db";
import type { PromocodeListRow } from "@/lib/queries/promocode-list";
import { mapPromocodeListRow, promocodeListSelectWithCategory } from "@/lib/queries/promocode-list";
import { and, asc, desc, eq, isNull, lte, ne, or, sql } from "drizzle-orm";
import type { Promocode } from "@/components/public/types";
import { unstable_cache } from "next/cache";

type Locale = "uz" | "ru" | "en";

export async function fetchCategoryPageData(
  categoryId: string,
  locale: Locale
): Promise<{
  stats: { total: number } | null;
  promocodes: Promocode[];
}> {
  const now = new Date();
  const baseConditions = [
    eq(promocodes.categoryId, categoryId),
    ne(promocodes.status, "draft"),
    or(isNull(promocodes.storeId), eq(stores.isActive, true)),
    or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
  ];

  const statsQuery = db
    .select({
      total: sql<number>`COUNT(*)::int`.as("total"),
    })
    .from(promocodes)
    .leftJoin(stores, eq(promocodes.storeId, stores.id))
    .where(and(...baseConditions));

  const allQuery = db
    .select(promocodeListSelectWithCategory)
    .from(promocodes)
    .leftJoin(stores, eq(promocodes.storeId, stores.id))
    .innerJoin(categories, eq(promocodes.categoryId, categories.id))
    .leftJoin(brands, eq(promocodes.brandId, brands.id))
    .leftJoin(
      promocodeTranslations,
      and(
        eq(promocodeTranslations.promocodeId, promocodes.id),
        eq(promocodeTranslations.language, locale)
      )
    )
    .leftJoin(
      storeTranslations,
      and(eq(storeTranslations.storeId, stores.id), eq(storeTranslations.language, locale))
    )
    .leftJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.language, locale)
      )
    )
    .leftJoin(
      brandTranslations,
      and(eq(brandTranslations.brandId, brands.id), eq(brandTranslations.language, locale))
    )
    .where(and(...baseConditions))
    .orderBy(desc(promocodes.isFeatured), asc(promocodes.order))
    .limit(20);

  const [statsResult, allData] = await Promise.all([statsQuery, allQuery]);

  const allPromocodes = (allData as PromocodeListRow[]).map((row) =>
    mapPromocodeListRow(row, {
      includeStartsAt: false,
      includeConditions: true,
      includeMedia: true,
      includeCategory: true,
    })
  );

  return { stats: statsResult[0] || null, promocodes: allPromocodes };
}

/** Cached category hub promocodes + stats for ISR (revalidate 30m). */
export function getCachedCategoryPageData(categoryId: string, locale: Locale) {
  return unstable_cache(
    () => fetchCategoryPageData(categoryId, locale),
    ["category-page-data", categoryId, locale],
    {
      revalidate: 1800,
      tags: [
        "promocodes",
        "categories",
        `category-page-${categoryId}`,
        `category-page-${categoryId}-${locale}`,
      ],
    }
  )();
}
