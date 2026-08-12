/**
 * Store page data fetching helpers
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

export async function fetchStorePageData(
  storeId: string,
  locale: "uz" | "ru" | "en"
): Promise<{
  stats: { total: number; featured: number; totalViews: number; totalCopies: number } | null;
  promocodes: Promocode[];
}> {
  const now = new Date();
  const baseConditions = [
    eq(promocodes.storeId, storeId),
    ne(promocodes.status, "draft"),
    eq(stores.isActive, true),
    or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
  ];

  const statsQuery = db
    .select({
      total: sql<number>`COUNT(*)::int`.as("total"),
      featured: sql<number>`COUNT(*) FILTER (WHERE ${promocodes.isFeatured} = true)::int`.as(
        "featured"
      ),
      totalViews: sql<number>`COALESCE(SUM(${promocodes.viewsCount}), 0)::int`.as("total_views"),
      totalCopies: sql<number>`COALESCE(SUM(${promocodes.copyCount}), 0)::int`.as("total_copies"),
    })
    .from(promocodes)
    .leftJoin(stores, eq(promocodes.storeId, stores.id))
    .where(and(...baseConditions));

  const allQuery = db
    .select(promocodeListSelectWithCategory)
    .from(promocodes)
    .leftJoin(stores, eq(promocodes.storeId, stores.id))
    .leftJoin(categories, eq(promocodes.categoryId, categories.id))
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
