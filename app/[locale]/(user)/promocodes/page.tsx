import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { CollectionPageSchema } from "@/components/public/CollectionPageSchema";
import PromocodesPageClient, {
  type PromocodesInitialSectionData,
  type PromocodesPageTranslations,
} from "@/components/public/PromocodesPageClient";
import type { Promocode } from "@/components/public/types";
import { SkeletonCardGrid } from "@/components/ui/skeleton-card";
import {
  brands,
  brandTranslations,
  db,
  promocodes,
  promocodeTranslations,
  stores,
  storeTranslations,
} from "@/lib/db";
import { getFiltersData } from "@/lib/filters";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import {
  mapPromocodeListRow,
  promocodeListSelect,
  type PromocodeListRow,
} from "@/lib/queries/promocode-list";
import { and, asc, desc, eq, isNull, lte, ne, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const ITEMS_PER_PAGE = 24;

export const revalidate = 1800;

type PromocodeQueryRow = PromocodeListRow;

function getCachedPromocodesSectionData(locale: string) {
  return unstable_cache(
    async () => fetchDefaultPromocodesSectionData(locale),
    ["promocodes-page", locale, "all-stores", "all-categories", "all-brands", "newest", "all", "1"],
    {
      revalidate: 1800,
      tags: ["promocodes", `promocodes-${locale}`],
    }
  )();
}

async function fetchDefaultPromocodesSectionData(
  locale: string
): Promise<PromocodesInitialSectionData> {
  const now = new Date();
  const whereConditions = [
    ne(promocodes.status, "draft"),
    or(isNull(promocodes.storeId), eq(stores.isActive, true)),
    or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
  ];

  const orderByClause = [desc(promocodes.isFeatured), asc(promocodes.order)];

  let promocodesData: PromocodeQueryRow[] = [];
  let totalPromocodesCount = 0;

  try {
    const countQuery = db
      .select({ count: sql<number>`COUNT(*)::int`.as("count") })
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .leftJoin(brands, eq(promocodes.brandId, brands.id))
      .leftJoin(
        promocodeTranslations,
        and(
          eq(promocodeTranslations.promocodeId, promocodes.id),
          eq(promocodeTranslations.language, locale as "uz" | "ru" | "en")
        )
      )
      .where(and(...whereConditions));

    const [countResult, result] = await Promise.all([
      countQuery,
      db
        .select(promocodeListSelect)
        .from(promocodes)
        .leftJoin(stores, eq(promocodes.storeId, stores.id))
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
          brandTranslations,
          and(
            eq(brandTranslations.brandId, brands.id),
            eq(brandTranslations.language, locale as "uz" | "ru" | "en")
          )
        )
        .where(and(...whereConditions))
        .orderBy(...orderByClause)
        .limit(ITEMS_PER_PAGE)
        .offset(0),
    ]);

    totalPromocodesCount = countResult[0]?.count || 0;
    promocodesData = result as PromocodeQueryRow[];
  } catch (error) {
    console.error("Error fetching promocodes:", error);
  }

  const totalPages = Math.ceil(totalPromocodesCount / ITEMS_PER_PAGE);
  const promocodesList: Promocode[] = promocodesData.map((row) =>
    mapPromocodeListRow(row, { includeStartsAt: false, includeConditions: false })
  );

  return {
    currentPage: 1,
    totalPages,
    totalPromocodesCount,
    promocodesList,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "promocodesPage" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  const url = `/${locale}/promocodes`;

  return generateFullMetadata(title, description, url, undefined, "website", locale, "/promocodes");
}

export default async function PromocodesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const [t, tCommon, tEmpty, tCard, tPromocode, tStore, tFilter, filtersData, initialSectionData] =
    await Promise.all([
      getTranslations({ locale, namespace: "promocodesPage" }),
      getTranslations({ locale, namespace: "common" }),
      getTranslations({ locale, namespace: "empty" }),
      getTranslations({ locale, namespace: "card" }),
      getTranslations({ locale, namespace: "promocode" }),
      getTranslations({ locale, namespace: "store" }),
      getTranslations({ locale, namespace: "filter" }),
      getFiltersData(locale),
      getCachedPromocodesSectionData(locale),
    ]);

  const translations: PromocodesPageTranslations = {
    pageTitle: t("title"),
    pageDescription: t("description"),
    offersFound: tCommon("offersFound"),
    page: tCommon("page"),
    searchLabel: tCommon("searchLabel"),
    pagination: tCommon("pagination"),
    previous: tCommon("previous"),
    next: tCommon("next"),
    noPromocodes: tEmpty("noPromocodes"),
    noPromocodesDescription: tEmpty("noPromocodesDescription"),
    emptyHint: tEmpty("noPromocodesHint"),
    resetFiltersCta: tEmpty("resetFiltersCta"),
    lowResultTitle: tEmpty("lowResultTitle"),
    lowResultDescription: tEmpty("lowResultDescription"),
    filter: {
      store: tFilter("store"),
      category: tFilter("category"),
      brand: tFilter("brand"),
      sortBy: tFilter("sortBy"),
      filters: tFilter("filters"),
      kicker: tFilter("kicker"),
      title: tFilter("title"),
      description: tFilter("description"),
      activeFilters: tFilter("activeFilters"),
      allStores: tFilter("allStores"),
      allCategories: tFilter("allCategories"),
      allBrands: tFilter("allBrands"),
      newest: tFilter("newest"),
      popular: tFilter("popular"),
      ending: tFilter("ending"),
      discount: tFilter("discount"),
      clear: tFilter("clearFilters"),
      apply: tFilter("applyFilters"),
    },
    card: {
      featured: tCard("featured"),
      verified: tCard("verified"),
      fresh: tCard("fresh"),
      popular: tCard("popular"),
      endingSoon: tPromocode("expiresSoon"),
      unlimited: tCard("unlimited"),
      unknownStore: tCard("unknownStore"),
      storeTitle: tStore("title"),
      promocodeTitle: tPromocode("title"),
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
  };

  return (
    <>
      <BreadcrumbsSchema
        items={[
          { name: tCommon("home"), url: "/" },
          { name: t("title"), url: "/promocodes" },
        ]}
        locale={locale}
      />
      <CollectionPageSchema
        name={t("title")}
        description={t("description")}
        url="/promocodes"
        lang={locale}
        baseUrl={getBaseUrl()}
      />
      <Suspense fallback={<SkeletonCardGrid count={ITEMS_PER_PAGE} />}>
        <PromocodesPageClient
          locale={locale}
          initialSectionData={initialSectionData}
          stores={filtersData.storesList}
          categories={filtersData.categoriesList}
          brands={filtersData.brandsList}
          translations={translations}
        />
      </Suspense>
    </>
  );
}
