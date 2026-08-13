import { and, eq, or } from "drizzle-orm";
import { brands, brandTranslations, db, stores, storeTranslations } from "@/lib/db";
import { getEntityPath, isCompetitorPromokodAliasPath, type Locale } from "@/lib/routes";
import { normalizePromokodAliasSlug, resolvePromokodAliasTarget } from "@/lib/promokod-alias";

const HUB_SUFFIXES = ["chegirmalar", "skidki", "deals"] as const;

function hubSlugCandidates(slug: string): string[] {
  const candidates = new Set<string>([slug]);
  for (const suffix of HUB_SUFFIXES) {
    candidates.add(`${slug}-${suffix}`);
    if (slug.endsWith(`-${suffix}`)) {
      candidates.add(slug.slice(0, -(suffix.length + 1)));
    }
  }
  return Array.from(candidates);
}

async function findStoreSlug(lang: Locale, slug: string): Promise<string | null> {
  const candidates = hubSlugCandidates(slug);
  const [hit] = await db
    .select({ slug: storeTranslations.slug })
    .from(storeTranslations)
    .innerJoin(stores, eq(storeTranslations.storeId, stores.id))
    .where(
      and(
        eq(storeTranslations.language, lang),
        or(...candidates.map((c) => eq(storeTranslations.slug, c))),
        eq(stores.isActive, true)
      )
    )
    .limit(1);
  return hit?.slug ?? null;
}

async function findBrandSlug(lang: Locale, slug: string): Promise<string | null> {
  const candidates = hubSlugCandidates(slug);
  const [hit] = await db
    .select({ slug: brandTranslations.slug })
    .from(brandTranslations)
    .innerJoin(brands, eq(brandTranslations.brandId, brands.id))
    .where(
      and(
        eq(brandTranslations.language, lang),
        or(...candidates.map((c) => eq(brandTranslations.slug, c))),
        eq(brands.isActive, true)
      )
    )
    .limit(1);
  return hit?.slug ?? null;
}

/**
 * Resolve competitor /{locale}/promokod/{slug} alias to store/brand hub path.
 * Returns null when not an alias path or no matching hub.
 */
export async function resolvePromokodAliasRedirect(pathname: string): Promise<string | null> {
  const match = pathname.match(/^\/(uz|ru|en)\/([^/]+)\/([^/]+)\/?$/);
  if (!match) return null;

  const [, localeRaw, segment, slug] = match;
  const locale = localeRaw as Locale;

  if (!isCompetitorPromokodAliasPath(locale, segment, slug)) {
    return null;
  }

  const normalized = normalizePromokodAliasSlug(slug);

  const [storeSlug, brandSlug, storeSlugNormalized, brandSlugNormalized] = await Promise.all([
    findStoreSlug(locale, slug),
    findBrandSlug(locale, slug),
    normalized !== slug ? findStoreSlug(locale, normalized) : Promise.resolve(null),
    normalized !== slug ? findBrandSlug(locale, normalized) : Promise.resolve(null),
  ]);

  const target = resolvePromokodAliasTarget({
    slug,
    storeSlug,
    brandSlug,
    storeSlugNormalized,
    brandSlugNormalized,
  });

  if (!target) return null;

  return getEntityPath(locale, target.type, target.slug);
}
