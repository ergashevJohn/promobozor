/**
 * Normalize competitor-style /promokod/{slug} paths before hub lookup.
 * Examples: yandex-eats-promokod → yandex-eats
 */
export function normalizePromokodAliasSlug(slug: string): string {
  return slug.replace(/-promokod$/i, "").replace(/-promocode$/i, "");
}

export type PromokodAliasTarget =
  | { type: "store"; slug: string }
  | { type: "brand"; slug: string }
  | null;

/**
 * Resolve alias target from store/brand slug hits (already language-scoped).
 */
export function resolvePromokodAliasTarget(options: {
  slug: string;
  storeSlug?: string | null;
  brandSlug?: string | null;
  storeSlugNormalized?: string | null;
  brandSlugNormalized?: string | null;
}): PromokodAliasTarget {
  const { slug, storeSlug, brandSlug, storeSlugNormalized, brandSlugNormalized } = options;

  if (storeSlug) {
    return { type: "store", slug: storeSlug };
  }
  if (brandSlug) {
    return { type: "brand", slug: brandSlug };
  }

  const normalized = normalizePromokodAliasSlug(slug);
  if (normalized !== slug) {
    if (storeSlugNormalized) {
      return { type: "store", slug: storeSlugNormalized };
    }
    if (brandSlugNormalized) {
      return { type: "brand", slug: brandSlugNormalized };
    }
  }

  return null;
}
