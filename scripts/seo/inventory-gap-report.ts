import "dotenv/config";

import { and, count, eq, isNull, or, sql } from "drizzle-orm";
import { activePromocodeStatusConditions } from "../../lib/promocode-active";
import { getTopInventoryTargets, summarizeInventoryGap } from "../../lib/seo/inventory-targets";

type ContentGapRow = {
  slug: string;
  kind: string;
  priority: number;
  entityExists: boolean;
  activePromos: number;
  missingMeta: number;
  missingBody: number;
  missingFaq: number;
  missingReview: boolean;
};

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const {
    db,
    promocodes,
    stores,
    storeTranslations,
    brands,
    brandTranslations,
    categories,
    categoryTranslations,
  } = await import("../../lib/db");

  const now = new Date();
  const [{ value: activeCount }] = await db
    .select({ value: count() })
    .from(promocodes)
    .where(activePromocodeStatusConditions(now));

  const gap = summarizeInventoryGap(Number(activeCount) || 0);
  console.log("Inventory gap:", gap);

  const targets = getTopInventoryTargets();
  const rows: ContentGapRow[] = [];

  for (const target of targets) {
    if (target.kind === "store") {
      const [hit] = await db
        .select({ id: stores.id, lastReviewedAt: stores.lastReviewedAt })
        .from(storeTranslations)
        .innerJoin(stores, eq(storeTranslations.storeId, stores.id))
        .where(and(eq(storeTranslations.slug, target.slug), eq(stores.isActive, true)))
        .limit(1);

      let activePromos = 0;
      let missingMeta = 0;
      let missingBody = 0;
      let missingFaq = 0;

      if (hit?.id) {
        const [promoCount] = await db
          .select({ value: count() })
          .from(promocodes)
          .where(and(eq(promocodes.storeId, hit.id), activePromocodeStatusConditions(now)));
        activePromos = Number(promoCount?.value) || 0;

        const translations = await db
          .select({
            metaTitle: storeTranslations.metaTitle,
            metaDescription: storeTranslations.metaDescription,
            bodyHtml: storeTranslations.bodyHtml,
            description: storeTranslations.description,
            faqJson: storeTranslations.faqJson,
          })
          .from(storeTranslations)
          .where(eq(storeTranslations.storeId, hit.id));

        for (const tr of translations) {
          if (!tr.metaTitle || !tr.metaDescription) missingMeta += 1;
          if (
            !(tr.bodyHtml && tr.bodyHtml.trim().length >= 80) &&
            !(tr.description && tr.description.trim().length >= 80)
          ) {
            missingBody += 1;
          }
          if (!tr.faqJson || !Array.isArray(tr.faqJson) || tr.faqJson.length === 0) missingFaq += 1;
        }
      }

      rows.push({
        slug: target.slug,
        kind: target.kind,
        priority: target.priority,
        entityExists: Boolean(hit),
        activePromos,
        missingMeta,
        missingBody,
        missingFaq,
        missingReview: Boolean(hit) && !hit?.lastReviewedAt,
      });
    } else {
      const [hit] = await db
        .select({ id: brands.id, lastReviewedAt: brands.lastReviewedAt })
        .from(brandTranslations)
        .innerJoin(brands, eq(brandTranslations.brandId, brands.id))
        .where(and(eq(brandTranslations.slug, target.slug), eq(brands.isActive, true)))
        .limit(1);

      let activePromos = 0;
      let missingMeta = 0;
      let missingBody = 0;
      let missingFaq = 0;

      if (hit?.id) {
        const [promoCount] = await db
          .select({ value: count() })
          .from(promocodes)
          .where(and(eq(promocodes.brandId, hit.id), activePromocodeStatusConditions(now)));
        activePromos = Number(promoCount?.value) || 0;

        const translations = await db
          .select({
            metaTitle: brandTranslations.metaTitle,
            metaDescription: brandTranslations.metaDescription,
            bodyHtml: brandTranslations.bodyHtml,
            description: brandTranslations.description,
            faqJson: brandTranslations.faqJson,
          })
          .from(brandTranslations)
          .where(eq(brandTranslations.brandId, hit.id));

        for (const tr of translations) {
          if (!tr.metaTitle || !tr.metaDescription) missingMeta += 1;
          if (
            !(tr.bodyHtml && tr.bodyHtml.trim().length >= 80) &&
            !(tr.description && tr.description.trim().length >= 80)
          ) {
            missingBody += 1;
          }
          if (!tr.faqJson || !Array.isArray(tr.faqJson) || tr.faqJson.length === 0) missingFaq += 1;
        }
      }

      rows.push({
        slug: target.slug,
        kind: target.kind,
        priority: target.priority,
        entityExists: Boolean(hit),
        activePromos,
        missingMeta,
        missingBody,
        missingFaq,
        missingReview: Boolean(hit) && !hit?.lastReviewedAt,
      });
    }
  }

  const emptyHubs = rows.filter((row) => !row.entityExists || row.activePromos === 0);
  const contentGaps = rows.filter(
    (row) =>
      row.entityExists &&
      (row.missingMeta > 0 || row.missingBody > 0 || row.missingFaq > 0 || row.missingReview)
  );

  console.log(`Top hubs with missing entity or zero active promos: ${emptyHubs.length}`);
  console.log(`Top hubs with content SEO gaps (meta/body/faq/review): ${contentGaps.length}`);
  console.table(rows);

  const [{ value: unverifiedPromos }] = await db
    .select({ value: count() })
    .from(promocodes)
    .where(and(activePromocodeStatusConditions(now), isNull(promocodes.lastVerifiedAt)));

  const [{ value: thinCategoryLocales }] = await db
    .select({ value: count() })
    .from(categoryTranslations)
    .innerJoin(categories, eq(categoryTranslations.categoryId, categories.id))
    .where(
      and(
        eq(categories.isActive, true),
        or(
          isNull(categoryTranslations.metaTitle),
          isNull(categoryTranslations.bodyHtml),
          sql`length(coalesce(${categoryTranslations.bodyHtml}, '')) < 80`
        )
      )
    );

  console.log("Active promocodes missing lastVerifiedAt:", Number(unverifiedPromos) || 0);
  console.log(
    "Active category locales with thin/missing body or meta:",
    Number(thinCategoryLocales) || 0
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
