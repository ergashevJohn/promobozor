import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { EntityFAQSchema } from "@/components/public/EntityFAQSchema";
import { ItemListSchema } from "@/components/public/ItemListSchema";
import PromocodeListWithPagination from "@/components/public/PromocodeListWithPagination";
import StructuredData from "@/components/public/StructuredData";
import { Link } from "@/i18n/navigation";
import type { Promocode } from "@/components/public/types";
import { getCachedCategoryPromocodeCounts } from "@/lib/cache/promocode-counts";
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
import { isValidLanguage } from "@/lib/i18n";
import {
  generateCategoryDescription,
  generateCategoryTitle,
  generateFullMetadata,
  generateOgImageUrl,
  getBaseUrl,
} from "@/lib/metadata";
import {
  getCachedCategoryBySlug,
  getCategoryLanguageAlternates,
} from "@/lib/queries/entities";
import {
  mapPromocodeListRow,
  promocodeListSelectWithCategory,
  type PromocodeListRow,
} from "@/lib/queries/promocode-list";
import { and, asc, desc, eq, isNull, lte, ne, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isGone } from "@/lib/redirects";
import { NotFoundUI } from "@/components/public/NotFoundUI";
import { MagnifyingGlass, Package } from "@phosphor-icons/react/dist/ssr";

export async function generateStaticParams() {
  // Skip static generation for categories - render dynamically
  return [];
}

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isValidLanguage(locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "category" });
  const categoryTitle = t("title");

  // 410 Gone check
  if (isGone("category", slug)) {
    return {
      title: "Gone",
      robots: { index: false, follow: false },
    };
  }

  try {
    const categoryData = await getCachedCategoryBySlug(locale, slug);

    if (!categoryData) {
      return {};
    }

    const translation = categoryData.translation;

    // Get promocode counts from cache (5-min cache for performance)
    const counts = await getCachedCategoryPromocodeCounts(categoryData.category.id);
    const totalPromocodes = counts?.total ?? 0;
    const totalStores = counts?.storeCount ?? 0;

    // Generate SEO-optimized title and description
    const title =
      translation?.metaTitle ||
      generateCategoryTitle(translation?.name || categoryTitle, totalPromocodes, locale);
    const description =
      translation?.metaDescription ||
      generateCategoryDescription(
        translation?.name || categoryTitle,
        translation?.description || null,
        totalPromocodes,
        totalStores,
        locale
      );
    const url = `/${locale}/category/${slug}`;

    // Generate dynamic OG image
    const ogImage = generateOgImageUrl({
      title: translation?.name || categoryTitle,
      description: translation?.description || description,
      type: "category",
      logo: categoryData.category.imageUrl || undefined,
    });

    // Get all language slugs for this category
    const allTranslations = await getCategoryLanguageAlternates(categoryData.category.id);
    const languageAlternates: Record<string, string> = {};
    allTranslations.forEach((t) => {
      languageAlternates[t.language] = `/${t.language}/category/${t.slug}`;
    });

    return generateFullMetadata(
      title,
      description,
      url,
      ogImage,
      "website",
      locale,
      "",
      languageAlternates
    );
  } catch {
    return {};
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  // 410 Gone check
  if (isGone("category", slug)) {
    const messages = await getMessages();
    return <NotFoundUI locale={locale} messages={messages} statusCode="410" />;
  }

  // Fetch category by slug
  let allPromocodes: Promocode[] = [];
  let totalPromocodesCount = 0;
  let featuredPromocodesCount = 0;
  let totalViews = 0;
  let totalCopies = 0;
  let category;
  let categoryTranslation;

  try {
    const categoryData = await getCachedCategoryBySlug(locale, slug);

    if (!categoryData) {
      notFound();
    }

    category = categoryData.category;
    categoryTranslation = categoryData.translation;

    // Fetch promocodes for this category (exclude draft only)
    const now = new Date();
    const baseConditions = [
      eq(promocodes.categoryId, category.id),
      ne(promocodes.status, "draft"), // Exclude draft, show all others
      or(isNull(promocodes.storeId), eq(stores.isActive, true)),
      // Note: Allow expired promocodes to show
      or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
    ];

    const statsQuery = db
      .select({
        total: sql<number>`COUNT(*)::int`.as("total"),
        featured: sql<number>`COUNT(*) FILTER (WHERE ${promocodes.isFeatured} = true)::int`.as(
          "featured"
        ),
        totalViews: sql<number>`COALESCE(SUM(${promocodes.viewsCount}), 0)::int`.as("total_views"),
        totalCopies: sql<number>`COALESCE(SUM(${promocodes.copyCount}), 0)::int`.as("total_copies"),
      })
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .where(and(...baseConditions));

    const allQuery = db
      .select(promocodeListSelectWithCategory)
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .innerJoin(categories, eq(promocodes.categoryId, categories.id))
      .leftJoin(brands, eq(promocodes.brandId, brands.id))
      .leftJoin(
        promocodeTranslations,
        and(
          eq(promocodeTranslations.promocodeId, promocodes.id),
          eq(promocodeTranslations.language, locale as "uz" | "ru" | "en")
        )
      )
      .leftJoin(
        storeTranslations,
        and(
          eq(storeTranslations.storeId, stores.id),
          eq(storeTranslations.language, locale as "uz" | "ru" | "en")
        )
      )
      .leftJoin(
        categoryTranslations,
        and(
          eq(categoryTranslations.categoryId, categories.id),
          eq(categoryTranslations.language, locale as "uz" | "ru" | "en")
        )
      )
      .leftJoin(
        brandTranslations,
        and(
          eq(brandTranslations.brandId, brands.id),
          eq(brandTranslations.language, locale as "uz" | "ru" | "en")
        )
      )
      .where(and(...baseConditions))
      .orderBy(desc(promocodes.isFeatured), asc(promocodes.order))
      .limit(20);

    const [statsResult, allData] = await Promise.all([statsQuery, allQuery]);

    const stats = statsResult[0];
    totalPromocodesCount = stats?.total || 0;
    featuredPromocodesCount = stats?.featured || 0;
    totalViews = stats?.totalViews || 0;
    totalCopies = stats?.totalCopies || 0;

    allPromocodes = (allData as PromocodeListRow[]).map((row) =>
      mapPromocodeListRow(row, {
        includeStartsAt: false,
        includeConditions: true,
        includeMedia: true,
        includeCategory: true,
      })
    );
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error(`Error fetching category (slug: ${slug}, locale: ${locale}):`, errorObj);
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "category" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tEmpty = await getTranslations({ locale, namespace: "empty" });
  const tCard = await getTranslations({ locale, namespace: "card" });
  const tPromocode = await getTranslations({ locale, namespace: "promocode" });
  const tStore = await getTranslations({ locale, namespace: "store" });
  const categoryTitle = t("title");
  const promocodeTitle = tPromocode("title");
  const storeTitle = tStore("title");
  const schemaPromocodes = allPromocodes.slice(0, 20);
  const uniqueStoreCount = new Set(allPromocodes.map((item) => item.store?.id).filter(Boolean))
    .size;
  const uniqueBrandCount = new Set(allPromocodes.map((item) => item.brand?.id).filter(Boolean))
    .size;
  const relatedStores = Array.from(
    new Map(
      allPromocodes
        .filter((item) => item.store?.translations?.[0]?.slug)
        .map((item) => [
          item.store?.id,
          {
            id: item.store?.id || "",
            name: item.store?.translations?.[0]?.name || "",
            slug: item.store?.translations?.[0]?.slug || "",
          },
        ])
    ).values()
  ).slice(0, 4);
  const relatedBrands = Array.from(
    new Map(
      allPromocodes
        .filter((item) => item.brand?.translations?.[0]?.slug)
        .map((item) => [
          item.brand?.id,
          {
            id: item.brand?.id || "",
            name: item.brand?.translations?.[0]?.name || "",
            slug: item.brand?.translations?.[0]?.slug || "",
          },
        ])
    ).values()
  ).slice(0, 4);

  // Build breadcrumbs with full hierarchy
  const breadcrumbItems = [
    { name: tCommon("categories"), url: `/categories` },
    {
      name: categoryTranslation?.name || categoryTitle,
      url: `/category/${slug}`,
    },
  ];

  const baseUrl = getBaseUrl();

  return (
    <>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
      <StructuredData
        type="Category"
        data={{ ...category, translations: [categoryTranslation] }}
        lang={locale}
        baseUrl={baseUrl}
        promocodeCount={totalPromocodesCount}
        entityDescription={categoryTranslation?.description || undefined}
      />
      <EntityFAQSchema
        entityName={categoryTranslation?.name || categoryTitle}
        entityType="category"
        locale={locale}
      />
      {schemaPromocodes.length > 0 && (
        <ItemListSchema
          items={schemaPromocodes.map((promocode) => {
            const translation = promocode.translations[0];
            return {
              name: translation?.title || promocodeTitle,
              url: `/promocode/${translation?.slug || promocode.id}`,
              image: promocode.imageUrl || undefined,
              description: translation?.conditions || undefined,
            };
          })}
          listName={`${categoryTranslation?.name || categoryTitle} ${t("promocodes")}`}
          listDescription={`${t("activePromocodes")} ${categoryTranslation?.name || categoryTitle}`}
        />
      )}
      <div>
        <div className="page-shell py-6">
          <Breadcrumbs items={breadcrumbItems} homeName={tCommon("home")} />
        </div>
        {/* Hero Section */}
        <div className="page-shell pb-10">
          <div className="page-hero-surface">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  {category.imageUrl ? (
                    <div className="bg-card border-border relative flex size-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-[22px] border md:size-20">
                      <Image
                        src={category.imageUrl}
                        alt={
                          categoryTranslation?.name
                            ? `${categoryTranslation.name} - ${tCommon("altCategoryImage")}`
                            : tCommon("altCategoryImageWithSlug", { slug })
                        }
                        fill
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="bg-card flex size-16 flex-shrink-0 items-center justify-center rounded-[22px] md:size-20">
                      <Package
                        className="text-muted-foreground h-8 w-8 md:h-9 md:w-9"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div className="brand-kicker !mb-0">{t("heroKicker")}</div>
                </div>
                <h1 className="text-foreground mb-2 text-4xl font-semibold md:text-5xl">
                  {t("h1Title", { name: categoryTranslation?.name || categoryTitle })}
                </h1>
                {categoryTranslation?.metaDescription && (
                  <p className="text-muted-foreground max-w-3xl text-lg">
                    {categoryTranslation.metaDescription}
                  </p>
                )}
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="surface-stat">
                    <div className="text-3xl font-semibold text-[color:var(--foreground)]">
                      {totalPromocodesCount}
                    </div>
                    <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                      {t("activePromocodes")}
                    </div>
                  </div>
                  <div className="surface-stat">
                    <div className="text-3xl font-semibold text-[color:var(--foreground)]">
                      {uniqueStoreCount}
                    </div>
                    <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                      {t("storeRoutesLabel")}
                    </div>
                  </div>
                  <div className="surface-stat">
                    <div className="text-3xl font-semibold text-[color:var(--foreground)]">
                      {uniqueBrandCount}
                    </div>
                    <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                      {t("brandContextsLabel")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="surface-card border-[color:var(--accent-red)]/25 bg-[color:var(--accent)]/45 p-5">
                  <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                    {t("snapshotTitle")}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                    {t("snapshotDescription")}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="surface-stat">
                    <div className="text-sm font-semibold text-[color:var(--foreground)]">
                      {tCommon("featured")}
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                      {featuredPromocodesCount}
                    </div>
                  </div>
                  <div className="surface-stat">
                    <div className="text-sm font-semibold text-[color:var(--foreground)]">
                      {t("views")}
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                      {totalViews}
                    </div>
                  </div>
                  <div className="surface-stat sm:col-span-2">
                    <div className="text-sm font-semibold text-[color:var(--foreground)]">
                      {t("uses")}
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                      {totalCopies}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-shell py-12">
          <section className="mb-10 grid gap-4 lg:grid-cols-2">
            <div className="surface-card p-5">
              <div className="brand-kicker mb-3">{t("relatedStoresKicker")}</div>
              <p className="text-muted-foreground mb-4 text-sm leading-6">
                {t("relatedStoresDescription")}
              </p>
              <div className="flex flex-wrap gap-3">
                {relatedStores.length > 0 ? (
                  relatedStores.map((store) => (
                    <Link
                      key={store.id}
                      href={`/store/${store.slug}`}
                      className="rounded-full border border-[color:var(--border)] bg-[color:var(--secondary)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)] hover:text-[color:var(--accent-red)]"
                    >
                      {store.name}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-[color:var(--muted-foreground)]">
                    {t("noLinkedStores")}
                  </span>
                )}
              </div>
            </div>
            <div className="surface-card p-5">
              <div className="brand-kicker mb-3">{t("relatedBrandsKicker")}</div>
              <p className="text-muted-foreground mb-4 text-sm leading-6">
                {t("relatedBrandsDescription")}
              </p>
              <div className="flex flex-wrap gap-3">
                {relatedBrands.length > 0 ? (
                  relatedBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/brand/${brand.slug}`}
                      className="rounded-full border border-[color:var(--border)] bg-[color:var(--secondary)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)] hover:text-[color:var(--accent-red)]"
                    >
                      {brand.name}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-[color:var(--muted-foreground)]">
                    {t("noLinkedBrands")}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* All Promocodes */}
          <section>
            <div className="mb-8">
              <div className="brand-kicker mb-3">{t("offersKicker")}</div>
              <h2 className="text-foreground text-3xl font-semibold">{t("allPromocodes")}</h2>
              <p className="text-muted-foreground mt-2">
                {t("allPromocodesDescription", {
                  name: categoryTranslation?.name || categoryTitle,
                })}
              </p>
            </div>
            {totalPromocodesCount > 0 ? (
              <PromocodeListWithPagination
                initialPromocodes={allPromocodes}
                totalCount={totalPromocodesCount}
                limit={20}
                filters={{
                  categoryId: category.id,
                }}
                translations={{
                  noPromocodes: tEmpty("noPromocodes"),
                  noPromocodesDescription: tEmpty("noPromocodesDescription"),
                  card: {
                    featured: tCard("featured"),
                    verified: tCard("verified"),
                    fresh: tCard("fresh"),
                    popular: tCard("popular"),
                    endingSoon: tPromocode("expiresSoon"),
                    unlimited: tCard("unlimited"),
                    unknownStore: tCard("unknownStore"),
                    storeTitle,
                    promocodeTitle,
                    activateLink: tCard("activateLink"),
                    details: tCard("details"),
                    viewDetails: tCard("viewDetails"),
                    storeOffer: tCard("storeOffer"),
                    brandOffer: tCard("brandOffer"),
                    directDeal: tCard("directDeal"),
                    codeReady: tCard("codeReady"),
                    dealRoute: tCard("dealRoute"),
                    promoCodeLabel: tCard("promoCodeLabel"),
                    copy: tCard("copy"),
                    copied: tCard("copied"),
                    getDeal: tCard("getDeal"),
                    like: tCard("like"),
                    dislike: tCard("dislike"),
                    expired: tCard("expired"),
                    disabled: tCard("disabled"),
                    codeCopied: tPromocode("codeCopied"),
                    copyError: tPromocode("copyError"),
                  },
                }}
              />
            ) : totalPromocodesCount === 0 ? (
              <div className="empty-state-card">
                <MagnifyingGlass
                  className="text-muted-foreground mx-auto mb-4 h-12 w-12"
                  aria-hidden="true"
                />
                <h2 className="text-foreground mb-2 text-xl font-semibold">{t("noPromocodes")}</h2>
                <p className="text-muted-foreground">{t("checkBackLater")}</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}
