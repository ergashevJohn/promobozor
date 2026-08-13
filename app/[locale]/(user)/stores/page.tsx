import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { CollectionPageSchema } from "@/components/public/CollectionPageSchema";
import { ItemListSchema } from "@/components/public/ItemListSchema";
import StoresPageClient from "@/components/public/StoresPageClient";
import { db, promocodes, stores, storeTranslations } from "@/lib/db";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import { getListLanguageAlternates, getListPath, type Locale as RouteLocale } from "@/lib/routes";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";

// Cached function to fetch all stores with promocode counts
const getAllStores = (locale: string) =>
  unstable_cache(
    async () => {
      const now = new Date().toISOString();

      const storesData = await db
        .select({
          store: stores,
          translation: storeTranslations,
          promocodesCount: sql<number>`CAST(COUNT(DISTINCT CASE
          WHEN ${promocodes.status} = 'active'
          AND (${promocodes.expiresAt} IS NULL OR ${promocodes.expiresAt} > ${now}::timestamp)
          AND (${promocodes.startsAt} IS NULL OR ${promocodes.startsAt} <= ${now}::timestamp)
          THEN ${promocodes.id}
          END) AS INTEGER)`.as("promocodes_count"),
        })
        .from(stores)
        .leftJoin(
          storeTranslations,
          and(
            eq(storeTranslations.storeId, stores.id),
            eq(storeTranslations.language, locale as "uz" | "ru" | "en")
          )
        )
        .leftJoin(promocodes, eq(promocodes.storeId, stores.id))
        .where(eq(stores.isActive, true))
        .groupBy(stores.id, storeTranslations.id, storeTranslations.language)
        .orderBy(desc(stores.priority), desc(stores.createdAt));

      return storesData;
    },
    ["all-stores", locale],
    { revalidate: 86400, tags: ["stores", "all-stores", `all-stores-${locale}`] }
  )();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "store" });

  const title = t("allStores");
  const description = t("allStoresDescription");
  const lang = locale as RouteLocale;
  const url = getListPath(lang, "stores");

  return {
    ...generateFullMetadata(
      title,
      description,
      url,
      undefined,
      "website",
      locale,
      "",
      getListLanguageAlternates("stores")
    ),
  };
}

export const revalidate = 86400;

export default async function StoresPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  // Fetch all active stores with translations and promocode counts
  type StoresData = Array<{
    store: typeof stores.$inferSelect;
    translation: typeof storeTranslations.$inferSelect | null;
    promocodesCount: number;
  }>;
  let storesData: StoresData = [];
  let t: Awaited<ReturnType<typeof getTranslations>>;
  let tCommon: Awaited<ReturnType<typeof getTranslations>>;

  try {
    storesData = await getAllStores(locale);

    // Get translations
    t = await getTranslations({ locale, namespace: "store" });
    tCommon = await getTranslations({ locale, namespace: "common" });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    // Check if it's a database table missing error (build time)
    if (
      errorObj.message?.includes("does not exist") ||
      errorObj.message?.includes("relation") ||
      errorObj.message?.includes("stores")
    ) {
      storesData = [];
      t = await getTranslations({ locale, namespace: "store" });
      tCommon = await getTranslations({ locale, namespace: "common" });
    } else {
      console.error("Error fetching stores:", errorObj);
      console.error("Error details:", errorObj.message);
      console.error("Language:", locale);
      // Don't call notFound() during build - return empty state instead
      storesData = [];
      t = await getTranslations({ locale, namespace: "store" });
      tCommon = await getTranslations({ locale, namespace: "common" });
    }
  }

  // Prepare items for ItemList schema (top 20 stores)
  const schemaItems = storesData
    .filter((row) => row.translation?.slug)
    .slice(0, 20)
    .map((row) => ({
      name: row.translation?.name || t("title"),
      url: `/store/${row.translation?.slug}`,
      image: row.store.logoUrl || undefined,
      description: row.translation?.description || undefined,
    }));

  return (
    <>
      <BreadcrumbsSchema
        items={[
          { name: tCommon("home"), url: "/" },
          { name: t("allStores"), url: "/stores" },
        ]}
        locale={locale}
      />
      <CollectionPageSchema
        name={t("allStores")}
        description={t("allStoresDescription")}
        url="/stores"
        itemCount={storesData.length}
        items={schemaItems}
        lang={locale}
        baseUrl={getBaseUrl()}
      />
      {schemaItems.length > 0 && (
        <ItemListSchema
          items={schemaItems}
          listName={t("allStores")}
          listDescription={t("allStoresDescription")}
        />
      )}
      <StoresPageClient
        storesData={storesData.filter((row) => row.translation?.slug)}
        translations={{
          allStores: t("allStores"),
          allStoresDescription: t("allStoresDescription"),
          findStore: t("findStore"),
          promocodes: t("promocodes"),
          view: tCommon("view"),
          viewOffers: t("viewOffers"),
          noStoresFound: t("noStoresFound"),
          noStoresDescription: t("noStoresDescription"),
          searchHint: t("searchHint"),
          storeTitle: t("title"),
          directoryKicker: t("directoryKicker"),
          directoryBadge: t("directoryBadge"),
          curatedRoutesCount: t("curatedRoutesCount", {
            count: storesData.filter((row) => row.translation?.slug).length,
          }),
          viewStorePromocodesAria: t.raw("viewStorePromocodesAria") as string,
        }}
      />
    </>
  );
}
