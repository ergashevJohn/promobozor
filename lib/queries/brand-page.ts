/**
 * Brand page data fetching helpers
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

export async function fetchBrandPageData(
  brandId: string,
  locale: "uz" | "ru" | "en"
): Promise<{
  stats: { total: number } | null;
  promocodes: Promocode[];
}> {
  const now = new Date();
  const baseConditions = [
    eq(promocodes.brandId, brandId),
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

  const brandFallback = {
    id: brandId,
    imageUrl: null,
    websiteUrl: null,
    translations: [{ language: locale, name: "", slug: "" }],
  };

  const allPromocodes = (allData as PromocodeListRow[]).map((row) =>
    mapPromocodeListRow(row, {
      includeStartsAt: false,
      includeConditions: true,
      includeMedia: true,
      includeCategory: true,
      brandFallback,
    })
  );

  return { stats: statsResult[0] || null, promocodes: allPromocodes };
}
