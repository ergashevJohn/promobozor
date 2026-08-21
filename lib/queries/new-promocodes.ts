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
import { activePromocodeConditions } from "@/lib/promocode-active";
import {
  mapPromocodeListRow,
  promocodeListSelect,
  type PromocodeListRow,
} from "@/lib/queries/promocode-list";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const NEW_PROMOCODES_WINDOW_DAYS = 14;
export const NEW_PROMOCODES_PAGE_SIZE = 24;

async function fetchNewPromocodes(
  locale: "uz" | "ru" | "en",
  page: number
): Promise<{ items: Promocode[]; total: number }> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - NEW_PROMOCODES_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const where = and(
    activePromocodeConditions(now),
    eq(promocodeTranslations.language, locale),
    gte(promocodes.publishedAt, cutoff)
  );
  const [countRows, rows] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .leftJoin(brands, eq(promocodes.brandId, brands.id))
      .innerJoin(promocodeTranslations, eq(promocodeTranslations.promocodeId, promocodes.id))
      .where(where),
    db
      .select(promocodeListSelect)
      .from(promocodes)
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
      .where(where)
      .orderBy(desc(promocodes.publishedAt))
      .limit(NEW_PROMOCODES_PAGE_SIZE)
      .offset((page - 1) * NEW_PROMOCODES_PAGE_SIZE),
  ]);
  return {
    items: (rows as PromocodeListRow[]).map((row) =>
      mapPromocodeListRow(row, { includeStartsAt: false, includeConditions: false })
    ),
    total: countRows[0]?.count ?? 0,
  };
}

export function getNewPromocodes(locale: "uz" | "ru" | "en", page = 1) {
  return unstable_cache(
    () => fetchNewPromocodes(locale, page),
    ["new-promocodes", locale, String(page)],
    { revalidate: 1800, tags: ["promocodes", `promocodes-${locale}`] }
  )();
}
