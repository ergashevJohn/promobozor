import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { CollectionPageSchema } from "@/components/public/CollectionPageSchema";
import { HubEditorialSection } from "@/components/public/HubEditorialSection";
import { PromocodeListOptimized } from "@/components/public/PromocodeListServer";
import PromocodesPageClient, {
  type PromocodesInitialSectionData,
  type PromocodesPageTranslations,
} from "@/components/public/PromocodesPageClient";
import ServerPagination from "@/components/public/ServerPagination";
import type { Promocode } from "@/components/public/types";
import {
  brands,
  brandTranslations,
  db,
  promocodes,
  promocodeTranslations,
  stores,
  storeTranslations,
} from "@/lib/db";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import { getListLanguageAlternates, getListPath, type Locale as RouteLocale } from "@/lib/routes";
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
  const lang = locale as RouteLocale;
  const url = getListPath(lang, "promocodes");

  return generateFullMetadata(
    title,
    description,
    url,
    undefined,
    "website",
    locale,
    "",
    getListLanguageAlternates("promocodes")
  );
}

export default async function PromocodesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const [t, tCommon, tEmpty, tCard, tPromocode, tStore, tFilter, initialSectionData] =
    await Promise.all([
      getTranslations({ locale, namespace: "promocodesPage" }),
      getTranslations({ locale, namespace: "common" }),
      getTranslations({ locale, namespace: "empty" }),
      getTranslations({ locale, namespace: "card" }),
      getTranslations({ locale, namespace: "promocode" }),
      getTranslations({ locale, namespace: "store" }),
      getTranslations({ locale, namespace: "filter" }),
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
      <PromocodesPageClient
        locale={locale}
        initialSectionData={{
          currentPage: initialSectionData.currentPage,
          totalPages: initialSectionData.totalPages,
          totalPromocodesCount: initialSectionData.totalPromocodesCount,
          // Default SSR list is in children — omit list from client payload
        }}
        translations={translations}
      >
        <section>
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-[color:var(--secondary)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]">
              {initialSectionData.totalPromocodesCount} {translations.offersFound}
            </div>
            {initialSectionData.totalPages > 1 && (
              <div className="bg-card rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted-foreground)]">
                {translations.page} {initialSectionData.currentPage}/{initialSectionData.totalPages}
              </div>
            )}
          </div>

          <PromocodeListOptimized
            promocodes={initialSectionData.promocodesList}
            translations={{
              noPromocodes: translations.noPromocodes,
              noPromocodesDescription: translations.noPromocodesDescription,
              emptyHint: translations.emptyHint,
              card: translations.card,
            }}
          />

          <ServerPagination
            currentPage={initialSectionData.currentPage}
            totalPages={initialSectionData.totalPages}
            baseUrl="/promocodes"
            searchParams={{}}
            translations={{
              ariaLabel: translations.pagination,
              previous: translations.previous,
              next: translations.next,
              page: translations.page,
            }}
          />
        </section>
      </PromocodesPageClient>
      <HubEditorialSection locale={locale} kind="promocodes" />
    </>
  );
}
