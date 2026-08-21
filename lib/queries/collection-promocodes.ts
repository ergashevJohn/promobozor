import type { Promocode } from "@/components/public/types";
import type { CollectionKey } from "@/lib/collections";
import {
  promocodeTags,
  promocodeTranslations,
  promocodes,
  stores,
  brands,
  storeTranslations,
  brandTranslations,
  db,
} from "@/lib/db";
import { activeCollectionConditions } from "@/lib/collections";
import {
  mapPromocodeListRow,
  promocodeListSelect,
  type PromocodeListRow,
} from "@/lib/queries/promocode-list";
import { and, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

async function fetchCollectionPromocodes(
  locale: "uz" | "ru" | "en",
  key: CollectionKey
): Promise<Promocode[]> {
  const rows = await db
    .select(promocodeListSelect)
    .from(promocodeTags)
    .innerJoin(promocodes, eq(promocodeTags.promocodeId, promocodes.id))
    .leftJoin(stores, eq(promocodes.storeId, stores.id))
    .leftJoin(brands, eq(promocodes.brandId, brands.id))
    .innerJoin(promocodeTranslations, eq(promocodeTranslations.promocodeId, promocodes.id))
    .leftJoin(
      storeTranslations,
      and(eq(storeTranslations.storeId, stores.id), eq(storeTranslations.language, locale))
    )
    .leftJoin(
      brandTranslations,
      and(eq(brandTranslations.brandId, brands.id), eq(brandTranslations.language, locale))
    )
    .where(activeCollectionConditions(locale, key))
    .orderBy(desc(promocodes.isFeatured), desc(promocodes.publishedAt));
  return (rows as PromocodeListRow[]).map((row) =>
    mapPromocodeListRow(row, { includeStartsAt: false, includeConditions: false })
  );
}

export function getCollectionPromocodes(locale: "uz" | "ru" | "en", key: CollectionKey) {
  return unstable_cache(
    () => fetchCollectionPromocodes(locale, key),
    ["collection-promocodes", locale, key],
    { revalidate: 1800, tags: ["promocodes", `promocodes-${locale}`] }
  )();
}
