import BrandDescription from "@/components/public/BrandDescription";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { EntityFAQSchema } from "@/components/public/EntityFAQSchema";
import { ItemListSchema } from "@/components/public/ItemListSchema";
import { LocalBusinessSchema } from "@/components/public/LocalBusinessSchema";
import PromocodeListWithPagination from "@/components/public/PromocodeListWithPagination";
import StructuredData from "@/components/public/StructuredData";
import { Link } from "@/i18n/navigation";
import type { Promocode } from "@/components/public/types";
import { Locale } from "@/i18n/routing";
import { getCachedBrandPromocodeCounts } from "@/lib/cache/promocode-counts";
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
import { getApprovedImageUrl } from "@/lib/media";
import {
  generateBrandDescription,
  generateBrandTitle,
  generateFullMetadata,
  generateOgImageUrl,
  getBaseUrl,
} from "@/lib/metadata";
import { getBrandLanguageAlternates, getCachedBrandBySlug } from "@/lib/queries/entities";
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
import { Buildings, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

export async function generateStaticParams() {
  // Skip static generation for brands - render dynamically
  // This prevents build errors when brands table doesn't exist
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
  const t = await getTranslations({ locale, namespace: "brand" });
  const brandTitle = t("title");

  // 410 Gone check
  if (isGone("brand", slug)) {
    return {
      title: "Gone",
      robots: { index: false, follow: false },
    };
  }

  try {
    const brandData = await getCachedBrandBySlug(locale, slug);

    if (!brandData) {
      return {};
    }

    const translation = brandData.translation;

    // Get promocode counts from cache (5-min cache for performance)
    const counts = await getCachedBrandPromocodeCounts(brandData.brand.id);
    const totalPromocodes = counts?.total ?? 0;

    // Generate SEO-optimized title and description
    const title =
      translation?.metaTitle ||
      generateBrandTitle(translation?.name || brandTitle, totalPromocodes, locale);
    const description =
      translation?.metaDescription ||
      generateBrandDescription(
        translation?.name || brandTitle,
        translation?.description || null,
        totalPromocodes,
        locale
      );
    const url = `/${locale}/brand/${slug}`;

    // Generate dynamic OG image
    const ogImage = generateOgImageUrl({
      title: translation?.name || brandTitle,
      description: translation?.description || description,
      type: "brand",
      logo: brandData.brand.imageUrl || undefined,
    });

    // Get all language slugs for this brand
    const allTranslations = await getBrandLanguageAlternates(brandData.brand.id);

    const languageAlternates: Record<string, string> = {};
    allTranslations.forEach((t) => {
      languageAlternates[t.language] = `/${t.language}/brand/${t.slug}`;
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

export default async function BrandPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  // 410 Gone check
  if (isGone("brand", slug)) {
    const messages = await getMessages();
    return <NotFoundUI locale={locale} messages={messages} statusCode="410" />;
  }

  // Fetch brand by slug
  let allPromocodes: Promocode[] = [];
  let totalPromocodesCount = 0;
  let brand: {
    id: string;
    imageUrl: string | null;
    websiteUrl: string | null;
    isActive: boolean;
  };
  let brandTranslation: {
    id: string;
    brandId: string;
    language: string;
    name: string;
    slug: string;
    description: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  };

  try {
    const brandData = await getCachedBrandBySlug(locale, slug);

    if (!brandData) {
      notFound();
    }

    brand = brandData.brand;
    brandTranslation = brandData.translation;

    // Fetch promocodes for this brand (exclude draft only)
    const now = new Date();
    const baseConditions = [
      eq(promocodes.brandId, brand.id),
      ne(promocodes.status, "draft"), // Exclude draft, show all others
      or(isNull(promocodes.storeId), eq(stores.isActive, true)),
      // Note: Allow expired promocodes to show
      or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
    ];

    const statsQuery = db
      .select({
        total: sql<number>`COUNT(*)::int`.as("total"),
      })
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .where(and(...baseConditions));

    const allQuery = db
      .select(promocodeListSelectWithCategory)
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .leftJoin(categories, eq(promocodes.categoryId, categories.id))
      .leftJoin(brands, eq(promocodes.brandId, brands.id))
      .leftJoin(
        promocodeTranslations,
        and(
          eq(promocodeTranslations.promocodeId, promocodes.id),
          eq(promocodeTranslations.language, locale as Locale)
        )
      )
      .leftJoin(
        storeTranslations,
        and(
          eq(storeTranslations.storeId, stores.id),
          eq(storeTranslations.language, locale as Locale)
        )
      )
      .leftJoin(
        categoryTranslations,
        and(
          eq(categoryTranslations.categoryId, categories.id),
          eq(categoryTranslations.language, locale as Locale)
        )
      )
      .leftJoin(
        brandTranslations,
        and(
          eq(brandTranslations.brandId, brands.id),
          eq(brandTranslations.language, locale as Locale)
        )
      )
      .where(and(...baseConditions))
      .orderBy(desc(promocodes.isFeatured), asc(promocodes.order))
      .limit(20);

    const [statsResult, allData] = await Promise.all([statsQuery, allQuery]);

    const stats = statsResult[0];
    totalPromocodesCount = stats?.total || 0;

    const brandFallback = {
      id: brand.id,
      imageUrl: brand.imageUrl,
      websiteUrl: brand.websiteUrl,
      translations: [
        {
          language: brandTranslation.language,
          name: brandTranslation.name,
          slug: brandTranslation.slug,
        },
      ],
    };

    allPromocodes = (allData as PromocodeListRow[]).map((row) =>
      mapPromocodeListRow(row, {
        includeStartsAt: false,
        includeConditions: true,
        includeMedia: true,
        includeCategory: true,
        brandFallback,
      })
    );
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error("Error fetching brand:", errorObj);
    console.error("Error details:", errorObj.message);
    console.error("Brand slug:", slug);
    console.error("Language:", locale);

    // If brands table doesn't exist yet, just return not found
    if (errorObj.message?.includes("brands") || errorObj.message?.includes("brand_id")) {
      console.log(
        "ℹ️  Brands table not found. Please run db/add-brands.sql or updated db/init.sql"
      );
    }

    notFound();
  }

  const t = await getTranslations({ locale, namespace: "brand" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tEmpty = await getTranslations({ locale, namespace: "empty" });
  const tCard = await getTranslations({ locale, namespace: "card" });
  const tPromocode = await getTranslations({ locale, namespace: "promocode" });
  const tStore = await getTranslations({ locale, namespace: "store" });
  const brandTitle = t("title");
  const promocodeTitle = tPromocode("title");
  const storeTitle = tStore("title");
  const schemaPromocodes = allPromocodes.slice(0, 20);
  const uniqueStoreCount = new Set(allPromocodes.map((item) => item.store?.id).filter(Boolean))
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
    { name: tCommon("brands"), url: `/brands` },
    {
      name: brandTranslation?.name || brandTitle,
      url: `/brand/${slug}`,
    },
  ];

  const baseUrl = getBaseUrl();
  const brandImageUrl = getApprovedImageUrl(brand.imageUrl);

  return (
    <>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
      <StructuredData
        type="Brand"
        data={{ ...brand, translations: [brandTranslation] }}
        lang={locale}
        baseUrl={baseUrl}
        promocodeCount={totalPromocodesCount}
        entityDescription={brandTranslation?.description || undefined}
      />
      <EntityFAQSchema
        entityName={brandTranslation?.name || brandTitle}
        entityType="brand"
        locale={locale}
      />
      <LocalBusinessSchema
        name={brandTranslation?.name || brandTitle}
        url={`/brand/${slug}`}
        description={brandTranslation?.description || undefined}
        logo={brand.imageUrl || undefined}
        priceRange="$$"
        // sameAs={brand.website ? [brand.website] : undefined}
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
          listName={`${brandTranslation?.name || brandTitle} ${t("promocodes")}`}
          listDescription={`${t("activePromocodes")} ${brandTranslation?.name || brandTitle}`}
        />
      )}
      <div>
        <div className="page-shell py-6">
          <Breadcrumbs items={breadcrumbItems} homeName={tCommon("home")} />
        </div>
        {/* Hero Section - logo-forward */}
        <div className="page-shell pb-10">
          <div className="page-hero-surface">
            <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
              {brandImageUrl ? (
                <div className="bg-card border-border relative size-28 shrink-0 overflow-hidden rounded-2xl border md:size-36">
                  <Image
                    src={brandImageUrl}
                    alt={
                      brandTranslation?.name
                        ? `${brandTranslation.name} - ${tCommon("altBrandLogo")}`
                        : tCommon("altBrandLogoWithSlug", { slug })
                    }
                    fill
                    className="object-contain p-3"
                    sizes="144px"
                    priority
                  />
                </div>
              ) : (
                <div className="bg-muted border-border flex size-28 shrink-0 items-center justify-center rounded-2xl border text-[color:var(--accent-red)] md:size-36">
                  <Buildings className="h-12 w-12" aria-hidden="true" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="brand-kicker mb-4">{t("heroKicker")}</div>
                <h1 className="text-foreground mb-3 text-3xl font-semibold tracking-tight md:text-5xl">
                  {t("h1Title", { name: brandTranslation?.name || brandTitle })}
                </h1>
                {brandTranslation?.description && (
                  <BrandDescription description={brandTranslation.description} />
                )}
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <span className="text-muted-foreground text-sm">
                    <strong className="text-foreground text-lg font-semibold">
                      {totalPromocodesCount}
                    </strong>{" "}
                    {t("activePromocodes")}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    <strong className="text-foreground text-lg font-semibold">
                      {uniqueStoreCount}
                    </strong>{" "}
                    {t("storePlacementsLabel")}
                  </span>
                  {brand.websiteUrl && (
                    <a
                      href={brand.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      className="bg-card inline-flex min-h-11 items-center gap-2 rounded-xl border border-[color:var(--border)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]"
                    >
                      {t("officialWebsite")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-shell py-12">
          <section className="mb-10 grid gap-4 lg:grid-cols-2">
            <div className="surface-card p-5">
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
              <h2 className="text-foreground text-3xl font-semibold">{t("allPromocodes")}</h2>
              <p className="text-muted-foreground mt-2">
                {t("allPromocodesDescription", {
                  name: brandTranslation?.name || brandTitle,
                })}
              </p>
            </div>
            {totalPromocodesCount > 0 ? (
              <PromocodeListWithPagination
                initialPromocodes={allPromocodes}
                totalCount={totalPromocodesCount}
                limit={20}
                filters={{
                  brandId: brand.id,
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
