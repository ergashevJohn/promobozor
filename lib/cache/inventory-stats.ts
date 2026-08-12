import { brands, categories, db, promocodes, stores } from "@/lib/db";
import { activePromocodeStatusConditions } from "@/lib/promocode-active";
import { count, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export type InventoryStats = {
  storeCount: number;
  categoryCount: number;
  brandCount: number;
  promocodeCount: number;
};

async function fetchInventoryStats(): Promise<InventoryStats> {
  const now = new Date();
  const [storesRow, categoriesRow, brandsRow, promocodesRow] = await Promise.all([
    db.select({ value: count() }).from(stores).where(eq(stores.isActive, true)),
    db.select({ value: count() }).from(categories).where(eq(categories.isActive, true)),
    db.select({ value: count() }).from(brands).where(eq(brands.isActive, true)),
    db.select({ value: count() }).from(promocodes).where(activePromocodeStatusConditions(now)),
  ]);

  return {
    storeCount: Number(storesRow[0]?.value) || 0,
    categoryCount: Number(categoriesRow[0]?.value) || 0,
    brandCount: Number(brandsRow[0]?.value) || 0,
    promocodeCount: Number(promocodesRow[0]?.value) || 0,
  };
}

/** Cached site-wide inventory counts for About / marketing pages (1h). */
export function getCachedInventoryStats() {
  return unstable_cache(fetchInventoryStats, ["inventory-stats"], {
    revalidate: 3600,
    tags: ["stores", "categories", "brands", "promocodes", "inventory-stats"],
  })();
}
