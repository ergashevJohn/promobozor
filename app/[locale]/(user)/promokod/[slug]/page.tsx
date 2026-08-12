import { brands, brandTranslations, db, stores, storeTranslations } from "@/lib/db";
import { isValidLanguage } from "@/lib/i18n";
import { normalizePromokodAliasSlug, resolvePromokodAliasTarget } from "@/lib/promokod-alias";
import { getBrandStaticParams, getStoreStaticParams } from "@/lib/queries/entities";
import { and, eq } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { unstable_cache } from "next/cache";
import { notFound, permanentRedirect } from "next/navigation";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const [storeParams, brandParams] = await Promise.all([
    getStoreStaticParams(),
    getBrandStaticParams(),
  ]);

  const seen = new Set<string>();
  const params: Array<{ locale: string; slug: string }> = [];

  for (const entry of [...storeParams, ...brandParams]) {
    const key = `${entry.locale}:${entry.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    params.push(entry);
  }

  return params;
}

async function findStoreSlug(lang: "uz" | "ru" | "en", slug: string) {
  const [hit] = await db
    .select({ slug: storeTranslations.slug })
    .from(storeTranslations)
    .innerJoin(stores, eq(storeTranslations.storeId, stores.id))
    .where(
      and(
        eq(storeTranslations.language, lang),
        eq(storeTranslations.slug, slug),
        eq(stores.isActive, true)
      )
    )
    .limit(1);
  return hit?.slug ?? null;
}

async function findBrandSlug(lang: "uz" | "ru" | "en", slug: string) {
  const [hit] = await db
    .select({ slug: brandTranslations.slug })
    .from(brandTranslations)
    .innerJoin(brands, eq(brandTranslations.brandId, brands.id))
    .where(
      and(
        eq(brandTranslations.language, lang),
        eq(brandTranslations.slug, slug),
        eq(brands.isActive, true)
      )
    )
    .limit(1);
  return hit?.slug ?? null;
}

function getCachedStoreSlug(lang: "uz" | "ru" | "en", slug: string) {
  return unstable_cache(() => findStoreSlug(lang, slug), ["promokod-alias-store", lang, slug], {
    revalidate: 3600,
    tags: ["stores", `promokod-alias-store-${lang}-${slug}`],
  })();
}

function getCachedBrandSlug(lang: "uz" | "ru" | "en", slug: string) {
  return unstable_cache(() => findBrandSlug(lang, slug), ["promokod-alias-brand", lang, slug], {
    revalidate: 3600,
    tags: ["brands", `promokod-alias-brand-${lang}-${slug}`],
  })();
}

/**
 * Competitor-style alias: /{locale}/promokod/{slug}
 * 301 to the matching store or brand hub so "brand + promokod" intent ranks on our IA.
 */
export default async function PromokodBrandAliasPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const lang = locale as "uz" | "ru" | "en";
  const normalized = normalizePromokodAliasSlug(slug);

  const [storeSlug, brandSlug, storeSlugNormalized, brandSlugNormalized] = await Promise.all([
    getCachedStoreSlug(lang, slug),
    getCachedBrandSlug(lang, slug),
    normalized !== slug ? getCachedStoreSlug(lang, normalized) : Promise.resolve(null),
    normalized !== slug ? getCachedBrandSlug(lang, normalized) : Promise.resolve(null),
  ]);

  const target = resolvePromokodAliasTarget({
    slug,
    storeSlug,
    brandSlug,
    storeSlugNormalized,
    brandSlugNormalized,
  });

  if (!target) {
    notFound();
  }

  if (target.type === "store") {
    permanentRedirect(`/${locale}/store/${target.slug}`);
  }

  permanentRedirect(`/${locale}/brand/${target.slug}`);
}
