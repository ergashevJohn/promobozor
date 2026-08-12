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
import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";

type Locale = "uz" | "ru" | "en";

const storeBySlugSelect = {
  store: {
    id: stores.id,
    logoUrl: stores.logoUrl,
    websiteUrl: stores.websiteUrl,
    priority: stores.priority,
    isActive: stores.isActive,
  },
  translation: {
    id: storeTranslations.id,
    storeId: storeTranslations.storeId,
    language: storeTranslations.language,
    name: storeTranslations.name,
    slug: storeTranslations.slug,
    description: storeTranslations.description,
    metaTitle: storeTranslations.metaTitle,
    metaDescription: storeTranslations.metaDescription,
  },
} as const;

const categoryBySlugSelect = {
  category: {
    id: categories.id,
    parentId: categories.parentId,
    iconName: categories.iconName,
    imageUrl: categories.imageUrl,
    sortOrder: categories.sortOrder,
    isActive: categories.isActive,
  },
  translation: {
    id: categoryTranslations.id,
    categoryId: categoryTranslations.categoryId,
    language: categoryTranslations.language,
    name: categoryTranslations.name,
    slug: categoryTranslations.slug,
    description: categoryTranslations.description,
    metaTitle: categoryTranslations.metaTitle,
    metaDescription: categoryTranslations.metaDescription,
  },
} as const;

const brandBySlugSelect = {
  brand: {
    id: brands.id,
    imageUrl: brands.imageUrl,
    websiteUrl: brands.websiteUrl,
    isActive: brands.isActive,
  },
  translation: {
    id: brandTranslations.id,
    brandId: brandTranslations.brandId,
    language: brandTranslations.language,
    name: brandTranslations.name,
    slug: brandTranslations.slug,
    description: brandTranslations.description,
    metaTitle: brandTranslations.metaTitle,
    metaDescription: brandTranslations.metaDescription,
  },
} as const;

export type CachedStoreBySlug = {
  store: {
    id: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    priority: number;
    isActive: boolean;
  };
  translation: {
    id: string;
    storeId: string;
    language: string;
    name: string;
    slug: string;
    description: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  };
};

async function fetchStoreBySlug(locale: Locale, slug: string): Promise<CachedStoreBySlug | null> {
  const [row] = await db
    .select(storeBySlugSelect)
    .from(stores)
    .innerJoin(
      storeTranslations,
      and(
        eq(storeTranslations.storeId, stores.id),
        eq(storeTranslations.language, locale),
        eq(storeTranslations.slug, slug)
      )
    )
    .where(and(eq(stores.isActive, true)))
    .limit(1);

  return (row as CachedStoreBySlug | undefined) ?? null;
}

export function getCachedStoreBySlug(locale: string, slug: string) {
  return unstable_cache(
    () => fetchStoreBySlug(locale as Locale, slug),
    ["store-by-slug", locale, slug],
    {
      revalidate: 1800,
      tags: ["stores", `store-${locale}-${slug}`],
    }
  )();
}

export type CachedCategoryBySlug = {
  category: {
    id: string;
    parentId: string | null;
    iconName: string | null;
    imageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
  };
  translation: {
    id: string;
    categoryId: string;
    language: string;
    name: string;
    slug: string;
    description: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  };
};

async function fetchCategoryBySlug(
  locale: Locale,
  slug: string
): Promise<CachedCategoryBySlug | null> {
  const [row] = await db
    .select(categoryBySlugSelect)
    .from(categories)
    .innerJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.language, locale),
        eq(categoryTranslations.slug, slug)
      )
    )
    .where(and(eq(categories.isActive, true)))
    .limit(1);

  return (row as CachedCategoryBySlug | undefined) ?? null;
}

export function getCachedCategoryBySlug(locale: string, slug: string) {
  return unstable_cache(
    () => fetchCategoryBySlug(locale as Locale, slug),
    ["category-by-slug", locale, slug],
    {
      revalidate: 1800,
      tags: ["categories", `category-${locale}-${slug}`],
    }
  )();
}

export type CachedBrandBySlug = {
  brand: {
    id: string;
    imageUrl: string | null;
    websiteUrl: string | null;
    isActive: boolean;
  };
  translation: {
    id: string;
    brandId: string;
    language: string;
    name: string;
    slug: string;
    description: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  };
};

async function fetchBrandBySlug(locale: Locale, slug: string): Promise<CachedBrandBySlug | null> {
  const [row] = await db
    .select(brandBySlugSelect)
    .from(brands)
    .innerJoin(
      brandTranslations,
      and(
        eq(brandTranslations.brandId, brands.id),
        eq(brandTranslations.language, locale),
        eq(brandTranslations.slug, slug)
      )
    )
    .where(and(eq(brands.isActive, true)))
    .limit(1);

  return (row as CachedBrandBySlug | undefined) ?? null;
}

export function getCachedBrandBySlug(locale: string, slug: string) {
  return unstable_cache(
    () => fetchBrandBySlug(locale as Locale, slug),
    ["brand-by-slug", locale, slug],
    {
      revalidate: 1800,
      tags: ["brands", `brand-${locale}-${slug}`],
    }
  )();
}

export async function getStoreLanguageAlternates(storeId: string) {
  return unstable_cache(
    async () => {
      return db
        .select({
          language: storeTranslations.language,
          slug: storeTranslations.slug,
        })
        .from(storeTranslations)
        .where(eq(storeTranslations.storeId, storeId));
    },
    ["store-lang-alts", storeId],
    { revalidate: 1800, tags: ["stores", `store-id-${storeId}`] }
  )();
}

export async function getCategoryLanguageAlternates(categoryId: string) {
  return unstable_cache(
    async () => {
      return db
        .select({
          language: categoryTranslations.language,
          slug: categoryTranslations.slug,
        })
        .from(categoryTranslations)
        .where(eq(categoryTranslations.categoryId, categoryId));
    },
    ["category-lang-alts", categoryId],
    { revalidate: 1800, tags: ["categories", `category-id-${categoryId}`] }
  )();
}

export async function getBrandLanguageAlternates(brandId: string) {
  return unstable_cache(
    async () => {
      return db
        .select({
          language: brandTranslations.language,
          slug: brandTranslations.slug,
        })
        .from(brandTranslations)
        .where(eq(brandTranslations.brandId, brandId));
    },
    ["brand-lang-alts", brandId],
    { revalidate: 1800, tags: ["brands", `brand-id-${brandId}`] }
  )();
}

type StaticParam = { locale: string; slug: string };

/**
 * Build-time paths for store ISR. Falls back to [] if DB is unavailable during build.
 * Unknown slugs still render on-demand via dynamicParams (default true).
 */
export async function getStoreStaticParams(): Promise<StaticParam[]> {
  try {
    const rows = await db
      .select({
        locale: storeTranslations.language,
        slug: storeTranslations.slug,
      })
      .from(storeTranslations)
      .innerJoin(stores, and(eq(storeTranslations.storeId, stores.id), eq(stores.isActive, true)));

    return rows.map((row) => ({ locale: row.locale, slug: row.slug }));
  } catch (error) {
    console.warn("getStoreStaticParams skipped:", error);
    return [];
  }
}

export async function getCategoryStaticParams(): Promise<StaticParam[]> {
  try {
    const rows = await db
      .select({
        locale: categoryTranslations.language,
        slug: categoryTranslations.slug,
      })
      .from(categoryTranslations)
      .innerJoin(
        categories,
        and(eq(categoryTranslations.categoryId, categories.id), eq(categories.isActive, true))
      );

    return rows.map((row) => ({ locale: row.locale, slug: row.slug }));
  } catch (error) {
    console.warn("getCategoryStaticParams skipped:", error);
    return [];
  }
}

export async function getBrandStaticParams(): Promise<StaticParam[]> {
  try {
    const rows = await db
      .select({
        locale: brandTranslations.language,
        slug: brandTranslations.slug,
      })
      .from(brandTranslations)
      .innerJoin(brands, and(eq(brandTranslations.brandId, brands.id), eq(brands.isActive, true)));

    return rows.map((row) => ({ locale: row.locale, slug: row.slug }));
  } catch (error) {
    console.warn("getBrandStaticParams skipped:", error);
    return [];
  }
}

export async function getPromocodeStaticParams(): Promise<StaticParam[]> {
  try {
    const now = new Date();
    const rows = await db
      .select({
        locale: promocodeTranslations.language,
        slug: promocodeTranslations.slug,
      })
      .from(promocodeTranslations)
      .innerJoin(promocodes, eq(promocodeTranslations.promocodeId, promocodes.id))
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .where(
        and(
          eq(promocodes.status, "active"),
          or(isNull(promocodes.storeId), eq(stores.isActive, true)),
          or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now)),
          or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now))
        )
      );

    return rows.map((row) => ({ locale: row.locale, slug: row.slug }));
  } catch (error) {
    console.warn("getPromocodeStaticParams skipped:", error);
    return [];
  }
}
