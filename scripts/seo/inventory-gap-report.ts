import "dotenv/config";

import { getTopInventoryTargets, summarizeInventoryGap } from "../../lib/seo/inventory-targets";
import { activePromocodeStatusConditions } from "../../lib/promocode-active";
import { and, count, eq } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const { db, promocodes, stores, storeTranslations, brands, brandTranslations } = await import(
    "../../lib/db"
  );

  const now = new Date();
  const [{ value: activeCount }] = await db
    .select({ value: count() })
    .from(promocodes)
    .where(activePromocodeStatusConditions(now));

  const gap = summarizeInventoryGap(Number(activeCount) || 0);
  console.log("Inventory gap:", gap);

  const targets = getTopInventoryTargets();
  const rows: Array<{
    slug: string;
    kind: string;
    priority: number;
    entityExists: boolean;
    activePromos: number;
  }> = [];

  for (const target of targets) {
    if (target.kind === "store") {
      const [hit] = await db
        .select({ id: stores.id })
        .from(storeTranslations)
        .innerJoin(stores, eq(storeTranslations.storeId, stores.id))
        .where(and(eq(storeTranslations.slug, target.slug), eq(stores.isActive, true)))
        .limit(1);

      let activePromos = 0;
      if (hit?.id) {
        const [promoCount] = await db
          .select({ value: count() })
          .from(promocodes)
          .where(and(eq(promocodes.storeId, hit.id), activePromocodeStatusConditions(now)));
        activePromos = Number(promoCount?.value) || 0;
      }

      rows.push({
        slug: target.slug,
        kind: target.kind,
        priority: target.priority,
        entityExists: Boolean(hit),
        activePromos,
      });
    } else {
      const [hit] = await db
        .select({ id: brands.id })
        .from(brandTranslations)
        .innerJoin(brands, eq(brandTranslations.brandId, brands.id))
        .where(and(eq(brandTranslations.slug, target.slug), eq(brands.isActive, true)))
        .limit(1);

      let activePromos = 0;
      if (hit?.id) {
        const [promoCount] = await db
          .select({ value: count() })
          .from(promocodes)
          .where(and(eq(promocodes.brandId, hit.id), activePromocodeStatusConditions(now)));
        activePromos = Number(promoCount?.value) || 0;
      }

      rows.push({
        slug: target.slug,
        kind: target.kind,
        priority: target.priority,
        entityExists: Boolean(hit),
        activePromos,
      });
    }
  }

  const emptyHubs = rows.filter((row) => !row.entityExists || row.activePromos === 0);
  console.log(`Top hubs with missing entity or zero active promos: ${emptyHubs.length}`);
  console.table(rows);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
