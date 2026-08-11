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
import { and, desc, eq, gt, isNull, lte, ne, or, sql } from "drizzle-orm";

export async function fetchPromocodeData(slug: string, locale: "uz" | "ru" | "en") {
  const promocodeDataArray = await db
    .select({
      promocode: promocodes,
      store: stores,
      storeTranslation: storeTranslations,
      brand: brands,
      brandTranslation: brandTranslations,
      category: categories,
      categoryTranslation: categoryTranslations,
      promocodeTranslation: promocodeTranslations,
    })
    .from(promocodes)
    .leftJoin(stores, eq(promocodes.storeId, stores.id))
    .leftJoin(categories, eq(promocodes.categoryId, categories.id))
    .leftJoin(brands, eq(promocodes.brandId, brands.id))
    .innerJoin(
      promocodeTranslations,
      and(
        eq(promocodeTranslations.promocodeId, promocodes.id),
        eq(promocodeTranslations.language, locale),
        eq(promocodeTranslations.slug, slug)
      )
    )
    .leftJoin(
      storeTranslations,
      and(eq(storeTranslations.storeId, stores.id), eq(storeTranslations.language, locale))
    )
    .leftJoin(
      brandTranslations,
      and(eq(brandTranslations.brandId, brands.id), eq(brandTranslations.language, locale))
    )
    .leftJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.language, locale)
      )
    )
    .where(
      and(
        eq(promocodeTranslations.slug, slug),
        eq(promocodeTranslations.language, locale),
        or(isNull(promocodes.storeId), eq(stores.isActive, true))
      )
    )
    .limit(1);

  return promocodeDataArray[0];
}

export async function fetchRelatedPromocodes(
  promocodeId: string,
  storeId: string | null,
  categoryId: string | null,
  locale: "uz" | "ru" | "en"
) {
  const now = new Date();

  return db
    .select({
      promocode: promocodes,
      store: stores,
      storeTranslation: storeTranslations,
      brand: brands,
      brandTranslation: brandTranslations,
      category: categories,
      categoryTranslation: categoryTranslations,
      promocodeTranslation: promocodeTranslations,
    })
    .from(promocodes)
    .leftJoin(stores, eq(promocodes.storeId, stores.id))
    .leftJoin(categories, eq(promocodes.categoryId, categories.id))
    .leftJoin(brands, eq(promocodes.brandId, brands.id))
    .innerJoin(
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
    .where(
      and(
        ne(promocodes.id, promocodeId),
        eq(promocodes.status, "active"),
        or(isNull(promocodes.storeId), eq(stores.isActive, true)),
        or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now)),
        or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
        or(
          storeId ? eq(promocodes.storeId, storeId) : sql`false`,
          categoryId ? eq(promocodes.categoryId, categoryId) : sql`false`
        )
      )
    )
    .orderBy(desc(promocodes.isFeatured), desc(promocodes.createdAt))
    .limit(4);
}

export async function findRedirectUrl(slug: string, locale: "uz" | "ru" | "en") {
  const [altSlug] = await db
    .select({
      promocodeId: promocodeTranslations.promocodeId,
      language: promocodeTranslations.language,
    })
    .from(promocodeTranslations)
    .innerJoin(promocodes, eq(promocodeTranslations.promocodeId, promocodes.id))
    .leftJoin(stores, eq(promocodes.storeId, stores.id))
    .where(
      and(
        eq(promocodeTranslations.slug, slug),
        or(isNull(promocodes.storeId), eq(stores.isActive, true))
      )
    )
    .limit(1);

  if (altSlug) {
    const [correctTranslation] = await db
      .select({ slug: promocodeTranslations.slug })
      .from(promocodeTranslations)
      .where(
        and(
          eq(promocodeTranslations.promocodeId, altSlug.promocodeId),
          eq(promocodeTranslations.language, locale)
        )
      )
      .limit(1);

    if (correctTranslation) {
      return `/${locale}/promocode/${correctTranslation.slug}`;
    }
  }

  return null;
}
