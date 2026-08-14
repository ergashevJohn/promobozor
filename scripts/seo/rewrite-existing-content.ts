import "dotenv/config";

import { eq } from "drizzle-orm";
import {
  brandTranslations,
  brands,
  categories,
  categoryTranslations,
  db,
  promocodes,
  promocodeTranslations,
  stores,
  storeTranslations,
} from "../../lib/db";
import { activePromocodeStatusConditions } from "../../lib/promocode-active";
import {
  buildEntityRewrite,
  buildPromocodeRewrite,
  plainText,
  wordCount,
  type ContentLocale,
  type DealFact,
  type EntityContentKind,
} from "../../lib/seo/content-rewrite";

type EntityTranslationRow = {
  id: string;
  entityId: string;
  language: ContentLocale;
  name: string;
  description: string | null;
  bodyHtml: string | null;
};

type ActivePromoRow = {
  id: string;
  storeId: string | null;
  brandId: string | null;
  categoryId: string | null;
  type: "code" | "link";
  discountType: "percent" | "amount";
  discountValue: number;
  currency: "UZS" | "USD" | "EUR";
  minOrderAmount: number | null;
  expiresAt: Date | null;
  translationId: string;
  language: ContentLocale;
  title: string;
  conditions: string | null;
};

type RewriteStats = {
  stores: number;
  brands: number;
  categories: number;
  promocodes: number;
  sourceDescriptionsUsed: number;
  fallbackDescriptionsUsed: number;
};

function entityKey(entityId: string, locale: ContentLocale): string {
  return `${entityId}:${locale}`;
}

function dealFact(row: ActivePromoRow): DealFact {
  return {
    title: row.title,
    discountType: row.discountType,
    discountValue: row.discountValue,
    currency: row.currency,
    type: row.type,
    minOrderAmount: row.minOrderAmount,
    expiresAt: row.expiresAt,
  };
}

function dealsForEntity(
  rows: ActivePromoRow[],
  kind: EntityContentKind,
  entityId: string,
  locale: ContentLocale
): DealFact[] {
  return rows
    .filter((row) => {
      if (row.language !== locale) return false;
      if (kind === "store") return row.storeId === entityId;
      if (kind === "brand") return row.brandId === entityId;
      return row.categoryId === entityId;
    })
    .map(dealFact);
}

function printPreview(
  label: string,
  name: string,
  locale: ContentLocale,
  bodyHtml: string,
  metaTitle: string
): void {
  console.log(
    `[preview] ${label}/${locale} ${name}: ${wordCount(bodyHtml)} words; meta="${metaTitle}"`
  );
}

function sourceDescription(row: EntityTranslationRow): string | null {
  const firstParagraph = row.bodyHtml?.match(/<p>([\s\S]*?)<\/p>/i)?.[1];
  return plainText(firstParagraph) || plainText(row.description) || null;
}

async function loadData(): Promise<{
  storeRows: EntityTranslationRow[];
  brandRows: EntityTranslationRow[];
  categoryRows: EntityTranslationRow[];
  promoRows: ActivePromoRow[];
}> {
  const now = new Date();
  const [storeRows, brandRows, categoryRows, promoRows] = await Promise.all([
    db
      .select({
        id: storeTranslations.id,
        entityId: storeTranslations.storeId,
        language: storeTranslations.language,
        name: storeTranslations.name,
        description: storeTranslations.description,
        bodyHtml: storeTranslations.bodyHtml,
      })
      .from(storeTranslations)
      .innerJoin(stores, eq(stores.id, storeTranslations.storeId))
      .where(eq(stores.isActive, true)),
    db
      .select({
        id: brandTranslations.id,
        entityId: brandTranslations.brandId,
        language: brandTranslations.language,
        name: brandTranslations.name,
        description: brandTranslations.description,
        bodyHtml: brandTranslations.bodyHtml,
      })
      .from(brandTranslations)
      .innerJoin(brands, eq(brands.id, brandTranslations.brandId))
      .where(eq(brands.isActive, true)),
    db
      .select({
        id: categoryTranslations.id,
        entityId: categoryTranslations.categoryId,
        language: categoryTranslations.language,
        name: categoryTranslations.name,
        description: categoryTranslations.description,
        bodyHtml: categoryTranslations.bodyHtml,
      })
      .from(categoryTranslations)
      .innerJoin(categories, eq(categories.id, categoryTranslations.categoryId))
      .where(eq(categories.isActive, true)),
    db
      .select({
        id: promocodes.id,
        storeId: promocodes.storeId,
        brandId: promocodes.brandId,
        categoryId: promocodes.categoryId,
        type: promocodes.type,
        discountType: promocodes.discountType,
        discountValue: promocodes.discountValue,
        currency: promocodes.currency,
        minOrderAmount: promocodes.minOrderAmount,
        expiresAt: promocodes.expiresAt,
        translationId: promocodeTranslations.id,
        language: promocodeTranslations.language,
        title: promocodeTranslations.title,
        conditions: promocodeTranslations.conditions,
      })
      .from(promocodes)
      .innerJoin(promocodeTranslations, eq(promocodeTranslations.promocodeId, promocodes.id))
      .where(activePromocodeStatusConditions(now)),
  ]);

  return {
    storeRows: storeRows as EntityTranslationRow[],
    brandRows: brandRows as EntityTranslationRow[],
    categoryRows: categoryRows as EntityTranslationRow[],
    promoRows: promoRows as ActivePromoRow[],
  };
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const apply = process.argv.includes("--apply");
  const { storeRows, brandRows, categoryRows, promoRows } = await loadData();
  const stats: RewriteStats = {
    stores: 0,
    brands: 0,
    categories: 0,
    promocodes: 0,
    sourceDescriptionsUsed: 0,
    fallbackDescriptionsUsed: 0,
  };
  const now = new Date();
  const storeNames = new Map(
    storeRows.map((row) => [entityKey(row.entityId, row.language), row.name] as const)
  );
  const brandNames = new Map(
    brandRows.map((row) => [entityKey(row.entityId, row.language), row.name] as const)
  );
  const categoryNames = new Map(
    categoryRows.map((row) => [entityKey(row.entityId, row.language), row.name] as const)
  );

  const rewriteEntities = async (
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    kind: EntityContentKind,
    rows: EntityTranslationRow[]
  ): Promise<void> => {
    const previewed = new Set<ContentLocale>();
    for (const row of rows) {
      const existingDescription = sourceDescription(row);
      const rewrite = buildEntityRewrite({
        kind,
        locale: row.language,
        name: row.name,
        existingDescription,
        deals: dealsForEntity(promoRows, kind, row.entityId, row.language),
      });
      if (existingDescription) stats.sourceDescriptionsUsed += 1;
      else stats.fallbackDescriptionsUsed += 1;
      if (!previewed.has(row.language)) {
        printPreview(kind, row.name, row.language, rewrite.bodyHtml, rewrite.metaTitle);
        previewed.add(row.language);
      }

      if (apply) {
        if (kind === "store") {
          await tx
            .update(storeTranslations)
            .set({ ...rewrite, updatedAt: now })
            .where(eq(storeTranslations.id, row.id));
        } else if (kind === "brand") {
          await tx
            .update(brandTranslations)
            .set({ ...rewrite, updatedAt: now })
            .where(eq(brandTranslations.id, row.id));
        } else {
          await tx
            .update(categoryTranslations)
            .set({ ...rewrite, updatedAt: now })
            .where(eq(categoryTranslations.id, row.id));
        }
      }

      if (kind === "store") stats.stores += 1;
      else if (kind === "brand") stats.brands += 1;
      else stats.categories += 1;
    }
  };

  await db.transaction(async (tx) => {
    await rewriteEntities(tx, "store", storeRows);
    await rewriteEntities(tx, "brand", brandRows);
    await rewriteEntities(tx, "category", categoryRows);

    const previewed = new Set<ContentLocale>();
    for (const row of promoRows) {
      const name =
        (row.storeId ? storeNames.get(entityKey(row.storeId, row.language)) : null) ??
        (row.brandId ? brandNames.get(entityKey(row.brandId, row.language)) : null) ??
        (row.categoryId ? categoryNames.get(entityKey(row.categoryId, row.language)) : null) ??
        "PromoBozor";
      const rewrite = buildPromocodeRewrite({
        locale: row.language,
        title: row.title,
        existingConditions: row.conditions,
        entityName: name,
        discountType: row.discountType,
        discountValue: row.discountValue,
        currency: row.currency,
        type: row.type,
        minOrderAmount: row.minOrderAmount,
        expiresAt: row.expiresAt,
      });
      if (!previewed.has(row.language)) {
        console.log(
          `[preview] promocode/${row.language} ${row.title}: short="${rewrite.shortDescription}"`
        );
        previewed.add(row.language);
      }
      if (apply) {
        await tx
          .update(promocodeTranslations)
          .set({ ...rewrite, updatedAt: now })
          .where(eq(promocodeTranslations.id, row.translationId));
      }
      stats.promocodes += 1;
    }
  });

  console.log(
    JSON.stringify(
      {
        mode: apply ? "applied" : "dry-run",
        ...stats,
        note: apply
          ? "Existing active entity and promocode translations were rewritten."
          : "No database rows changed. Re-run with --apply after reviewing previews.",
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
