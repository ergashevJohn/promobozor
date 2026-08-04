import { brands, categories, db, promocodes, stores } from "@/lib/db";
import { and, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

interface PromocodeCountStats {
  total: number;
  featured: number;
  totalViews?: number;
  totalCopies?: number;
}

const CACHE_REVALIDATE_SECONDS = 300;

async function getStorePromocodeCounts(storeId: string): Promise<PromocodeCountStats | null> {
  try {
    const now = new Date();

    const [result] = await db
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
      .where(
        and(
          eq(promocodes.storeId, storeId),
          eq(promocodes.status, "active"),
          eq(stores.isActive, true),
          or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now)),
          or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now))
        )
      )
      .limit(1);

    if (!result) return null;

    return {
      total: result.total,
      featured: result.featured,
      totalViews: result.totalViews,
      totalCopies: result.totalCopies,
    };
  } catch {
    return null;
  }
}

async function getCategoryPromocodeCounts(
  categoryId: string
): Promise<{ total: number; storeCount: number } | null> {
  try {
    const now = new Date();

    const [counts] = await db
      .select({
        total: sql<number>`COUNT(*)::int`.as("total"),
        storeCount: sql<number>`COUNT(DISTINCT ${promocodes.storeId})::int`.as("store_count"),
      })
      .from(promocodes)
      .leftJoin(categories, eq(promocodes.categoryId, categories.id))
      .where(
        and(
          eq(promocodes.categoryId, categoryId),
          eq(promocodes.status, "active"),
          eq(categories.isActive, true),
          or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now)),
          or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now))
        )
      )
      .limit(1);

    if (!counts) return null;

    return {
      total: counts.total,
      storeCount: counts.storeCount,
    };
  } catch {
    return null;
  }
}

/**
 * Get active promocode counts for a brand
 */
async function getBrandPromocodeCounts(brandId: string): Promise<{ total: number } | null> {
  try {
    const now = new Date();

    const [counts] = await db
      .select({
        total: sql<number>`COUNT(*)::int`.as("total"),
      })
      .from(promocodes)
      .leftJoin(brands, eq(promocodes.brandId, brands.id))
      .where(
        and(
          eq(promocodes.brandId, brandId),
          eq(promocodes.status, "active"),
          eq(brands.isActive, true),
          or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now)),
          or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now))
        )
      )
      .limit(1);

    if (!counts) return null;

    return { total: counts.total };
  } catch {
    return null;
  }
}

export const getCachedStorePromocodeCounts = (storeId: string) =>
  unstable_cache(
    async () => {
      const result = await getStorePromocodeCounts(storeId);
      return result ?? { total: 0, featured: 0, totalViews: 0, totalCopies: 0 };
    },
    ["store-promocode-counts", storeId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: ["promocodes", "stores", `store-counts-${storeId}`],
    }
  )();

/**
 * Cached version of getCategoryPromocodeCounts
 */
export const getCachedCategoryPromocodeCounts = (categoryId: string) =>
  unstable_cache(
    async () => {
      const result = await getCategoryPromocodeCounts(categoryId);
      return result ?? { total: 0, storeCount: 0 };
    },
    ["category-promocode-counts", categoryId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: ["promocodes", "categories", `category-counts-${categoryId}`],
    }
  )();

/**
 * Cached version of getBrandPromocodeCounts
 */
export const getCachedBrandPromocodeCounts = (brandId: string) =>
  unstable_cache(
    async () => {
      const result = await getBrandPromocodeCounts(brandId);
      return result ?? { total: 0 };
    },
    ["brand-promocode-counts", brandId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: ["promocodes", "brands", `brand-counts-${brandId}`],
    }
  )();
