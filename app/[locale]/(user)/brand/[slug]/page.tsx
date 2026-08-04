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
  Brand,
  brands,
  BrandTranslation,
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
  generateBrandDescription,
  generateBrandTitle,
  generateFullMetadata,
  generateOgImageUrl,
  getBaseUrl,
} from "@/lib/metadata";
import { and, asc, desc, eq, isNull, lte, ne, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isGone } from "@/lib/redirects";
import { NotFoundUI } from "@/components/public/NotFoundUI";

export async function generateStaticParams() {
  // Skip static generation for brands - render dynamically
  // This prevents build errors when brands table doesn't exist
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
    const [brandData] = await db
      .select({
        brand: brands,
        translation: brandTranslations,
      })
      .from(brands)
      .innerJoin(
        brandTranslations,
        and(
          eq(brandTranslations.brandId, brands.id),
          eq(brandTranslations.language, locale as Locale),
          eq(brandTranslations.slug, slug)
        )
      )
      .where(
        and(
          eq(brandTranslations.slug, slug),
          eq(brandTranslations.language, locale as Locale),
          eq(brands.isActive, true)
        )
      )
      .limit(1);

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
    const allTranslations = await db
      .select({
        language: brandTranslations.language,
        slug: brandTranslations.slug,
      })
      .from(brandTranslations)
      .where(eq(brandTranslations.brandId, brandData.brand.id));

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

export const revalidate = 1800;

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
  let brandData;
  let allPromocodes: Promocode[] = [];
  let totalPromocodesCount = 0;
  let featuredPromocodesCount = 0;
  let totalViews = 0;
  let totalCopies = 0;
  let brand: Brand;
  let brandTranslation: BrandTranslation;

  try {
    [brandData] = await db
      .select({
        brand: brands,
        translation: brandTranslations,
      })
      .from(brands)
      .innerJoin(
        brandTranslations,
        and(
          eq(brandTranslations.brandId, brands.id),
          eq(brandTranslations.language, locale as Locale),
          eq(brandTranslations.slug, slug)
        )
      )
      .where(
        and(
          eq(brandTranslations.slug, slug),
          eq(brandTranslations.language, locale as "uz" | "ru" | "en"),
          eq(brands.isActive, true)
        )
      )
      .limit(1);

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
        promocodeTranslation: promocodeTranslations,
      })
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .leftJoin(categories, eq(promocodes.categoryId, categories.id))
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
      brand: {
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
      },
    });

    allPromocodes = allData.map(mapPromocode);
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
  const uniqueCategoryCount = new Set(
    allPromocodes.map((item) => item.category?.id).filter(Boolean)
  ).size;
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
        {/* Hero Section */}
        <div className="page-shell pb-10">
          <div className="page-hero-surface">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
              <div className="rounded-[30px] border border-white/80 bg-white/80 p-6 shadow-[0_24px_68px_-48px_rgba(17,24,39,0.35)]">
                <div className="mb-5 flex items-center gap-4">
                  {brand.imageUrl ? (
                    <div className="bg-card border-border relative flex size-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-[22px] border md:size-20">
                      <Image
                        src={brand.imageUrl}
                        width={80}
                        height={80}
                        alt={
                          brandTranslation?.name
                            ? `${brandTranslation.name} - ${tCommon("altBrandLogo")}`
                            : tCommon("altBrandLogoWithSlug", { slug })
                        }
                        className="h-full w-full object-cover"
                        sizes="80px"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="bg-muted border-border flex size-16 flex-shrink-0 items-center justify-center rounded-[22px] border text-4xl md:size-20">
                      ⭐
                    </div>
                  )}
                  <div className="brand-kicker !mb-0">{t("heroKicker")}</div>
                </div>
                <h1 className="text-foreground mb-3 text-3xl font-semibold md:text-5xl">
                  {t("h1Title", { name: brandTranslation?.name || brandTitle })}
                </h1>
                {brandTranslation?.description && (
                  <BrandDescription description={brandTranslation.description} />
                )}
                {brand.websiteUrl && (
                  <a
                    href={brand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition-transform hover:-translate-y-0.5"
                  >
                    {t("officialWebsite")}
                  </a>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-[color:var(--foreground)]/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(248,250,252,0.95))] p-5 shadow-[0_24px_60px_-42px_rgba(17,24,39,0.3)] sm:col-span-2">
                  <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                    {t("coverageLabel")}
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-3">
                    <div>
                      <div className="text-3xl font-semibold text-[color:var(--foreground)]">
                        {totalPromocodesCount}
                      </div>
                      <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                        {t("activePromocodes")}
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-semibold text-[color:var(--foreground)]">
                        {uniqueStoreCount}
                      </div>
                      <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                        {t("storePlacementsLabel")}
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-semibold text-[color:var(--foreground)]">
                        {uniqueCategoryCount}
                      </div>
                      <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                        {t("categoryContextsLabel")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[color:var(--border)] bg-card/95 p-4 shadow-[0_18px_48px_-38px_rgba(17,24,39,0.24)]">
                  <div className="text-sm font-semibold text-[color:var(--foreground)]">
                    {tCommon("featured")}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                    {featuredPromocodesCount}
                  </div>
                </div>
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
                <div className="rounded-[24px] border border-[color:var(--border)] bg-card/95 p-4 shadow-[0_18px_48px_-38px_rgba(17,24,39,0.24)] sm:col-span-2">
                  <div className="text-sm font-semibold text-[color:var(--foreground)]">
                    {t("editorialLensTitle")}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                    {t("editorialLensDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-shell py-12">
          <section className="mb-10 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[26px] border border-[color:var(--border)] bg-card/95 p-5 shadow-[0_20px_56px_-42px_rgba(17,24,39,0.26)]">
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
                <div className="mb-4 text-6xl" aria-hidden="true">
                  🔍
                </div>
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
