import type { Promocode } from "@/components/public/types";
import {
  brands,
  brandTranslations,
  categories,
  categoryTranslations,
  promocodes,
  promocodeTranslations,
  stores,
  storeTranslations,
} from "@/lib/db";

/**
 * Slim column selection for promocode list/card queries.
 * Avoids pulling createdById, meta*, updatedAt, search_vector, etc.
 */
export const promocodeListSelect = {
  promocode: {
    id: promocodes.id,
    type: promocodes.type,
    code: promocodes.code,
    link: promocodes.link,
    discountType: promocodes.discountType,
    discountValue: promocodes.discountValue,
    currency: promocodes.currency,
    originalPrice: promocodes.originalPrice,
    imageUrl: promocodes.imageUrl,
    status: promocodes.status,
    isFeatured: promocodes.isFeatured,
    viewsCount: promocodes.viewsCount,
    copyCount: promocodes.copyCount,
    likesCount: promocodes.likesCount,
    dislikesCount: promocodes.dislikesCount,
    startsAt: promocodes.startsAt,
    expiresAt: promocodes.expiresAt,
  },
  store: {
    id: stores.id,
    logoUrl: stores.logoUrl,
    websiteUrl: stores.websiteUrl,
    isActive: stores.isActive,
  },
  storeTranslation: {
    language: storeTranslations.language,
    name: storeTranslations.name,
    slug: storeTranslations.slug,
  },
  brand: {
    id: brands.id,
    imageUrl: brands.imageUrl,
    websiteUrl: brands.websiteUrl,
  },
  brandTranslation: {
    language: brandTranslations.language,
    name: brandTranslations.name,
    slug: brandTranslations.slug,
  },
  promocodeTranslation: {
    language: promocodeTranslations.language,
    title: promocodeTranslations.title,
    slug: promocodeTranslations.slug,
    shortDescription: promocodeTranslations.shortDescription,
    conditions: promocodeTranslations.conditions,
  },
} as const;

export const promocodeListSelectWithCategory = {
  ...promocodeListSelect,
  category: {
    id: categories.id,
    imageUrl: categories.imageUrl,
  },
  categoryTranslation: {
    language: categoryTranslations.language,
    name: categoryTranslations.name,
    slug: categoryTranslations.slug,
  },
} as const;

export type PromocodeListRow = {
  promocode: {
    id: string;
    type: "code" | "link";
    code: string | null;
    link: string | null;
    discountType: "percent" | "amount";
    discountValue: number;
    currency: "UZS" | "USD" | "EUR";
    originalPrice: number | null;
    imageUrl: string | null;
    status: "draft" | "active" | "expired" | "disabled";
    isFeatured: boolean;
    viewsCount: number;
    copyCount: number;
    likesCount: number;
    dislikesCount: number;
    startsAt: Date | null;
    expiresAt: Date | null;
  };
  store: {
    id: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    isActive: boolean;
  } | null;
  storeTranslation: {
    language: string;
    name: string;
    slug: string;
  } | null;
  brand: {
    id: string;
    imageUrl: string | null;
    websiteUrl: string | null;
  } | null;
  brandTranslation: {
    language: string;
    name: string;
    slug: string;
  } | null;
  promocodeTranslation: {
    language: string;
    title: string;
    slug: string;
    shortDescription: string | null;
    conditions: string | null;
  } | null;
  category?: {
    id: string;
    imageUrl: string | null;
  } | null;
  categoryTranslation?: {
    language: string;
    name: string;
    slug: string;
  } | null;
};

export type MapPromocodeOptions = {
  includeStartsAt?: boolean;
  includeConditions?: boolean;
  includeMedia?: boolean;
  includeCategory?: boolean;
  /** When brand join is missing (e.g. brand detail page), pass page-level brand */
  brandFallback?: Promocode["brand"];
};

/**
 * Map a slim list row into the public Promocode DTO used by cards.
 */
export function mapPromocodeListRow(
  row: PromocodeListRow,
  options: MapPromocodeOptions = {}
): Promocode {
  const {
    includeStartsAt = true,
    includeConditions = true,
    includeMedia = false,
    includeCategory = false,
    brandFallback = null,
  } = options;

  const brand =
    row.brand && row.brandTranslation
      ? {
          id: row.brand.id,
          imageUrl: row.brand.imageUrl,
          websiteUrl: includeMedia ? row.brand.websiteUrl : undefined,
          translations: [
            {
              language: row.brandTranslation.language,
              name: row.brandTranslation.name,
              slug: row.brandTranslation.slug,
            },
          ],
        }
      : (brandFallback ?? null);

  return {
    id: row.promocode.id,
    type: row.promocode.type,
    code: row.promocode.code,
    link: row.promocode.link,
    discountType: row.promocode.discountType,
    discountValue: row.promocode.discountValue,
    currency: row.promocode.currency,
    ...(includeMedia
      ? {
          originalPrice: row.promocode.originalPrice,
          imageUrl: row.promocode.imageUrl,
        }
      : {}),
    status: row.promocode.status,
    isFeatured: row.promocode.isFeatured,
    viewsCount: row.promocode.viewsCount,
    copyCount: row.promocode.copyCount,
    likesCount: row.promocode.likesCount,
    dislikesCount: row.promocode.dislikesCount,
    ...(includeStartsAt
      ? { startsAt: row.promocode.startsAt?.toISOString() || null }
      : {}),
    expiresAt: row.promocode.expiresAt?.toISOString() || null,
    translations: row.promocodeTranslation
      ? [
          {
            language: row.promocodeTranslation.language,
            title: row.promocodeTranslation.title,
            slug: row.promocodeTranslation.slug,
            ...(includeConditions
              ? { conditions: row.promocodeTranslation.conditions }
              : {}),
          },
        ]
      : [],
    store: row.store
      ? {
          id: row.store.id,
          logoUrl: row.store.logoUrl,
          websiteUrl: includeMedia ? row.store.websiteUrl : undefined,
          translations: row.storeTranslation
            ? [
                {
                  language: row.storeTranslation.language,
                  name: row.storeTranslation.name,
                  slug: row.storeTranslation.slug,
                },
              ]
            : [],
        }
      : null,
    ...(includeCategory
      ? {
          category:
            row.category && row.categoryTranslation
              ? {
                  id: row.category.id,
                  imageUrl: row.category.imageUrl,
                  translations: [
                    {
                      language: row.categoryTranslation.language,
                      name: row.categoryTranslation.name,
                      slug: row.categoryTranslation.slug,
                    },
                  ],
                }
              : null,
        }
      : {}),
    brand,
  };
}
