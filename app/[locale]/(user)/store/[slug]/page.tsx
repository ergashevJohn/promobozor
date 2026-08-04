import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { EntityFAQSchema } from "@/components/public/EntityFAQSchema";
import { ItemListSchema } from "@/components/public/ItemListSchema";
import { LocalBusinessSchema } from "@/components/public/LocalBusinessSchema";
import PromocodeListWithPagination from "@/components/public/PromocodeListWithPagination";
import StoreDescription from "@/components/public/StoreDescription";
import StructuredData from "@/components/public/StructuredData";
import { Link } from "@/i18n/navigation";
import type { Promocode } from "@/components/public/types";
import { getCachedStorePromocodeCounts } from "@/lib/cache/promocode-counts";
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
  generateFullMetadata,
  generateOgImageUrl,
  generateStoreDescription,
  generateStoreTitle,
  getBaseUrl,
} from "@/lib/metadata";
import { and, asc, desc, eq, isNull, lte, ne, or, sql } from "drizzle-orm";
import { StoreIcon } from "lucide-react";
import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isGone } from "@/lib/redirects";
import { NotFoundUI } from "@/components/public/NotFoundUI";

export async function generateStaticParams() {
  // Skip static generation for stores - render dynamically
  return [];
}

// This route cannot be statically rendered because the app root layout reads
// request headers (`x-nonce`, `x-pathname`) from proxy.ts. Leaving the detail
// page in ISR mode causes Next.js to throw DYNAMIC_SERVER_USAGE in production.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isValidLanguage(locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "store" });
  const storeTitle = t("title");

  // 410 Gone check
  if (isGone("store", slug)) {
    return {
      title: "Gone",
      robots: { index: false, follow: false },
    };
  }

  try {
    const [storeData] = await db
      .select({
        store: stores,
        translation: storeTranslations,
      })
      .from(stores)
      .innerJoin(
        storeTranslations,
        and(
          eq(storeTranslations.storeId, stores.id),
          eq(storeTranslations.language, locale as "uz" | "ru" | "en"),
          eq(storeTranslations.slug, slug)
        )
      )
      .where(
        and(
          eq(storeTranslations.slug, slug),
          eq(storeTranslations.language, locale as "uz" | "ru" | "en"),
          eq(stores.isActive, true)
        )
      )
      .limit(1);

    if (!storeData) {
      return {};
    }

    const translation = storeData.translation;

    // Get promocode counts from cache (5-min cache for performance)
    const promocodeCounts = await getCachedStorePromocodeCounts(storeData.store.id);
    const totalPromocodes = promocodeCounts?.total ?? 0;
    const featuredPromocodes = promocodeCounts?.featured ?? 0;

    // Generate SEO-optimized title and description
    const title =
      translation?.metaTitle ||
      generateStoreTitle(translation?.name || storeTitle, totalPromocodes, locale);
    const description =
      translation?.metaDescription ||
      generateStoreDescription(
        translation?.name || storeTitle,
        translation?.description || null,
        totalPromocodes,
        featuredPromocodes,
        locale
      );
    const url = `/${locale}/store/${slug}`;

    // Generate dynamic OG image
    const ogImage = generateOgImageUrl({
      title: translation?.name || storeTitle,
      description: translation?.description || description,
      type: "store",
      logo: storeData.store.logoUrl || undefined,
    });

    // Get all language slugs for this store
    const allTranslations = await db
      .select({
        language: storeTranslations.language,
        slug: storeTranslations.slug,
      })
      .from(storeTranslations)
      .where(eq(storeTranslations.storeId, storeData.store.id));

    const languageAlternates: Record<string, string> = {};
    allTranslations.forEach((t) => {
      languageAlternates[t.language] = `/${t.language}/store/${t.slug}`;
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

export const revalidate = 1800;

export default async function StorePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  // 410 Gone check
  if (isGone("store", slug)) {
    const messages = await getMessages();
    return <NotFoundUI locale={locale} messages={messages} statusCode="410" />;
  }

  // Fetch store by slug
  let storeData;
  let allPromocodes: Promocode[] = [];
  let totalPromocodesCount = 0;
  let featuredPromocodesCount = 0;
  let totalViews = 0;
  let totalCopies = 0;
  let store;
  let storeTranslation;

  try {
    [storeData] = await db
      .select({
        store: stores,
        translation: storeTranslations,
      })
      .from(stores)
      .innerJoin(
        storeTranslations,
        and(
          eq(storeTranslations.storeId, stores.id),
          eq(storeTranslations.language, locale as "uz" | "ru" | "en"),
          eq(storeTranslations.slug, slug)
        )
      )
      .where(
        and(
          eq(storeTranslations.slug, slug),
          eq(storeTranslations.language, locale as "uz" | "ru" | "en"),
          eq(stores.isActive, true)
        )
      )
      .limit(1);

    if (!storeData) {
      notFound();
    }

    store = storeData.store;
    storeTranslation = storeData.translation;

    // Fetch promocodes for this store (exclude draft only)
    const now = new Date();
    const baseConditions = [
      eq(promocodes.storeId, store.id),
      ne(promocodes.status, "draft"), // Exclude draft, show all others
      eq(stores.isActive, true),
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
      .select({
        promocode: promocodes,
        store: stores,
        storeTranslation: storeTranslations,
        category: categories,
        categoryTranslation: categoryTranslations,
        brand: brands,
        brandTranslation: brandTranslations,
        promocodeTranslation: promocodeTranslations,
      })
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .leftJoin(categories, eq(promocodes.categoryId, categories.id))
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

    const mapPromocode = (row: {
      promocode: typeof promocodes.$inferSelect;
      store: typeof stores.$inferSelect | null;
      storeTranslation: typeof storeTranslations.$inferSelect | null;
      category: typeof categories.$inferSelect | null;
      categoryTranslation: typeof categoryTranslations.$inferSelect | null;
      brand: typeof brands.$inferSelect | null;
      brandTranslation: typeof brandTranslations.$inferSelect | null;
      promocodeTranslation: typeof promocodeTranslations.$inferSelect | null;
    }): Promocode => ({
      id: row.promocode.id,
      type: row.promocode.type as "code" | "link",
      code: row.promocode.code,
      link: row.promocode.link,
      discountType: row.promocode.discountType,
      discountValue: row.promocode.discountValue,
      currency: row.promocode.currency,
      originalPrice:
        "originalPrice" in row.promocode
          ? ((row.promocode as { originalPrice?: number | null }).originalPrice ?? null)
          : null,
      imageUrl:
        "imageUrl" in row.promocode
          ? ((row.promocode as { imageUrl?: string | null }).imageUrl ?? null)
          : null,
      isFeatured: row.promocode.isFeatured,
      status: row.promocode.status,
      viewsCount: row.promocode.viewsCount,
      copyCount: row.promocode.copyCount,
      likesCount: row.promocode.likesCount,
      dislikesCount: row.promocode.dislikesCount,
      expiresAt: row.promocode.expiresAt?.toISOString() || null,
      translations: row.promocodeTranslation
        ? [{ ...row.promocodeTranslation, slug: row.promocodeTranslation.slug }]
        : [],
      store: row.store
        ? {
            id: row.store.id,
            logoUrl: row.store.logoUrl,
            websiteUrl: row.store.websiteUrl,
            translations: row.storeTranslation ? [{ ...row.storeTranslation }] : [],
          }
        : null,
      category:
        row.category && row.categoryTranslation
          ? {
              id: row.category.id,
              imageUrl: row.category.imageUrl,
              translations: [{ ...row.categoryTranslation, slug: row.categoryTranslation.slug }],
            }
          : null,
      brand:
        row.brand && row.brandTranslation
          ? {
              id: row.brand.id,
              imageUrl: row.brand.imageUrl,
              websiteUrl: row.brand.websiteUrl,
              translations: [{ ...row.brandTranslation, slug: row.brandTranslation.slug }],
            }
          : null,
    });

    allPromocodes = allData.map(mapPromocode);
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error("Error fetching store:", errorObj);
    console.error("Error details:", errorObj.message);
    console.error("Store slug:", slug);
    console.error("Language:", locale);
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "store" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tEmpty = await getTranslations({ locale, namespace: "empty" });
  const tCard = await getTranslations({ locale, namespace: "card" });
  const tPromocode = await getTranslations({ locale, namespace: "promocode" });
  const storeTitle = t("title");
  const promocodeTitle = tPromocode("title");
  const schemaPromocodes = allPromocodes.slice(0, 20);
  const uniqueBrandCount = new Set(allPromocodes.map((item) => item.brand?.id).filter(Boolean))
    .size;
  const uniqueCategoryCount = new Set(
    allPromocodes.map((item) => item.category?.id).filter(Boolean)
  ).size;
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
  const relatedCategories = Array.from(
    new Map(
      allPromocodes
        .filter((item) => item.category?.translations?.[0]?.slug)
        .map((item) => [
          item.category?.id,
          {
            id: item.category?.id || "",
            name: item.category?.translations?.[0]?.name || "",
            slug: item.category?.translations?.[0]?.slug || "",
          },
        ])
    ).values()
  ).slice(0, 4);

  // Build breadcrumbs with full hierarchy
  const breadcrumbItems = [
    { name: tCommon("stores"), url: `/stores` },
    {
      name: storeTranslation?.name || storeTitle,
      url: `/store/${slug}`,
    },
  ];

  const baseUrl = getBaseUrl();

  return (
    <>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
      <StructuredData
        type="Store"
        data={{ ...store, translations: [storeTranslation] }}
        lang={locale}
        baseUrl={baseUrl}
        promocodeCount={totalPromocodesCount}
        entityDescription={storeTranslation?.description || undefined}
      />
      <EntityFAQSchema
        entityName={storeTranslation?.name || storeTitle}
        entityType="store"
        locale={locale}
      />
      <LocalBusinessSchema
        name={storeTranslation?.name || storeTitle}
        url={`/store/${slug}`}
        description={storeTranslation?.description || undefined}
        logo={store.logoUrl || undefined}
        priceRange="$$"
        sameAs={store.websiteUrl ? [store.websiteUrl] : undefined}
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
          listName={`${storeTranslation?.name || storeTitle} ${t("promocodes")}`}
          listDescription={`${t("activePromocodes")} ${storeTranslation?.name || storeTitle}`}
        />
      )}
      <div>
        <div className="page-shell py-6">
          <Breadcrumbs items={breadcrumbItems} homeName={tCommon("home")} />
        </div>
        {/* Hero Section */}
        <div className="page-shell pb-10">
          <div className="page-hero-surface">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
              <div>
                <div className="mb-6 flex items-start gap-4">
                  {store.logoUrl ? (
                    <div className="bg-card border-border relative mt-2 flex size-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-[22px] border md:size-20">
                      <Image
                        src={store.logoUrl}
                        alt={
                          storeTranslation?.name
                            ? `${storeTranslation.name} - ${tCommon("altStoreLogo")}`
                            : tCommon("altStoreLogoWithSlug", { slug })
                        }
                        fill
                        className="h-full w-full object-contain"
                        sizes="80px"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="bg-muted border-border flex size-16 flex-shrink-0 items-center justify-center rounded-[22px] border text-4xl md:size-20">
                      <StoreIcon className="text-foreground size-10 md:size-12" />
                    </div>
                  )}
                  <div>
                    <div className="brand-kicker mb-4">{t("heroKicker")}</div>
                    <h1 className="text-foreground mb-2 text-3xl font-semibold md:text-5xl">
                      {t("h1Title", { name: storeTranslation?.name || storeTitle })}
                    </h1>
                    {storeTranslation?.description && (
                      <StoreDescription description={storeTranslation.description} />
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[24px] border border-[color:var(--border)] bg-card/95 p-4 shadow-[0_18px_48px_-38px_rgba(17,24,39,0.24)]">
                    <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                      {t("activeRouteLabel")}
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                      {totalPromocodesCount}
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                      {t("activePromocodes")}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-[color:var(--border)] bg-card/95 p-4 shadow-[0_18px_48px_-38px_rgba(17,24,39,0.24)]">
                    <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                      {t("brandMixLabel")}
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                      {uniqueBrandCount}
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                      {t("connectedBrandsLabel")}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-[color:var(--border)] bg-card/95 p-4 shadow-[0_18px_48px_-38px_rgba(17,24,39,0.24)]">
                    <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                      {t("categorySpreadLabel")}
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                      {uniqueCategoryCount}
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                      {t("activeCategoryPathsLabel")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-[color:var(--foreground)]/10 bg-[linear-gradient(160deg,rgba(17,24,39,0.98),rgba(17,24,39,0.9))] p-5 text-white shadow-[0_28px_70px_-46px_rgba(17,24,39,0.75)]">
                  <div className="text-xs font-semibold tracking-[0.16em] text-white/70 uppercase">
                    {t("storeTrustTitle")}
                  </div>
                  <div className="mt-3 text-2xl font-semibold">
                    {featuredPromocodesCount} {tCommon("featured").toLowerCase()}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/74">
                    {t("storeTrustDescription")}
                  </p>
                  {store.websiteUrl && (
                    <a
                      href={store.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition-transform hover:-translate-y-0.5"
                    >
                      {t("visitWebsite")}
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-[color:var(--border)] bg-card/95 p-4 shadow-[0_18px_48px_-38px_rgba(17,24,39,0.24)]">
                    <div className="text-sm font-semibold text-[color:var(--foreground)]">
                      {t("views")}
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                      {totalViews}
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-[color:var(--border)] bg-card/95 p-4 shadow-[0_18px_48px_-38px_rgba(17,24,39,0.24)]">
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
            <div className="rounded-[26px] border border-[color:var(--border)] bg-card/95 p-5 shadow-[0_20px_56px_-42px_rgba(17,24,39,0.26)]">
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
            <div className="rounded-[26px] border border-[color:var(--border)] bg-card/95 p-5 shadow-[0_20px_56px_-42px_rgba(17,24,39,0.26)]">
              <div className="brand-kicker mb-3">{t("relatedCategoriesKicker")}</div>
              <p className="text-muted-foreground mb-4 text-sm leading-6">
                {t("relatedCategoriesDescription")}
              </p>
              <div className="flex flex-wrap gap-3">
                {relatedCategories.length > 0 ? (
                  relatedCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className="rounded-full border border-[color:var(--border)] bg-[color:var(--secondary)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)] hover:text-[color:var(--accent-red)]"
                    >
                      {category.name}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-[color:var(--muted-foreground)]">
                    {t("noLinkedCategories")}
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
                  name: storeTranslation?.name || storeTitle,
                })}
              </p>
            </div>
            {totalPromocodesCount > 0 ? (
              <PromocodeListWithPagination
                initialPromocodes={allPromocodes}
                totalCount={totalPromocodesCount}
                limit={20}
                filters={{
                  storeId: store.id,
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
                    conditionsLabel: tCard("conditionsLabel"),
                    codeCopied: tPromocode("codeCopied"),
                    copyError: tPromocode("copyError"),
                  },
                }}
              />
            ) : totalPromocodesCount === 0 ? (
              <div className="empty-state-card">
                <div className="mb-4 text-6xl" aria-hidden="true">
                  🔍
                </div>
                <h2 className="text-foreground mb-2 text-xl font-semibold">{t("noPromocodes")}</h2>
                <p className="text-muted-foreground">{t("checkBackLater")}</p>
                <Link
                  href="/promocodes"
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--accent-red)] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {t("emptyCta")}
                </Link>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}
