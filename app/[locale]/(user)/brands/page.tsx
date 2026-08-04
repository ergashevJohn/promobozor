import { Link } from "@/i18n/navigation";
import { brands, brandTranslations, db, promocodes } from "@/lib/db";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata } from "@/lib/metadata";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { ItemListSchema } from "@/components/public/ItemListSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

// Cached function to fetch all brands with promocode counts
const getAllBrands = (locale: string) =>
  unstable_cache(
    async () => {
      const now = new Date().toISOString();

      const brandsData = await db
        .select({
          brand: brands,
          translation: brandTranslations,
          promocodesCount: sql<number>`CAST(COUNT(DISTINCT CASE
          WHEN ${promocodes.status} = 'active'
          AND (${promocodes.expiresAt} IS NULL OR ${promocodes.expiresAt} > ${now}::timestamp)
          AND (${promocodes.startsAt} IS NULL OR ${promocodes.startsAt} <= ${now}::timestamp)
          THEN ${promocodes.id}
          END) AS INTEGER)`.as("promocodes_count"),
        })
        .from(brands)
        .leftJoin(
          brandTranslations,
          and(
            eq(brandTranslations.brandId, brands.id),
            eq(brandTranslations.language, locale as "uz" | "ru" | "en")
          )
        )
        .leftJoin(promocodes, eq(promocodes.brandId, brands.id))
        .where(eq(brands.isActive, true))
        .groupBy(brands.id, brandTranslations.id, brandTranslations.language)
        .orderBy(desc(brands.createdAt));

      return brandsData;
    },
    ["all-brands", locale],
    { revalidate: 86400, tags: ["brands", "all-brands", `all-brands-${locale}`] }
  )();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "brand" });

  const title = t("allBrands");
  const description = t("description");
  const url = `/${locale}/brands`;

  return {
    ...generateFullMetadata(title, description, url, undefined, "website", locale, "/brands"),
  };
}

export const revalidate = 86400;

export default async function BrandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  // Fetch all active brands with translations and promocode counts
  type BrandsData = Array<{
    brand: typeof brands.$inferSelect;
    translation: typeof brandTranslations.$inferSelect | null;
    promocodesCount: number;
  }>;
  let brandsData: BrandsData = [];

  try {
    brandsData = await getAllBrands(locale);
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    // Check if it's a database table missing error (build time)
    if (
      errorObj.message?.includes("does not exist") ||
      errorObj.message?.includes("relation") ||
      errorObj.message?.includes("brands")
    ) {
      console.log(
        "ℹ️  Brands table not found. Please run database migrations. Continuing with empty list."
      );
      brandsData = [];
    } else {
      console.error("Error fetching brands:", errorObj);
      console.error("Error details:", errorObj.message);
      console.error("Language:", locale);
      // Don't call notFound() during build - return empty state instead
      brandsData = [];
    }
  }

  const t = await getTranslations({ locale, namespace: "brand" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const visibleBrands = brandsData.filter((row) => row.translation?.slug);
  const totalPromocodes = visibleBrands.reduce((sum, row) => sum + (row.promocodesCount || 0), 0);

  // Prepare items for ItemList schema (all brands)
  const schemaItems = visibleBrands.map((row) => ({
    name: row.translation?.name || t("title"),
    url: `/brand/${row.translation?.slug}`,
    image: row.brand.imageUrl || undefined,
    description: row.translation?.description || row.translation?.metaDescription || undefined,
  }));

  return (
    <div>
      {/* Hero Section */}
      <div className="page-shell py-10">
        <div className="page-hero-surface">
          <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="brand-kicker mb-4">{t("directoryKicker")}</div>
              <h1 className="page-hero-heading mb-3">{t("allBrands")}</h1>
              <p className="page-hero-copy">{t("description")}</p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/92 px-5 py-4 shadow-[0_18px_48px_-40px_rgba(17,24,39,0.28)]">
              <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                {t("trustLabel")}
              </div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                {visibleBrands.length} {t("activeBrands").toLowerCase()}
              </div>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                {totalPromocodes} {t("activePromocodes").toLowerCase()}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/80 bg-white/92 px-4 py-4 shadow-[0_18px_48px_-40px_rgba(17,24,39,0.24)]">
              <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                {t("featuredLabel")}
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                {t("featuredHint")}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/80 bg-white/92 px-4 py-4 shadow-[0_18px_48px_-40px_rgba(17,24,39,0.24)]">
              <div className="text-sm font-semibold text-[color:var(--foreground)]">
                {t("trustValue")}
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                {t("trustDescription")}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/80 bg-white/92 px-4 py-4 shadow-[0_18px_48px_-40px_rgba(17,24,39,0.24)]">
              <div className="text-sm font-semibold text-[color:var(--foreground)]">
                {t("bestOffers")}
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                {t("noPromocodesDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-shell pb-12">
        <BreadcrumbsSchema
          items={[
            { name: tCommon("home"), url: "/" },
            { name: t("allBrands"), url: "/brands" },
          ]}
          locale={locale}
        />
        {schemaItems.length > 0 && (
          <ItemListSchema
            items={schemaItems}
            listName={t("allBrands")}
            listDescription={t("description")}
          />
        )}
        {visibleBrands.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleBrands.map((row, index) => {
              const translation = row.translation;
              const brand = row.brand;
              const promocodesCount = row.promocodesCount || 0;
              const brandName = translation?.name || t("title");

              return (
                <Link
                  key={brand.id}
                  href={`/brand/${translation?.slug || brand.id}`}
                  className="group relative overflow-hidden rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_22px_60px_-46px_rgba(17,24,39,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--accent-red)]"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex size-16 items-center justify-start">
                      {brand.imageUrl ? (
                        <div className="relative h-full w-full flex-shrink-0 overflow-hidden rounded-2xl bg-[color:var(--secondary)] shadow-[0_18px_40px_-24px_rgba(17,24,39,0.35)]">
                          <Image
                            src={brand.imageUrl}
                            alt={
                              translation?.name
                                ? `${translation.name} - ${tCommon("altBrandLogo")}`
                                : tCommon("altBrandLogoWithSlug", {
                                    slug: translation?.slug || brand.id,
                                  })
                            }
                            fill
                            className="object-cover"
                            priority={index < 3}
                            loading={index < 3 ? undefined : "lazy"}
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--foreground)] text-3xl font-bold text-white shadow-[0_18px_40px_-24px_rgba(17,24,39,0.45)]">
                          {brandName.charAt(0) || "B"}
                        </div>
                      )}
                    </div>

                    {index < 3 && (
                      <div className="inline-flex rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-red)]">
                        {t("featuredLabel")}
                      </div>
                    )}
                  </div>

                  <h2 className="text-foreground text-2xl font-semibold">{brandName}</h2>

                  {translation?.metaDescription && (
                    <p className="text-muted-foreground mt-2 line-clamp-2 min-h-10 text-sm">
                      {translation.metaDescription}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--secondary)]/70 px-4 py-3">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.12em] text-[color:var(--accent-red)] uppercase">
                        {t("promocodes")}
                      </div>
                      <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                        {promocodesCount > 0 ? t("trustValue") : t("checkBackLater")}
                      </div>
                    </div>
                    <div className="text-foreground text-2xl font-semibold">{promocodesCount}</div>
                  </div>

                  <div className="mt-5 text-center">
                    <Button variant="secondary" className="w-full justify-between">
                      <span>
                        {t("viewOffers")} {brandName}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="empty-state-card border-none shadow-none">
            <CardContent className="py-4 text-center">
              <div className="mb-4 text-6xl" aria-hidden="true">
                🔍
              </div>
              <h2 className="text-foreground mb-2 text-xl font-semibold">{t("noBrandsFound")}</h2>
              <p className="text-muted-foreground text-sm">{t("noBrandsDescription")}</p>
              <div className="mt-5">
                <Link href="/promocodes">
                  <Button>{t("emptyCta")}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
