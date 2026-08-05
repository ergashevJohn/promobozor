import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { ItemListSchema } from "@/components/public/ItemListSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { categories, categoryTranslations, db, promocodes } from "@/lib/db";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata } from "@/lib/metadata";
import { and, asc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, MagnifyingGlass, Package } from "@phosphor-icons/react/dist/ssr";

// Cached function to fetch all categories
const getAllCategories = (locale: string) =>
  unstable_cache(
    async () => {
      const now = new Date().toISOString();
      const categoriesData = await db
        .select({
          category: categories,
          translation: categoryTranslations,
          promocodesCount: sql<number>`CAST(COUNT(DISTINCT CASE
          WHEN ${promocodes.status} = 'active'
          AND (${promocodes.expiresAt} IS NULL OR ${promocodes.expiresAt} > ${now}::timestamp)
          AND (${promocodes.startsAt} IS NULL OR ${promocodes.startsAt} <= ${now}::timestamp)
          THEN ${promocodes.id}
          END) AS INTEGER)`.as("promocodes_count"),
        })
        .from(categories)
        .leftJoin(
          categoryTranslations,
          and(
            eq(categoryTranslations.categoryId, categories.id),
            eq(categoryTranslations.language, locale as "uz" | "ru" | "en")
          )
        )
        .leftJoin(promocodes, eq(promocodes.categoryId, categories.id))
        .where(eq(categories.isActive, true))
        .groupBy(categories.id, categoryTranslations.id, categoryTranslations.language)
        .orderBy(asc(categories.sortOrder));

      return categoriesData;
    },
    ["all-categories", locale],
    { revalidate: 86400, tags: ["categories", "all-categories", `all-categories-${locale}`] }
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

  const t = await getTranslations({ locale, namespace: "category" });

  const title = t("allCategories");
  const description = t("allCategoriesDescription");
  const url = `/${locale}/categories`;

  return {
    ...generateFullMetadata(title, description, url, undefined, "website", locale, "/categories"),
  };
}

export const revalidate = 86400;

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  // Fetch all active categories with translations
  type CategoriesData = Array<{
    category: typeof categories.$inferSelect;
    translation: typeof categoryTranslations.$inferSelect | null;
    promocodesCount: number;
  }>;
  let categoriesData: CategoriesData = [];
  let t: Awaited<ReturnType<typeof getTranslations>>;
  let tCommon: Awaited<ReturnType<typeof getTranslations>>;

  try {
    categoriesData = await getAllCategories(locale);

    // Get translations
    t = await getTranslations({ locale, namespace: "category" });
    tCommon = await getTranslations({ locale, namespace: "common" });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    // Check if it's a database table missing error (build time)
    if (
      errorObj.message?.includes("does not exist") ||
      errorObj.message?.includes("relation") ||
      errorObj.message?.includes("categories")
    ) {
      console.log(
        "ℹ️  Categories table not found. Please run database migrations. Continuing with empty list."
      );
      categoriesData = [];
      t = await getTranslations({ locale, namespace: "category" });
      tCommon = await getTranslations({ locale, namespace: "common" });
    } else {
      console.error("Error fetching categories:", errorObj);
      console.error("Error details:", errorObj.message);
      console.error("Language:", locale);
      // Don't call notFound() during build - return empty state instead
      categoriesData = [];
      t = await getTranslations({ locale, namespace: "category" });
      tCommon = await getTranslations({ locale, namespace: "common" });
    }
  }

  // Prepare items for ItemList schema (all categories)
  const visibleCategories = categoriesData.filter((row) => row.translation?.slug);
  const totalPromocodes = visibleCategories.reduce(
    (sum, row) => sum + (row.promocodesCount || 0),
    0
  );
  const schemaItems = visibleCategories.map((row) => ({
    name: row.translation?.name || t("title"),
    url: `/category/${row.translation?.slug}`,
    image: row.category.imageUrl || undefined,
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
              <h1 className="page-hero-heading mb-3">{t("allCategories")}</h1>
              <p className="page-hero-copy">{t("allCategoriesDescription")}</p>
            </div>
            <div className="surface-stat px-5 py-4">
              <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                {t("trustLabel")}
              </div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                {visibleCategories.length} {t("activeCategories").toLowerCase()}
              </div>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                {totalPromocodes} {t("activePromocodes").toLowerCase()}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="surface-stat">
              <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                {t("featuredLabel")}
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                {t("featuredHint")}
              </p>
            </div>
            <div className="surface-stat">
              <div className="text-sm font-semibold text-[color:var(--foreground)]">
                {t("trustValue")}
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                {t("trustDescription")}
              </p>
            </div>
            <div className="surface-stat">
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
            { name: t("allCategories"), url: "/categories" },
          ]}
          locale={locale}
        />
        {schemaItems.length > 0 && (
          <ItemListSchema
            items={schemaItems}
            listName={t("allCategories")}
            listDescription={t("allCategoriesDescription")}
          />
        )}
        {visibleCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCategories.map((row, index) => {
              const translation = row.translation;
              const category = row.category;
              const promocodesCount = row.promocodesCount || 0;
              const categoryName = translation?.name || t("title");

              return (
                <Link
                  key={category.id}
                  href={`/category/${translation?.slug || category.id}`}
                  className="surface-card group relative overflow-hidden p-5 transition-[transform,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-[color:var(--accent-red)]/60 hover:shadow-[0_28px_72px_-50px_rgba(232,78,66,0.3)]"
                >
                  {/* Category Image/Icon */}
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex h-24 items-center justify-center">
                      {category.imageUrl ? (
                        <div className="bg-muted relative h-full w-24 overflow-hidden rounded-2xl shadow-[0_18px_40px_-24px_rgba(17,24,39,0.35)]">
                          <Image
                            src={category.imageUrl}
                            alt={
                              translation?.name
                                ? `${translation.name} - ${tCommon("altCategoryImage")}`
                                : tCommon("altCategoryImageWithSlug", {
                                    slug: translation?.slug || category.id,
                                  })
                            }
                            className="rounded-2xl object-cover"
                            priority={index < 3}
                            loading={index < 3 ? undefined : "lazy"}
                            sizes="96px"
                            fill
                          />
                        </div>
                      ) : (
                        <div className="bg-muted flex h-24 w-24 items-center justify-center rounded-2xl shadow-[0_18px_40px_-24px_rgba(17,24,39,0.24)]">
                          <Package className="text-muted-foreground h-9 w-9" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    {index < 3 && (
                      <div className="inline-flex rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-red)]">
                        {t("featuredLabel")}
                      </div>
                    )}
                  </div>

                  <h2 className="text-foreground text-2xl font-semibold">{categoryName}</h2>

                  {translation?.metaDescription && (
                    <p className="text-foreground mt-2 line-clamp-2 min-h-10 text-sm">
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

                  <div className="bg-background text-foreground mt-5 inline-flex min-h-11 w-full items-center justify-between rounded-full border border-[color:var(--border)] px-5 text-sm font-medium transition-colors group-hover:border-[color:var(--accent-red)] group-hover:bg-[color:var(--accent)]">
                    <span>
                      {t("viewOffers")} {categoryName}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="empty-state-card border-none shadow-none">
            <CardContent className="py-4 text-center">
              <MagnifyingGlass
                className="text-muted-foreground mx-auto mb-4 h-12 w-12"
                aria-hidden="true"
              />
              <h2 className="text-foreground mb-2 text-xl font-semibold">
                {t("noCategoriesFound")}
              </h2>
              <p className="text-muted-foreground text-sm">{t("noCategoriesDescription")}</p>
              <div className="mt-5">
                <Button asChild>
                  <Link href="/promocodes">{t("emptyCta")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
