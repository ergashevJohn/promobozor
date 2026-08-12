import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { EntityFAQSection } from "@/components/public/EntityFAQSection";
import { ItemListSchema } from "@/components/public/ItemListSchema";
import { LocalBusinessSchema } from "@/components/public/LocalBusinessSchema";
import PromocodeListWithPagination from "@/components/public/PromocodeListWithPagination";
import StoreHero from "@/components/public/store/StoreHero";
import StoreRelatedBrands from "@/components/public/store/StoreRelatedBrands";
import StoreRelatedCategories from "@/components/public/store/StoreRelatedCategories";
import StructuredData from "@/components/public/StructuredData";
import { Link } from "@/i18n/navigation";
import type { Promocode } from "@/components/public/types";
import { getCachedStorePromocodeCounts } from "@/lib/cache/promocode-counts";
import { getHubEditorial } from "@/lib/hub-editorial";
import { isValidLanguage } from "@/lib/i18n";
import {
  generateFullMetadata,
  generateOgImageUrl,
  generateStoreDescription,
  generateStoreTitle,
  getBaseUrl,
} from "@/lib/metadata";
import { getCachedStoreBySlug, getStoreLanguageAlternates } from "@/lib/queries/entities";
import { fetchStorePageData } from "@/lib/queries/store-page";
import { countUnique } from "@/lib/array-utils";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound, unstable_rethrow } from "next/navigation";
import { isGone } from "@/lib/redirects";
import { NotFoundUI } from "@/components/public/NotFoundUI";

export async function generateStaticParams() {
  // Skip static generation for stores - render dynamically
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
    const storeData = await getCachedStoreBySlug(locale, slug);

    if (!storeData) {
      return {};
    }

    const translation = storeData.translation;
    const hubEditorial = getHubEditorial(slug, locale, "store");
    const hubDescription =
      translation?.description && translation.description.trim().length >= 80
        ? translation.description
        : hubEditorial?.description || translation?.description || null;

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
        hubDescription,
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
    const allTranslations = await getStoreLanguageAlternates(storeData.store.id);
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
  let allPromocodes: Promocode[] = [];
  let totalPromocodesCount = 0;
  let featuredPromocodesCount = 0;
  let totalViews = 0;
  let totalCopies = 0;
  let store;
  let storeTranslation;
  let resolvedStoreDescription: string | undefined;

  let storeData;
  try {
    storeData = await getCachedStoreBySlug(locale, slug);
  } catch (error) {
    unstable_rethrow(error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error("Error fetching store:", errorObj);
    console.error("Error details:", errorObj.message);
    console.error("Store slug:", slug);
    console.error("Language:", locale);
    notFound();
  }

  if (!storeData) {
    notFound();
  }

  try {
    store = storeData.store;
    storeTranslation = storeData.translation;

    const hubEditorial = getHubEditorial(slug, locale, "store");
    resolvedStoreDescription =
      storeTranslation?.description && storeTranslation.description.trim().length >= 80
        ? storeTranslation.description
        : hubEditorial?.description || storeTranslation?.description || undefined;

    // Fetch promocodes and stats for this store
    const pageData = await fetchStorePageData(store.id, locale as "uz" | "ru" | "en");

    totalPromocodesCount = pageData.stats?.total || 0;
    featuredPromocodesCount = pageData.stats?.featured || 0;
    totalViews = pageData.stats?.totalViews || 0;
    totalCopies = pageData.stats?.totalCopies || 0;
    allPromocodes = pageData.promocodes;
  } catch (error) {
    unstable_rethrow(error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error("Error fetching store page data:", errorObj);
    console.error("Error details:", errorObj.message);
    console.error("Store slug:", slug);
    console.error("Language:", locale);
    notFound();
  }
  const [t, tCommon, tEmpty, tCard, tPromocode] = await Promise.all([
    getTranslations({ locale, namespace: "store" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "empty" }),
    getTranslations({ locale, namespace: "card" }),
    getTranslations({ locale, namespace: "promocode" }),
  ]);

  const storeTitle = t("title");
  const promocodeTitle = tPromocode("title");
  const schemaPromocodes = allPromocodes.slice(0, 20);
  const uniqueBrandCount = countUnique(allPromocodes, (item) => item.brand?.id);
  const uniqueCategoryCount = countUnique(allPromocodes, (item) => item.category?.id);

  // Single-pass extraction for related brands
  const relatedBrandsMap = new Map();
  for (const item of allPromocodes) {
    if (item.brand?.translations?.[0]?.slug) {
      relatedBrandsMap.set(item.brand?.id, {
        id: item.brand?.id || "",
        name: item.brand?.translations?.[0]?.name || "",
        slug: item.brand?.translations?.[0]?.slug || "",
      });
    }
  }
  const relatedBrands = Array.from(relatedBrandsMap.values()).slice(0, 4);

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
        entityDescription={resolvedStoreDescription}
      />
      <LocalBusinessSchema
        name={storeTranslation?.name || storeTitle}
        url={`/store/${slug}`}
        description={resolvedStoreDescription}
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
        <StoreHero
          name={storeTranslation?.name || storeTitle}
          description={resolvedStoreDescription}
          logoUrl={store.logoUrl}
          websiteUrl={store.websiteUrl}
          totalPromocodesCount={totalPromocodesCount}
          uniqueBrandCount={uniqueBrandCount}
          uniqueCategoryCount={uniqueCategoryCount}
          featuredPromocodesCount={featuredPromocodesCount}
          totalViews={totalViews}
          totalCopies={totalCopies}
          translations={{
            heroKicker: t("heroKicker"),
            h1Title: t("h1Title", { name: storeTranslation?.name || storeTitle }),
            activeRouteLabel: t("activeRouteLabel"),
            activePromocodes: t("activePromocodes"),
            brandMixLabel: t("brandMixLabel"),
            connectedBrandsLabel: t("connectedBrandsLabel"),
            categorySpreadLabel: t("categorySpreadLabel"),
            activeCategoryPathsLabel: t("activeCategoryPathsLabel"),
            storeTrustTitle: t("storeTrustTitle"),
            storeTrustDescription: t("storeTrustDescription"),
            visitWebsite: t("visitWebsite"),
            views: t("views"),
            uses: t("uses"),
            altStoreLogo: tCommon("altStoreLogo"),
            altStoreLogoWithSlug: (slug: string) => tCommon("altStoreLogoWithSlug", { slug }),
            featured: tCommon("featured"),
          }}
          slug={slug}
        />

        <div className="page-shell py-12">
          <section className="mb-10 grid gap-4 lg:grid-cols-2">
            <StoreRelatedBrands
              relatedBrands={relatedBrands}
              translations={{
                relatedBrandsDescription: t("relatedBrandsDescription"),
                noLinkedBrands: t("noLinkedBrands"),
              }}
            />
            <StoreRelatedCategories
              relatedCategories={relatedCategories}
              translations={{
                relatedCategoriesDescription: t("relatedCategoriesDescription"),
                noLinkedCategories: t("noLinkedCategories"),
              }}
            />
          </section>

          {/* All Promocodes */}
          <section>
            <div className="mb-8">
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
                <MagnifyingGlass
                  className="text-muted-foreground mx-auto mb-4 h-12 w-12"
                  aria-hidden="true"
                />
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

          <EntityFAQSection
            entityName={storeTranslation?.name || storeTitle}
            entityType="store"
            locale={locale}
            title={t("faqTitle", { name: storeTranslation?.name || storeTitle })}
            description={t("faqDescription", { name: storeTranslation?.name || storeTitle })}
          />
        </div>
      </div>
    </>
  );
}
