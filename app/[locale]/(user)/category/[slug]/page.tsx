import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { EntityFAQSchema } from "@/components/public/EntityFAQSchema";
import { ItemListSchema } from "@/components/public/ItemListSchema";
import CategoryHero from "@/components/public/category/CategoryHero";
import CategoryRelatedStores from "@/components/public/category/CategoryRelatedStores";
import CategoryRelatedBrands from "@/components/public/category/CategoryRelatedBrands";
import CategoryPromocodes from "@/components/public/category/CategoryPromocodes";
import StructuredData from "@/components/public/StructuredData";
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
import { getCachedCategoryBySlug, getCategoryLanguageAlternates } from "@/lib/queries/entities";
import { countUnique } from "@/lib/array-utils";
import {
  mapPromocodeListRow,
  promocodeListSelectWithCategory,
  type PromocodeListRow,
} from "@/lib/queries/promocode-list";
import { and, asc, desc, eq, isNull, lte, ne, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound, unstable_rethrow } from "next/navigation";
import { isGone } from "@/lib/redirects";
import { NotFoundUI } from "@/components/public/NotFoundUI";

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
  let category;
  let categoryTranslation;

  const categoryData = await getCachedCategoryBySlug(locale, slug);

  if (!categoryData) {
    notFound();
  }

  try {
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

    allPromocodes = (allData as PromocodeListRow[]).map((row) =>
      mapPromocodeListRow(row, {
        includeStartsAt: false,
        includeConditions: true,
        includeMedia: true,
        includeCategory: true,
      })
    );
  } catch (error) {
    unstable_rethrow(error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error(`Error fetching category (slug: ${slug}, locale: ${locale}):`, errorObj);
    notFound();
  }

  const [t, tCommon, tEmpty, tCard, tPromocode, tStore] = await Promise.all([
    getTranslations({ locale, namespace: "category" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "empty" }),
    getTranslations({ locale, namespace: "card" }),
    getTranslations({ locale, namespace: "promocode" }),
    getTranslations({ locale, namespace: "store" }),
  ]);

  const categoryTitle = t("title");
  const promocodeTitle = tPromocode("title");
  const storeTitle = tStore("title");
  const schemaPromocodes = allPromocodes.slice(0, 20);
  const uniqueStoreCount = countUnique(allPromocodes, (item) => item.store?.id);
  const uniqueBrandCount = countUnique(allPromocodes, (item) => item.brand?.id);

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
        <CategoryHero
          categoryName={categoryTranslation?.name || categoryTitle}
          categoryDescription={categoryTranslation?.metaDescription}
          totalPromocodes={totalPromocodesCount}
          uniqueStoreCount={uniqueStoreCount}
          uniqueBrandCount={uniqueBrandCount}
          t={t}
        />

        <div className="page-shell py-12">
          <section className="mb-10 grid gap-4 lg:grid-cols-2">
            <CategoryRelatedStores relatedStores={relatedStores} t={t} />
            <CategoryRelatedBrands relatedBrands={relatedBrands} t={t} />
          </section>

          {/* All Promocodes */}
          <CategoryPromocodes
            allPromocodes={allPromocodes}
            totalPromocodesCount={totalPromocodesCount}
            categoryId={category.id}
            categoryName={categoryTranslation?.name || categoryTitle}
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
        </div>
      </div>
    </>
  );
}
