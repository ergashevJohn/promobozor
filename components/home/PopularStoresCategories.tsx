import FeaturedStoreSection from "./FeaturedStoreSection";
import PopularCategories from "./PopularCategories";
import PopularBrands from "./PopularBrands";
import {
  brands,
  brandTranslations,
  categories,
  categoryTranslations,
  db,
  promocodes,
  stores,
  storeTranslations,
} from "@/lib/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";

interface Props {
  locale: string;
}

const getHomepageData = (locale: string) =>
  unstable_cache(
    async () => {
      const now = new Date().toISOString();

      const [storesData, categoriesData, brandsData] = await Promise.all([
        db
          .select({
            id: stores.id,
            logoUrl: stores.logoUrl,
            name: storeTranslations.name,
            slug: storeTranslations.slug,
            count: sql<number>`CAST(COUNT(${promocodes.id}) AS INTEGER)`.as("promo_count"),
          })
          .from(stores)
          .leftJoin(
            storeTranslations,
            and(
              eq(storeTranslations.storeId, stores.id),
              eq(storeTranslations.language, locale as "uz" | "ru" | "en")
            )
          )
          .leftJoin(
            promocodes,
            and(
              eq(promocodes.storeId, stores.id),
              eq(promocodes.status, "active"),
              sql`(${promocodes.expiresAt} IS NULL OR ${promocodes.expiresAt} > ${now}::timestamp)`
            )
          )
          .where(eq(stores.isActive, true))
          .groupBy(
            stores.id,
            stores.logoUrl,
            stores.priority,
            storeTranslations.name,
            storeTranslations.slug
          )
          .orderBy(desc(stores.priority))
          .limit(8),

        db
          .select({
            id: categories.id,
            imageUrl: categories.imageUrl,
            name: categoryTranslations.name,
            slug: categoryTranslations.slug,
          })
          .from(categories)
          .leftJoin(
            categoryTranslations,
            and(
              eq(categoryTranslations.categoryId, categories.id),
              eq(categoryTranslations.language, locale as "uz" | "ru" | "en")
            )
          )
          .where(eq(categories.isActive, true))
          .orderBy(categories.sortOrder)
          .limit(8),

        db
          .select({
            id: brands.id,
            imageUrl: brands.imageUrl,
            name: brandTranslations.name,
            slug: brandTranslations.slug,
          })
          .from(brands)
          .leftJoin(
            brandTranslations,
            and(
              eq(brandTranslations.brandId, brands.id),
              eq(brandTranslations.language, locale as "uz" | "ru" | "en")
            )
          )
          .where(eq(brands.isActive, true))
          .orderBy(desc(brands.createdAt))
          .limit(8),
      ]);

      return { storesData, categoriesData, brandsData };
    },
    ["homepage-data", locale],
    {
      revalidate: 600,
      tags: ["homepage-data", `homepage-data-${locale}`, "stores", "categories", "brands"],
    }
  )();

export default async function PopularStoresCategories({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const browse = await t.raw("overhaul.browse");

  let storesData: {
    id: string;
    logoUrl: string | null;
    name: string | null;
    slug: string | null;
    count: number;
  }[] = [];
  let categoriesData: {
    id: string;
    imageUrl: string | null;
    name: string | null;
    slug: string | null;
  }[] = [];
  let brandsData: {
    id: string;
    imageUrl: string | null;
    name: string | null;
    slug: string | null;
  }[] = [];

  try {
    const data = await getHomepageData(locale);
    storesData = data.storesData.filter((s) => s.slug);
    categoriesData = data.categoriesData.filter((c) => c.slug);
    brandsData = data.brandsData.filter((b) => b.slug);
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return null;
  }

  if (storesData.length === 0 && categoriesData.length === 0) return null;

  const [featuredStore, ...secondaryStores] = storesData;

  return (
    <div className="mb-16 space-y-16">
      {featuredStore && (
        <FeaturedStoreSection
          featuredStore={featuredStore}
          secondaryStores={secondaryStores}
          browse={browse}
          tCommon={tCommon}
        />
      )}

      <PopularCategories categories={categoriesData} browse={browse} tCommon={tCommon} />

      <PopularBrands brands={brandsData} browse={browse} tCommon={tCommon} />
    </div>
  );
}
