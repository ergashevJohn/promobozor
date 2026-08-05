import {
  brands,
  brandTranslations,
  categories,
  categoryTranslations,
  db,
  stores,
  storeTranslations,
} from "@/lib/db";
import { and, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

type TranslationRow = {
  language: string;
  name: string;
  slug: string;
};

type FilterItem = {
  id: string;
  translations: TranslationRow[];
};

export const getFiltersData = (locale: string) =>
  unstable_cache(
    async () => {
      let storesData: Array<{
        id: string;
        language: string | null;
        name: string | null;
        slug: string | null;
      }> = [];
      let categoriesData: Array<{
        id: string;
        language: string | null;
        name: string | null;
        slug: string | null;
      }> = [];
      let brandsData: Array<{
        id: string;
        language: string | null;
        name: string | null;
        slug: string | null;
      }> = [];

      try {
        [storesData, categoriesData, brandsData] = await Promise.all([
          db
            .select({
              id: stores.id,
              language: storeTranslations.language,
              name: storeTranslations.name,
              slug: storeTranslations.slug,
            })
            .from(stores)
            .leftJoin(
              storeTranslations,
              and(
                eq(storeTranslations.storeId, stores.id),
                eq(storeTranslations.language, locale as "uz" | "ru" | "en")
              )
            )
            .where(eq(stores.isActive, true))
            .orderBy(desc(stores.createdAt)),
          db
            .select({
              id: categories.id,
              language: categoryTranslations.language,
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
            .orderBy(desc(categories.createdAt)),
          db
            .select({
              id: brands.id,
              language: brandTranslations.language,
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
            .orderBy(desc(brands.createdAt)),
        ]);
      } catch (error) {
        console.error("Error fetching filter data:", error);
        storesData = [];
        categoriesData = [];
        brandsData = [];
      }

      const toFilterItem = (row: {
        id: string;
        language: string | null;
        name: string | null;
        slug: string | null;
      }): FilterItem => ({
        id: row.id,
        translations:
          row.language && row.name && row.slug
            ? [{ language: row.language, name: row.name, slug: row.slug }]
            : [],
      });

      return {
        storesList: storesData.map(toFilterItem),
        categoriesList: categoriesData.map(toFilterItem),
        brandsList: brandsData.map(toFilterItem),
      };
    },
    ["filters-data", locale],
    { revalidate: 600, tags: ["filters", `filters-${locale}`] }
  )();
