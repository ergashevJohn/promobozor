import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { EntityFAQSection } from "@/components/public/EntityFAQSection";
import { ItemListSchema } from "@/components/public/ItemListSchema";
import { LocalBusinessSchema } from "@/components/public/LocalBusinessSchema";
import { NotFoundUI } from "@/components/public/NotFoundUI";
import StructuredData from "@/components/public/StructuredData";
import { VerifiedBadge } from "@/components/public/VerifiedBadge";
import BrandHero from "@/components/public/brand/BrandHero";
import BrandPromocodes from "@/components/public/brand/BrandPromocodes";
import BrandRelatedCategories from "@/components/public/brand/BrandRelatedCategories";
import BrandRelatedStores from "@/components/public/brand/BrandRelatedStores";
import type { Promocode } from "@/components/public/types";
import { Locale } from "@/i18n/routing";
import { countUnique } from "@/lib/array-utils";
import { getCachedBrandPromocodeCounts } from "@/lib/cache/promocode-counts";
import { resolveEntityBody, stripHtml } from "@/lib/content-seo";
import { getHubEditorial } from "@/lib/hub-editorial";
import { isValidLanguage } from "@/lib/i18n";
import { getApprovedImageUrl } from "@/lib/media";
import {
  generateBrandDescription,
  generateBrandTitle,
  generateFullMetadata,
  generateOgImageUrl,
  getBaseUrl,
} from "@/lib/metadata";
import { getCachedBrandPageData } from "@/lib/queries/brand-page";
import {
  getBrandLanguageAlternates,
  getBrandStaticParams,
  getCachedBrandBySlug,
} from "@/lib/queries/entities";
import { isGone } from "@/lib/redirects";
import { getEntityPath, type Locale as RouteLocale } from "@/lib/routes";
import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, unstable_rethrow } from "next/navigation";

export async function generateStaticParams() {
  return getBrandStaticParams();
}

export const revalidate = 1800;
export const dynamicParams = true;
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
    const hubEditorial = getHubEditorial(slug, locale, "brand");
    const hubDescription = resolveEntityBody({
      bodyHtml: translation?.bodyHtml,
      shortSummary: translation?.shortSummary,
      description: translation?.description,
      hubDescription: hubEditorial?.description,
    });
    const metaBodyPlain = hubDescription ? stripHtml(hubDescription) : null;

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
        metaBodyPlain || translation?.shortSummary || null,
        totalPromocodes,
        locale
      );
    const url = getEntityPath(locale as RouteLocale, "brand", slug);

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
      languageAlternates[t.language] = getEntityPath(t.language as RouteLocale, "brand", t.slug);
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
  setRequestLocale(locale);

  if (!isValidLanguage(locale)) {
    notFound();
  }

  // 410 Gone check
  if (isGone("brand", slug)) {
    const messages = await getMessages({ locale });
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
    lastReviewedAt: Date | null;
  };
  let brandTranslation: {
    id: string;
    brandId: string;
    language: string;
    name: string;
    slug: string;
    description: string | null;
    shortSummary: string | null;
    bodyHtml: string | null;
    howToHtml: string | null;
    faqJson: unknown;
    metaTitle: string | null;
    metaDescription: string | null;
  };
  let resolvedBrandDescription: string | undefined;

  const brandData = await getCachedBrandBySlug(locale, slug);

  if (!brandData) {
    notFound();
  }

  try {
    brand = brandData.brand;
    brandTranslation = brandData.translation;

    const hubEditorial = getHubEditorial(slug, locale, "brand");
    resolvedBrandDescription =
      resolveEntityBody({
        bodyHtml: brandTranslation?.bodyHtml,
        shortSummary: brandTranslation?.shortSummary,
        description: brandTranslation?.description,
        hubDescription: hubEditorial?.description,
      }) || undefined;

    // Fetch promocodes and stats for this brand
    const pageData = await getCachedBrandPageData(brand.id, locale as Locale);

    totalPromocodesCount = pageData.stats?.total || 0;
    allPromocodes = pageData.promocodes;
  } catch (error) {
    unstable_rethrow(error);
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

  const [t, tCommon, tEmpty, tCard, tPromocode, tStore] = await Promise.all([
    getTranslations({ locale, namespace: "brand" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "empty" }),
    getTranslations({ locale, namespace: "card" }),
    getTranslations({ locale, namespace: "promocode" }),
    getTranslations({ locale, namespace: "store" }),
  ]);

  const brandTitle = t("title");
  const promocodeTitle = tPromocode("title");
  const storeTitle = tStore("title");
  const schemaPromocodes = allPromocodes.slice(0, 20);
  const uniqueStoreCount = countUnique(allPromocodes, (item) => item.store?.id);

  // Single-pass extraction for related stores
  const relatedStoresMap = new Map();
  for (const item of allPromocodes) {
    if (item.store?.translations?.[0]?.slug) {
      relatedStoresMap.set(item.store?.id, {
        id: item.store?.id || "",
        name: item.store?.translations?.[0]?.name || "",
        slug: item.store?.translations?.[0]?.slug || "",
      });
    }
  }
  const relatedStores = Array.from(relatedStoresMap.values()).slice(0, 4);

  // Single-pass extraction for related categories
  const relatedCategoriesMap = new Map();
  for (const item of allPromocodes) {
    if (item.category?.translations?.[0]?.slug) {
      relatedCategoriesMap.set(item.category?.id, {
        id: item.category?.id || "",
        name: item.category?.translations?.[0]?.name || "",
        slug: item.category?.translations?.[0]?.slug || "",
      });
    }
  }
  const relatedCategories = Array.from(relatedCategoriesMap.values()).slice(0, 4);

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
        entityDescription={resolvedBrandDescription}
      />
      <LocalBusinessSchema
        name={brandTranslation?.name || brandTitle}
        url={`/brand/${slug}`}
        description={resolvedBrandDescription}
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
          <Breadcrumbs locale={locale} items={breadcrumbItems} homeName={tCommon("home")} />
        </div>
        {/* Hero Section - logo-forward */}
        <BrandHero
          brandName={brandTranslation?.name || brandTitle}
          brandDescription={resolvedBrandDescription}
          brandImageUrl={brandImageUrl}
          brandWebsiteUrl={brand.websiteUrl}
          totalPromocodes={totalPromocodesCount}
          uniqueStoreCount={uniqueStoreCount}
          t={t}
          tCommon={tCommon}
          slug={slug}
        />
        <div className="page-shell pt-2">
          <VerifiedBadge
            verifiedAt={brand.lastReviewedAt}
            locale={locale}
            label={t("lastReviewed")}
          />
        </div>

        <div className="page-shell py-12">
          <section className="mb-10 grid gap-4 lg:grid-cols-2">
            <BrandRelatedStores relatedStores={relatedStores} t={t} />
            <BrandRelatedCategories relatedCategories={relatedCategories} t={t} />
          </section>

          {/* All Promocodes */}
          <BrandPromocodes
            allPromocodes={allPromocodes}
            totalPromocodesCount={totalPromocodesCount}
            brandId={brand.id}
            brandName={brandTranslation?.name || brandTitle}
            listKicker={tCommon("listKicker")}
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
            t={t}
          />

          <EntityFAQSection
            entityName={brandTranslation?.name || brandTitle}
            entityType="brand"
            locale={locale}
            title={t("faqTitle", { name: brandTranslation?.name || brandTitle })}
            description={t("faqDescription", { name: brandTranslation?.name || brandTitle })}
            faqJson={brandTranslation?.faqJson}
          />
        </div>
      </div>
    </>
  );
}
