import { db, brands, brandTranslations, stores, storeTranslations } from "@/lib/db";
import { isValidLanguage } from "@/lib/i18n";
import { normalizePromokodAliasSlug, resolvePromokodAliasTarget } from "@/lib/promokod-alias";
import { and, eq } from "drizzle-orm";
import { permanentRedirect, notFound } from "next/navigation";

export const revalidate = 3600;

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

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const lang = locale as "uz" | "ru" | "en";
  const normalized = normalizePromokodAliasSlug(slug);

  const [storeSlug, brandSlug, storeSlugNormalized, brandSlugNormalized] = await Promise.all([
    findStoreSlug(lang, slug),
    findBrandSlug(lang, slug),
    normalized !== slug ? findStoreSlug(lang, normalized) : Promise.resolve(null),
    normalized !== slug ? findBrandSlug(lang, normalized) : Promise.resolve(null),
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
