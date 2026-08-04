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
        store: typeof stores.$inferSelect;
        translation: typeof storeTranslations.$inferSelect | null;
      }> = [];
      let categoriesData: Array<{
        category: typeof categories.$inferSelect;
        translation: typeof categoryTranslations.$inferSelect | null;
      }> = [];
      let brandsData: Array<{
        brand: typeof brands.$inferSelect;
        translation: typeof brandTranslations.$inferSelect | null;
      }> = [];

      try {
        [storesData, categoriesData, brandsData] = await Promise.all([
          db
            .select({
              store: stores,
              translation: storeTranslations,
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
              category: categories,
              translation: categoryTranslations,
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
              brand: brands,
              translation: brandTranslations,
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

      const storesList: FilterItem[] = storesData.map((row) => ({
        id: row.store.id,
        translations: row.translation ? [row.translation] : [],
      }));

      const categoriesList: FilterItem[] = categoriesData.map((row) => ({
        id: row.category.id,
        translations: row.translation ? [row.translation] : [],
      }));

      const brandsList: FilterItem[] = brandsData.map((row) => ({
        id: row.brand.id,
        translations: row.translation ? [row.translation] : [],
      }));

      return { storesList, categoriesList, brandsList };
    },
    ["filters-data", locale],
    { revalidate: 600, tags: ["filters", `filters-${locale}`] }
  )();
