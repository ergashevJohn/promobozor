import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { CollectionPageSchema } from "@/components/public/CollectionPageSchema";
import FilterBar from "@/components/public/FilterBar";
import PromocodeList from "@/components/public/PromocodeList";
import SearchBar from "@/components/public/SearchBar";
import ServerPagination from "@/components/public/ServerPagination";
import type { Promocode } from "@/components/public/types";
import { SkeletonCardGrid } from "@/components/ui/skeleton-card";
import {
  brands,
  brandTranslations,
  categoryTranslations,
  db,
  promocodes,
  promocodeTranslations,
  stores,
  storeTranslations,
} from "@/lib/db";
import { getFiltersData } from "@/lib/filters";
import { fullTextSearchCondition, toTsQuery } from "@/lib/full-text-search";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import { sanitizeSearchQuery } from "@/lib/search";
import { and, asc, desc, eq, ilike, isNull, lte, ne, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const ITEMS_PER_PAGE = 24;

export const revalidate = 1800;
// Removed force-dynamic to allow ISR caching

type PromocodesSearchParams = {
  storeId?: string;
  categoryId?: string;
  brandId?: string;
  search?: string;
  sortBy?: string;
  featured?: string;
  page?: string;
};

type EntityType = "store" | "category" | "brand";

type PromocodeQueryRow = {
  promocode: typeof promocodes.$inferSelect;
  store: typeof stores.$inferSelect | null;
  storeTranslation: typeof storeTranslations.$inferSelect | null;
  brand: typeof brands.$inferSelect | null;
  brandTranslation: typeof brandTranslations.$inferSelect | null;
  promocodeTranslation: typeof promocodeTranslations.$inferSelect | null;
};

type PromocodesSectionData = {
  currentPage: number;
  totalPages: number;
  totalPromocodesCount: number;
  sanitizedSearchQuery: string | undefined;
  sortBy?: string;
  featuredParam?: string;
  storeIdFilter?: string;
  categoryIdFilter?: string;
  brandIdFilter?: string;
  promocodesList: Promocode[];
};

function getPromocodesSectionCacheKey(
  locale: string,
  searchParams: PromocodesSearchParams
): string[] {
  return [
    "promocodes-page",
    locale,
    searchParams.storeId || "all-stores",
    searchParams.categoryId || "all-categories",
    searchParams.brandId || "all-brands",
    searchParams.sortBy || "newest",
    searchParams.featured || "all",
    searchParams.page || "1",
  ];
}

function getCachedEntityName(locale: string, entityType: EntityType, entityId: string) {
  return unstable_cache(
    async () => resolveEntityNameUncached(locale, entityType, entityId),
    ["promocodes-entity-name", locale, entityType, entityId],
    {
      revalidate: 86400,
      tags: ["filters", `${entityType}-${locale}`],
    }
  )();
}

function getCachedPromocodesSectionData(locale: string, searchParams: PromocodesSearchParams) {
  return unstable_cache(
    async () => fetchPromocodesSectionData(locale, searchParams),
    getPromocodesSectionCacheKey(locale, searchParams),
    {
      revalidate: 1800,
      tags: ["promocodes", `promocodes-${locale}`],
    }
  )();
}

function getPromocodesFilterCopy(locale: string) {
  switch (locale) {
    case "ru":
      return {
        featuredTitle: "Избранные промокоды и скидки",
        featuredDescription:
          "Подборка избранных и проверенных промокодов PromoBozor для покупателей в Узбекистане.",
        searchTitle: (query: string) => `Результаты поиска промокодов: ${query}`,
        searchDescription: (query: string) =>
          `Найдены релевантные промокоды и скидки по запросу "${query}" для пользователей в Узбекистане.`,
        storeTitle: (name: string) => `Промокоды и скидки ${name}`,
        storeDescription: (name: string) =>
          `Актуальные промокоды, купоны и предложения для ${name}. Сравните доступные скидки и выберите лучший вариант.`,
        categoryTitle: (name: string) => `${name}: промокоды и скидки`,
        categoryDescription: (name: string) =>
          `Просмотрите активные промокоды и скидки в категории ${name} и найдите подходящее предложение быстрее.`,
        brandTitle: (name: string) => `${name}: промокоды и купоны`,
        brandDescription: (name: string) =>
          `Проверенные купоны, бонусы и скидки для бренда ${name} на PromoBozor.`,
        pageSuffix: (page: number) => `Страница ${page}`,
      };
    case "en":
      return {
        featuredTitle: "Featured Promocodes and Discounts",
        featuredDescription:
          "Browse hand-picked featured promocodes and verified discounts curated by PromoBozor for shoppers in Uzbekistan.",
        searchTitle: (query: string) => `Promocode search results for ${query}`,
        searchDescription: (query: string) =>
          `Explore matching promocodes and verified discounts for "${query}" from stores and brands available in Uzbekistan.`,
        storeTitle: (name: string) => `${name} Promocodes and Discounts`,
        storeDescription: (name: string) =>
          `Find current promocodes, coupons, and savings opportunities for ${name} on PromoBozor.`,
        categoryTitle: (name: string) => `${name} Promocodes and Deals`,
        categoryDescription: (name: string) =>
          `Compare active promocodes and discounts in the ${name} category and pick the best available deal.`,
        brandTitle: (name: string) => `${name} Promocodes and Coupons`,
        brandDescription: (name: string) =>
          `Verified coupons, bonuses, and discount offers for ${name} collected and reviewed by PromoBozor.`,
        pageSuffix: (page: number) => `Page ${page}`,
      };
    case "uz":
    default:
      return {
        featuredTitle: "Tanlangan promokodlar va chegirmalar",
        featuredDescription:
          "PromoBozor tomonidan saralangan, tekshirilgan va foydalanuvchilar uchun foydali bo'lgan tanlangan promokodlar to'plami.",
        searchTitle: (query: string) => `${query} bo'yicha promokod natijalari`,
        searchDescription: (query: string) =>
          `"${query}" so'rovi bo'yicha topilgan tekshirilgan promokodlar va chegirmalarni bir joyda ko'ring.`,
        storeTitle: (name: string) => `${name} uchun promokodlar va chegirmalar`,
        storeDescription: (name: string) =>
          `${name} uchun amaldagi promokodlar, kuponlar va chegirmalarni ko'ring hamda eng foydali taklifni tanlang.`,
        categoryTitle: (name: string) => `${name} kategoriyasi uchun promokodlar`,
        categoryDescription: (name: string) =>
          `${name} kategoriyasidagi faol promokodlar va chegirmalarni ko'rib chiqing va mos taklifni tezroq toping.`,
        brandTitle: (name: string) => `${name} uchun promokodlar va kuponlar`,
        brandDescription: (name: string) =>
          `${name} brendi uchun tekshirilgan kuponlar, bonuslar va chegirmalarni PromoBozor orqali toping.`,
        pageSuffix: (page: number) => `${page}-sahifa`,
      };
  }
}

async function resolveEntityNameUncached(
  locale: string,
  entityType: EntityType,
  entityId?: string
): Promise<string | null> {
  if (!entityId) {
    return null;
  }

  if (entityType === "store") {
    const [row] = await db
      .select({ name: storeTranslations.name })
      .from(storeTranslations)
      .where(
        and(
          eq(storeTranslations.storeId, entityId),
          eq(storeTranslations.language, locale as "uz" | "ru" | "en")
        )
      )
      .limit(1);

    return row?.name ?? null;
  }

  if (entityType === "category") {
    const [row] = await db
      .select({ name: categoryTranslations.name })
      .from(categoryTranslations)
      .where(
        and(
          eq(categoryTranslations.categoryId, entityId),
          eq(categoryTranslations.language, locale as "uz" | "ru" | "en")
        )
      )
      .limit(1);

    return row?.name ?? null;
  }

  const [row] = await db
    .select({ name: brandTranslations.name })
    .from(brandTranslations)
    .where(
      and(
        eq(brandTranslations.brandId, entityId),
        eq(brandTranslations.language, locale as "uz" | "ru" | "en")
      )
    )
    .limit(1);

  return row?.name ?? null;
}

async function resolveEntityName(
  locale: string,
  entityType: EntityType,
  entityId?: string
): Promise<string | null> {
  if (!entityId) {
    return null;
  }

  return getCachedEntityName(locale, entityType, entityId);
}

async function fetchPromocodesSectionData(
  locale: string,
  searchParams: PromocodesSearchParams
): Promise<PromocodesSectionData> {
  const {
    storeId: storeIdFilter,
    categoryId: categoryIdFilter,
    brandId: brandIdFilter,
    search: searchQuery,
    sortBy,
    featured: featuredParam,
    page: pageParam,
  } = searchParams;

  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const now = new Date();
  const sanitizedSearchQuery = sanitizeSearchQuery(searchQuery);
  const featuredOnly = featuredParam === "true";

  const whereConditions = [
    ne(promocodes.status, "draft"),
    or(isNull(promocodes.storeId), eq(stores.isActive, true)),
    or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
  ];

  if (storeIdFilter) whereConditions.push(eq(promocodes.storeId, storeIdFilter));
  if (categoryIdFilter) whereConditions.push(eq(promocodes.categoryId, categoryIdFilter));
  if (brandIdFilter) whereConditions.push(eq(promocodes.brandId, brandIdFilter));
  if (featuredOnly) whereConditions.push(eq(promocodes.isFeatured, true));

  if (sanitizedSearchQuery) {
    const tsQuery = toTsQuery(sanitizedSearchQuery);

    if (tsQuery && sanitizedSearchQuery.length >= 2) {
      const ftsCondition = fullTextSearchCondition(sanitizedSearchQuery, "promocode_translations");

      if (ftsCondition) {
        whereConditions.push(or(ftsCondition, ilike(promocodes.code, `%${sanitizedSearchQuery}%`)));
      } else {
        whereConditions.push(
          or(
            ilike(promocodeTranslations.title, `%${sanitizedSearchQuery}%`),
            ilike(promocodes.code, `%${sanitizedSearchQuery}%`)
          )
        );
      }
    } else {
      whereConditions.push(
        or(
          ilike(promocodeTranslations.title, `${sanitizedSearchQuery}%`),
          ilike(promocodes.code, `${sanitizedSearchQuery}%`)
        )
      );
    }
  }

  const orderByClause = (() => {
    switch (sortBy) {
      case "popular":
        return [desc(promocodes.isFeatured), desc(promocodes.copyCount), asc(promocodes.order)];
      case "ending":
        return [desc(promocodes.isFeatured), asc(promocodes.expiresAt), asc(promocodes.order)];
      case "discount":
        return [desc(promocodes.isFeatured), desc(promocodes.discountValue), asc(promocodes.order)];
      case "newest":
      default:
        return [desc(promocodes.isFeatured), asc(promocodes.order)];
    }
  })();

  let promocodesData: PromocodeQueryRow[] = [];
  let totalPromocodesCount = 0;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

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
        .select({
          promocode: promocodes,
          store: stores,
          storeTranslation: storeTranslations,
          brand: brands,
          brandTranslation: brandTranslations,
          promocodeTranslation: promocodeTranslations,
        })
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
        .offset(offset),
    ]);

    totalPromocodesCount = countResult[0]?.count || 0;
    promocodesData = result;
  } catch (error) {
    console.error("Error fetching promocodes:", error);
  }

  const totalPages = Math.ceil(totalPromocodesCount / ITEMS_PER_PAGE);
  const promocodesList = promocodesData.map((row) => ({
    id: row.promocode.id,
    type: row.promocode.type as "code" | "link",
    code: row.promocode.code,
    link: row.promocode.link,
    discountType: row.promocode.discountType,
    discountValue: row.promocode.discountValue,
    currency: row.promocode.currency,
    isFeatured: row.promocode.isFeatured,
    status: row.promocode.status,
    viewsCount: row.promocode.viewsCount,
    copyCount: row.promocode.copyCount,
    likesCount: row.promocode.likesCount,
    dislikesCount: row.promocode.dislikesCount,
    expiresAt: row.promocode.expiresAt?.toISOString() || null,
    translations: row.promocodeTranslation
      ? [
          {
            language: row.promocodeTranslation.language,
            title: row.promocodeTranslation.title,
            slug: row.promocodeTranslation.slug,
          },
        ]
      : [],
    store: row.store
      ? {
          id: row.store.id,
          logoUrl: row.store.logoUrl,
          translations: row.storeTranslation
            ? [
                {
                  language: row.storeTranslation.language,
                  name: row.storeTranslation.name,
                  slug: row.storeTranslation.slug,
                },
              ]
            : [],
        }
      : null,
    brand:
      row.brand && row.brandTranslation
        ? {
            id: row.brand.id,
            imageUrl: row.brand.imageUrl,
            translations: [
              {
                language: row.brandTranslation.language,
                name: row.brandTranslation.name,
                slug: row.brandTranslation.slug,
              },
            ],
          }
        : null,
  }));

  return {
    currentPage,
    totalPages,
    totalPromocodesCount,
    sanitizedSearchQuery: sanitizedSearchQuery ?? undefined,
    sortBy,
    featuredParam,
    storeIdFilter,
    categoryIdFilter,
    brandIdFilter,
    promocodesList,
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isValidLanguage(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "promocodesPage" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const url = `/${locale}/promocodes`;

  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10) || 1);
  const hasFilters = Object.keys(resolvedSearchParams).some((k) => k !== "page");
  const featuredOnly = resolvedSearchParams.featured === "true";
  const searchQuery = sanitizeSearchQuery(resolvedSearchParams.search);

  const [storeName, categoryName, brandName] = await Promise.all([
    resolveEntityName(locale, "store", resolvedSearchParams.storeId),
    resolveEntityName(locale, "category", resolvedSearchParams.categoryId),
    resolveEntityName(locale, "brand", resolvedSearchParams.brandId),
  ]);

  const filterCopy = getPromocodesFilterCopy(locale);
  let effectiveTitle = title;
  let effectiveDescription = description;

  if (searchQuery) {
    effectiveTitle = filterCopy.searchTitle(searchQuery);
    effectiveDescription = filterCopy.searchDescription(searchQuery);
  } else if (storeName) {
    effectiveTitle = filterCopy.storeTitle(storeName);
    effectiveDescription = filterCopy.storeDescription(storeName);
  } else if (categoryName) {
    effectiveTitle = filterCopy.categoryTitle(categoryName);
    effectiveDescription = filterCopy.categoryDescription(categoryName);
  } else if (brandName) {
    effectiveTitle = filterCopy.brandTitle(brandName);
    effectiveDescription = filterCopy.brandDescription(brandName);
  } else if (featuredOnly) {
    effectiveTitle = filterCopy.featuredTitle;
    effectiveDescription = filterCopy.featuredDescription;
  }

  if (!hasFilters && page > 1) {
    effectiveTitle = `${title} - ${filterCopy.pageSuffix(page)}`;
  }

  const baseUrl = getBaseUrl();
  // When filters are applied, canonical should point to clean URL (avoid duplicate content)
  const canonicalUrl = hasFilters
    ? `${baseUrl}/${locale}/promocodes`
    : `${baseUrl}/${locale}/promocodes${page > 1 ? `?page=${page}` : ""}`;

  return {
    ...generateFullMetadata(
      effectiveTitle,
      effectiveDescription,
      url,
      undefined,
      "website",
      locale,
      "/promocodes"
    ),
    alternates: {
      ...generateFullMetadata(
        effectiveTitle,
        effectiveDescription,
        url,
        undefined,
        "website",
        locale,
        "/promocodes"
      ).alternates,
      canonical: canonicalUrl,
    },
    ...(hasFilters && {
      robots: { index: false, follow: true },
    }),
  };
}

async function FiltersSection({
  locale,
  searchParams,
  pathname,
}: {
  locale: string;
  searchParams?: Record<string, string>;
  pathname: string;
}) {
  const t = await getTranslations({ locale, namespace: "filter" });

  const { storesList, categoriesList, brandsList } = await getFiltersData(locale);

  return (
    <FilterBar
      pathname={pathname}
      stores={storesList}
      categories={categoriesList}
      brands={brandsList}
      currentParams={searchParams}
      translations={{
        store: t("store"),
        category: t("category"),
        brand: t("brand"),
        sortBy: t("sortBy"),
        kicker: t("kicker"),
        title: t("title"),
        description: t("description"),
        activeFilters: t("activeFilters"),
        allStores: t("allStores"),
        allCategories: t("allCategories"),
        allBrands: t("allBrands"),
        newest: t("newest"),
        popular: t("popular"),
        ending: t("ending"),
        discount: t("discount"),
        clear: t("clearFilters"),
        apply: t("applyFilters"),
      }}
    />
  );
}

async function PromocodesSection({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: PromocodesSearchParams;
}) {
  const [tCommon, tEmpty, tCard, tPromocode, tStore] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "empty" }),
    getTranslations({ locale, namespace: "card" }),
    getTranslations({ locale, namespace: "promocode" }),
    getTranslations({ locale, namespace: "store" }),
  ]);
  const shouldCache = !searchParams.search;
  const {
    currentPage,
    totalPages,
    totalPromocodesCount,
    sanitizedSearchQuery,
    sortBy,
    featuredParam,
    storeIdFilter,
    categoryIdFilter,
    brandIdFilter,
    promocodesList,
  } = shouldCache
    ? await getCachedPromocodesSectionData(locale, searchParams)
    : await fetchPromocodesSectionData(locale, searchParams);

  const paginationSearchParams: Record<string, string | undefined> = {
    storeId: storeIdFilter,
    categoryId: categoryIdFilter,
    brandId: brandIdFilter,
    search: sanitizedSearchQuery ?? undefined,
    sortBy,
    featured: featuredParam,
  };

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="rounded-full bg-[color:var(--secondary)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]">
          {totalPromocodesCount} {tCommon("offersFound")}
        </div>
        {totalPages > 1 && (
          <div className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm text-[color:var(--muted-foreground)]">
            {tCommon("page")} {currentPage}/{totalPages}
          </div>
        )}
        {sanitizedSearchQuery && (
          <div className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm text-[color:var(--muted-foreground)]">
            Search:{" "}
            <span className="font-semibold text-[color:var(--foreground)]">
              {sanitizedSearchQuery}
            </span>
          </div>
        )}
      </div>
      <PromocodeList
        promocodes={promocodesList}
        translations={{
          noPromocodes: tEmpty("noPromocodes"),
          noPromocodesDescription: tEmpty("noPromocodesDescription"),
          emptyHint: tEmpty("noPromocodesHint"),
          emptyActionLabel:
            sanitizedSearchQuery || storeIdFilter || categoryIdFilter || brandIdFilter
              ? tEmpty("resetFiltersCta")
              : undefined,
          emptyActionHref:
            sanitizedSearchQuery || storeIdFilter || categoryIdFilter || brandIdFilter
              ? "/promocodes"
              : undefined,
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
        }}
      />
      {totalPromocodesCount > 0 &&
        totalPromocodesCount <= 3 &&
        (sanitizedSearchQuery || storeIdFilter || categoryIdFilter || brandIdFilter) && (
          <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--secondary)]/80 p-4 text-sm shadow-[0_18px_40px_-32px_rgba(17,24,39,0.25)]">
            <div className="font-semibold text-[color:var(--foreground)]">
              {tEmpty("lowResultTitle")}
            </div>
            <p className="mt-2 text-[color:var(--muted-foreground)]">
              {tEmpty("lowResultDescription")}
            </p>
          </div>
        )}
      <ServerPagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/promocodes"
        searchParams={paginationSearchParams}
        translations={{
          ariaLabel: tCommon("pagination"),
          previous: tCommon("previous"),
          next: tCommon("next"),
          page: tCommon("page"),
        }}
      />
    </section>
  );
}

export default async function PromocodesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<PromocodesSearchParams>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "promocodesPage" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  // Check if filters are applied (excluding page parameter)
  const hasFilters = Object.keys(resolvedSearchParams).some((k) => k !== "page");

  return (
    <>
      {/* Only render schema on indexable pages (no filters applied) */}
      {!hasFilters && (
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
        </>
      )}
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,90,79,0.07),rgba(255,255,255,0.98)_36%,rgba(17,24,39,0.02)_100%)] p-6 shadow-[0_28px_72px_-52px_rgba(17,24,39,0.4)] md:p-8">
          <div className="brand-kicker mb-4">Offer discovery</div>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-foreground mb-3 text-3xl font-semibold tracking-tight md:text-5xl">
                {t("title")}
              </h1>
              <p className="text-muted-foreground max-w-3xl text-base leading-7 md:text-lg">
                {t("description")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-[22px] border border-white/80 bg-white/92 px-4 py-3 text-sm shadow-[0_18px_48px_-40px_rgba(17,24,39,0.28)]">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                  Live offers
                </div>
                <div className="mt-1 font-semibold text-[color:var(--foreground)]">
                  Verified routes
                </div>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white/92 px-4 py-3 text-sm shadow-[0_18px_48px_-40px_rgba(17,24,39,0.28)]">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                  Sorting
                </div>
                <div className="mt-1 font-semibold text-[color:var(--foreground)]">
                  Newest, popular, ending
                </div>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white/92 px-4 py-3 text-sm shadow-[0_18px_48px_-40px_rgba(17,24,39,0.28)]">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                  Save time
                </div>
                <div className="mt-1 font-semibold text-[color:var(--foreground)]">
                  Filter before browsing
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex justify-center">
          <SearchBar currentParams={resolvedSearchParams as Record<string, string>} />
        </div>

        {/* Filters Section */}
        <Suspense
          fallback={
            <div className="bg-card border-border mb-8 min-h-[10rem] animate-pulse rounded-lg border" />
          }
        >
          <FiltersSection
            locale={locale}
            searchParams={resolvedSearchParams as Record<string, string>}
            pathname={`/${locale}/promocodes`}
          />
        </Suspense>

        {/* Promocodes Section */}
        <Suspense fallback={<SkeletonCardGrid count={ITEMS_PER_PAGE} />}>
          <PromocodesSection locale={locale} searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </>
  );
}
