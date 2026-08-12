import type { PromocodeStatus } from "@/components/public/types";

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

export type PromocodeDataRow = {
  promocode: {
    id: string;
    storeId: string | null;
    categoryId: string | null;
    type: "code" | "link";
    code: string | null;
    link: string | null;
    discountType: "percent" | "amount";
    discountValue: number;
    currency: "UZS" | "USD" | "EUR" | null;
    imageUrl: string | null;
    status: PromocodeStatus;
    isFeatured: boolean;
    viewsCount: number;
    copyCount: number;
    likesCount: number;
    dislikesCount: number;
    /** Date from DB or ISO string after cache serialization */
    startsAt: Date | string | null;
    expiresAt: Date | string | null;
    createdAt: Date | string | null;
    updatedAt: Date | string | null;
  };
  store: {
    id: string;
    logoUrl: string | null;
    websiteUrl: string | null;
  } | null;
  storeTranslation: {
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
  category: {
    id: string;
    imageUrl: string | null;
  } | null;
  categoryTranslation: {
    language: string;
    name: string;
    slug: string;
  } | null;
  promocodeTranslation: {
    language: string;
    title: string;
    slug: string;
    conditions: string | null;
  } | null;
};

export type TransformedPromocode = {
  id: string;
  type?: "code" | "link";
  code: string | null;
  link?: string | null;
  discountType: "percent" | "amount";
  discountValue: number;
  currency?: "UZS" | "USD" | "EUR" | undefined;
  originalPrice?: number | null;
  imageUrl?: string | null;
  status: PromocodeStatus;
  isFeatured: boolean;
  viewsCount: number;
  copyCount: number;
  likesCount: number;
  dislikesCount: number;
  startsAt?: string | null;
  expiresAt: string | null;
  translations: Array<{
    language: string;
    title: string;
    slug: string;
    conditions?: string | null;
  }>;
  store: {
    id?: string;
    logoUrl?: string | null;
    websiteUrl?: string | null;
    translations: Array<{
      language: string;
      name: string;
      slug: string;
    }>;
  } | null;
  brand?: {
    id?: string;
    imageUrl?: string | null;
    websiteUrl?: string | null;
    translations: Array<{
      language: string;
      name: string;
      slug: string;
    }>;
  } | null;
  category?: {
    id?: string;
    imageUrl?: string | null;
    translations: Array<{
      language: string;
      name: string;
      slug: string;
    }>;
  } | null;
};

export function transformPromocodeData(data: PromocodeDataRow): TransformedPromocode {
  const locale = data.promocodeTranslation?.language || "uz";

  return {
    id: data.promocode.id,
    type: data.promocode.type,
    code: data.promocode.code,
    link: data.promocode.link,
    discountType: data.promocode.discountType,
    discountValue: data.promocode.discountValue,
    currency: data.promocode.currency || undefined,
    imageUrl:
      data.promocode.imageUrl ||
      data.store?.logoUrl ||
      data.brand?.imageUrl ||
      data.category?.imageUrl ||
      null,
    isFeatured: data.promocode.isFeatured,
    status: data.promocode.status,
    viewsCount: data.promocode.viewsCount,
    copyCount: data.promocode.copyCount,
    likesCount: data.promocode.likesCount,
    dislikesCount: data.promocode.dislikesCount,
    startsAt: toIsoString(data.promocode.startsAt),
    expiresAt: toIsoString(data.promocode.expiresAt),
    translations: data.promocodeTranslation
      ? [
          {
            language: data.promocodeTranslation.language,
            title: data.promocodeTranslation.title,
            slug: data.promocodeTranslation.slug,
            conditions: data.promocodeTranslation.conditions,
          },
        ]
      : [],
    store: data.store
      ? {
          id: data.store.id,
          logoUrl: data.store.logoUrl,
          websiteUrl: data.store.websiteUrl,
          translations: data.storeTranslation
            ? [
                {
                  language: locale,
                  name: data.storeTranslation.name,
                  slug: data.storeTranslation.slug,
                },
              ]
            : [],
        }
      : null,
    brand: data.brand
      ? {
          id: data.brand.id,
          imageUrl: data.brand.imageUrl,
          websiteUrl: data.brand.websiteUrl,
          translations: data.brandTranslation
            ? [
                {
                  language: data.brandTranslation.language,
                  name: data.brandTranslation.name,
                  slug: data.brandTranslation.slug,
                },
              ]
            : [],
        }
      : null,
    category:
      data.category && data.categoryTranslation
        ? {
            id: data.category.id,
            imageUrl: data.category.imageUrl,
            translations: [
              {
                language: data.categoryTranslation.language,
                name: data.categoryTranslation.name,
                slug: data.categoryTranslation.slug,
              },
            ],
          }
        : null,
  };
}

export function transformRelatedPromocodes(data: PromocodeDataRow[]): TransformedPromocode[] {
  return data.map((row) => {
    const locale = row.promocodeTranslation?.language || "uz";

    return {
      id: row.promocode.id,
      type: row.promocode.type,
      code: row.promocode.code,
      link: row.promocode.link,
      discountType: row.promocode.discountType,
      discountValue: row.promocode.discountValue,
      currency: row.promocode.currency || undefined,
      imageUrl:
        row.promocode.imageUrl ||
        row.store?.logoUrl ||
        row.brand?.imageUrl ||
        row.category?.imageUrl ||
        null,
      isFeatured: row.promocode.isFeatured,
      status: row.promocode.status,
      viewsCount: row.promocode.viewsCount,
      copyCount: row.promocode.copyCount,
      likesCount: row.promocode.likesCount,
      dislikesCount: row.promocode.dislikesCount,
      startsAt: toIsoString(row.promocode.startsAt),
      expiresAt: toIsoString(row.promocode.expiresAt),
      translations: row.promocodeTranslation
        ? [
            {
              language: row.promocodeTranslation.language,
              title: row.promocodeTranslation.title,
              slug: row.promocodeTranslation.slug,
              conditions: row.promocodeTranslation.conditions,
            },
          ]
        : [],
      store: row.store
        ? {
            id: row.store.id,
            logoUrl: row.store.logoUrl,
            websiteUrl: row.store.websiteUrl,
            translations: row.storeTranslation
              ? [
                  {
                    language: locale,
                    name: row.storeTranslation.name,
                    slug: row.storeTranslation.slug,
                  },
                ]
              : [],
          }
        : null,
      brand: row.brand
        ? {
            id: row.brand.id,
            imageUrl: row.brand.imageUrl,
            websiteUrl: row.brand.websiteUrl,
            translations: row.brandTranslation
              ? [
                  {
                    language: row.brandTranslation.language,
                    name: row.brandTranslation.name,
                    slug: row.brandTranslation.slug,
                  },
                ]
              : [],
          }
        : null,
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
    };
  });
}

export function calculateRating(likesCount: number, dislikesCount: number) {
  const totalVotes = likesCount + dislikesCount;
  const ratingValue =
    totalVotes > 0 ? ((likesCount * 5 + dislikesCount * 1) / totalVotes).toFixed(1) : null;

  return ratingValue
    ? {
        ratingValue: parseFloat(ratingValue),
        reviewCount: totalVotes,
        bestRating: 5,
        worstRating: 1,
      }
    : undefined;
}
