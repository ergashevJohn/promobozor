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
import { getEntityPath } from "@/lib/routes";
import { unstable_cache } from "next/cache";
import type { PromocodeDataRow } from "./transformers";

type Locale = "uz" | "ru" | "en";

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

/** Normalize Date fields so unstable_cache JSON roundtrip stays stable. */
function serializePromocodeRow(row: {
  promocode: PromocodeDataRow["promocode"];
  store: PromocodeDataRow["store"];
  storeTranslation: PromocodeDataRow["storeTranslation"];
  brand: PromocodeDataRow["brand"];
  brandTranslation: PromocodeDataRow["brandTranslation"];
  category: PromocodeDataRow["category"];
  categoryTranslation: PromocodeDataRow["categoryTranslation"];
  promocodeTranslation: PromocodeDataRow["promocodeTranslation"];
}): PromocodeDataRow {
  return {
    ...row,
    promocode: {
      ...row.promocode,
      startsAt: toIsoString(row.promocode.startsAt),
      expiresAt: toIsoString(row.promocode.expiresAt),
      createdAt: toIsoString(row.promocode.createdAt),
      updatedAt: toIsoString(row.promocode.updatedAt),
    },
  };
}

export async function fetchPromocodeData(
  slug: string,
  locale: Locale
): Promise<{
  data: PromocodeDataRow;
  isActiveOffer: boolean;
} | null> {
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

  const row = promocodeDataArray[0];
  if (!row) return null;

  const data = serializePromocodeRow(row);
  const nowMs = Date.now();
  const expiresAtMs = data.promocode.expiresAt ? Date.parse(String(data.promocode.expiresAt)) : NaN;
  const startsAtMs = data.promocode.startsAt ? Date.parse(String(data.promocode.startsAt)) : NaN;
  const isActiveOffer =
    data.promocode.status === "active" &&
    (Number.isNaN(expiresAtMs) || expiresAtMs > nowMs) &&
    (Number.isNaN(startsAtMs) || startsAtMs <= nowMs);

  return { data, isActiveOffer };
}

export function getCachedPromocodeData(slug: string, locale: Locale) {
  return unstable_cache(
    () => fetchPromocodeData(slug, locale),
    ["promocode-by-slug", locale, slug],
    {
      revalidate: 1800,
      tags: ["promocodes", `promocode-${locale}-${slug}`],
    }
  )();
}

export async function fetchRelatedPromocodes(
  promocodeId: string,
  storeId: string | null,
  categoryId: string | null,
  locale: Locale
) {
  const now = new Date();

  const rows = await db
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

  return rows.map(serializePromocodeRow);
}

export function getCachedRelatedPromocodes(
  promocodeId: string,
  storeId: string | null,
  categoryId: string | null,
  locale: Locale
) {
  return unstable_cache(
    () => fetchRelatedPromocodes(promocodeId, storeId, categoryId, locale),
    ["promocode-related", promocodeId, storeId ?? "none", categoryId ?? "none", locale],
    {
      revalidate: 1800,
      tags: ["promocodes", `promocode-related-${promocodeId}`],
    }
  )();
}

export async function findRedirectUrl(slug: string, locale: Locale) {
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
      return getEntityPath(locale, "promocode", correctTranslation.slug);
    }
  }

  return null;
}

export function getCachedRedirectUrl(slug: string, locale: Locale) {
  return unstable_cache(() => findRedirectUrl(slug, locale), ["promocode-redirect", locale, slug], {
    revalidate: 1800,
    tags: ["promocodes", `promocode-redirect-${locale}-${slug}`],
  })();
}

export type PromocodeMetadataRow = {
  promocode: {
    id: string;
    discountType: "percent" | "amount";
    discountValue: number;
    currency: "UZS" | "USD" | "EUR" | null;
  };
  store: { logoUrl: string | null } | null;
  storeTranslation: { name: string } | null;
  promocodeTranslation: {
    title: string;
    metaTitle: string | null;
    metaDescription: string | null;
    conditions: string | null;
  } | null;
};

async function fetchPromocodeMetadataData(
  slug: string,
  locale: Locale
): Promise<PromocodeMetadataRow | null> {
  const now = new Date();
  const [promocodeData] = await db
    .select({
      promocode: {
        id: promocodes.id,
        discountType: promocodes.discountType,
        discountValue: promocodes.discountValue,
        currency: promocodes.currency,
      },
      store: {
        logoUrl: stores.logoUrl,
      },
      storeTranslation: {
        name: storeTranslations.name,
      },
      promocodeTranslation: {
        title: promocodeTranslations.title,
        metaTitle: promocodeTranslations.metaTitle,
        metaDescription: promocodeTranslations.metaDescription,
        conditions: promocodeTranslations.conditions,
      },
    })
    .from(promocodes)
    .leftJoin(stores, eq(promocodes.storeId, stores.id))
    .leftJoin(
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
    .where(
      and(
        eq(promocodeTranslations.slug, slug),
        eq(promocodeTranslations.language, locale),
        eq(promocodes.status, "active"),
        or(isNull(promocodes.storeId), eq(stores.isActive, true)),
        or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now)),
        or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now))
      )
    )
    .limit(1);

  return promocodeData ?? null;
}

export function getCachedPromocodeMetadataData(slug: string, locale: Locale) {
  return unstable_cache(
    () => fetchPromocodeMetadataData(slug, locale),
    ["promocode-metadata", locale, slug],
    {
      revalidate: 1800,
      tags: ["promocodes", `promocode-${locale}-${slug}`],
    }
  )();
}

export function getCachedPromocodeLanguageAlternates(promocodeId: string) {
  return unstable_cache(
    async () => {
      return db
        .select({
          language: promocodeTranslations.language,
          slug: promocodeTranslations.slug,
        })
        .from(promocodeTranslations)
        .where(eq(promocodeTranslations.promocodeId, promocodeId));
    },
    ["promocode-lang-alts", promocodeId],
    { revalidate: 1800, tags: ["promocodes", `promocode-id-${promocodeId}`] }
  )();
}
