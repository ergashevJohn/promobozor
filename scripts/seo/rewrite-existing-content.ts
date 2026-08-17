import "dotenv/config";

import { eq } from "drizzle-orm";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  brands,
  brandTranslations,
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
import { combinedSimilarity } from "../../lib/seo/content-similarity";
import { resolveSiteVoiceProfile, type SiteVoiceProfile } from "../../lib/seo/site-voice";

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
  skippedByFilter: number;
};

type CliOptions = {
  apply: boolean;
  profile: SiteVoiceProfile;
  overlapReportPath?: string;
  entityTypes: Set<EntityContentKind | "promocode"> | null;
  locales: Set<ContentLocale> | null;
  ids: Set<string> | null;
  translationIds: Set<string> | null;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    apply: argv.includes("--apply"),
    profile: "promobozor-editorial",
    entityTypes: null,
    locales: null,
    ids: null,
    translationIds: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--profile") {
      options.profile = resolveSiteVoiceProfile(argv[i + 1]);
      i += 1;
    } else if (arg.startsWith("--profile=")) {
      options.profile = resolveSiteVoiceProfile(arg.slice("--profile=".length));
    } else if (arg === "--overlap-report") {
      options.overlapReportPath = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--overlap-report=")) {
      options.overlapReportPath = arg.slice("--overlap-report=".length);
    } else if (arg === "--entity-type") {
      options.entityTypes ??= new Set();
      options.entityTypes.add(argv[i + 1] as EntityContentKind | "promocode");
      i += 1;
    } else if (arg.startsWith("--entity-type=")) {
      options.entityTypes ??= new Set();
      options.entityTypes.add(
        arg.slice("--entity-type=".length) as EntityContentKind | "promocode"
      );
    } else if (arg === "--locale") {
      options.locales ??= new Set();
      options.locales.add(argv[i + 1] as ContentLocale);
      i += 1;
    } else if (arg.startsWith("--locale=")) {
      options.locales ??= new Set();
      options.locales.add(arg.slice("--locale=".length) as ContentLocale);
    } else if (arg === "--ids") {
      options.ids ??= new Set();
      for (const id of (argv[i + 1] ?? "").split(",").filter(Boolean)) options.ids.add(id);
      i += 1;
    } else if (arg.startsWith("--ids=")) {
      options.ids ??= new Set();
      for (const id of arg.slice("--ids=".length).split(",").filter(Boolean)) options.ids.add(id);
    } else if (arg === "--translation-ids") {
      options.translationIds ??= new Set();
      for (const id of (argv[i + 1] ?? "").split(",").filter(Boolean)) {
        options.translationIds.add(id);
      }
      i += 1;
    } else if (arg.startsWith("--translation-ids=")) {
      options.translationIds ??= new Set();
      for (const id of arg.slice("--translation-ids=".length).split(",").filter(Boolean)) {
        options.translationIds.add(id);
      }
    }
  }

  return options;
}

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
  metaTitle: string,
  similarityDrop: number
): void {
  console.log(
    `[preview] ${label}/${locale} ${name}: ${wordCount(bodyHtml)} words; meta="${metaTitle}"; similarityDrop=${similarityDrop.toFixed(3)}`
  );
}

function sourceDescription(row: EntityTranslationRow): string | null {
  const firstParagraph = row.bodyHtml?.match(/<p>([\s\S]*?)<\/p>/i)?.[1];
  return plainText(firstParagraph) || plainText(row.description) || null;
}

function allowEntity(
  options: CliOptions,
  kind: EntityContentKind | "promocode",
  locale: ContentLocale,
  entityId: string,
  translationId: string
): boolean {
  if (options.entityTypes && !options.entityTypes.has(kind)) return false;
  if (options.locales && !options.locales.has(locale)) return false;
  if (options.ids && !options.ids.has(entityId)) return false;
  if (options.translationIds && !options.translationIds.has(translationId)) return false;
  return true;
}

async function loadOverlapTranslationIds(filePath: string): Promise<Set<string>> {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as {
    translationIds?: string[];
    overlaps?: Array<{ translationId?: string }>;
  };
  const ids = new Set<string>();
  for (const id of parsed.translationIds ?? []) ids.add(id);
  for (const row of parsed.overlaps ?? []) {
    if (row.translationId) ids.add(row.translationId);
  }
  return ids;
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

  const options = parseArgs(process.argv.slice(2));
  if (options.overlapReportPath) {
    const fromManifest = await loadOverlapTranslationIds(options.overlapReportPath);
    // Explicit translation filters narrow the reviewed overlap manifest; they
    // must never widen it. This keeps small production samples truly scoped.
    options.translationIds = options.translationIds
      ? new Set([...options.translationIds].filter((id) => fromManifest.has(id)))
      : fromManifest;
  }

  const { storeRows, brandRows, categoryRows, promoRows } = await loadData();
  const stats: RewriteStats = {
    stores: 0,
    brands: 0,
    categories: 0,
    promocodes: 0,
    sourceDescriptionsUsed: 0,
    fallbackDescriptionsUsed: 0,
    skippedByFilter: 0,
  };
  const now = new Date();
  const snapshot: Array<{
    kind: string;
    translationId: string;
    locale: ContentLocale;
    beforeBody: string | null;
    afterBody: string;
    similarityToBefore: number;
  }> = [];

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
      if (!allowEntity(options, kind, row.language, row.entityId, row.id)) {
        stats.skippedByFilter += 1;
        continue;
      }
      const existingDescription = sourceDescription(row);
      const rewrite = buildEntityRewrite({
        kind,
        locale: row.language,
        name: row.name,
        existingDescription,
        deals: dealsForEntity(promoRows, kind, row.entityId, row.language),
        profile: options.profile,
      });
      if (existingDescription) stats.sourceDescriptionsUsed += 1;
      else stats.fallbackDescriptionsUsed += 1;

      const beforeBody = row.bodyHtml || row.description;
      const similarityToBefore = combinedSimilarity(beforeBody, rewrite.bodyHtml);
      snapshot.push({
        kind,
        translationId: row.id,
        locale: row.language,
        beforeBody,
        afterBody: rewrite.bodyHtml,
        similarityToBefore,
      });

      if (!previewed.has(row.language)) {
        printPreview(
          kind,
          row.name,
          row.language,
          rewrite.bodyHtml,
          rewrite.metaTitle,
          1 - similarityToBefore
        );
        previewed.add(row.language);
      }

      if (options.apply) {
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
      if (!allowEntity(options, "promocode", row.language, row.id, row.translationId)) {
        stats.skippedByFilter += 1;
        continue;
      }
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
        profile: options.profile,
      });
      const similarityToBefore = combinedSimilarity(row.conditions, rewrite.conditions);
      snapshot.push({
        kind: "promocode",
        translationId: row.translationId,
        locale: row.language,
        beforeBody: row.conditions,
        afterBody: rewrite.conditions,
        similarityToBefore,
      });
      if (!previewed.has(row.language)) {
        console.log(
          `[preview] promocode/${row.language} ${row.title}: short="${rewrite.shortDescription}"; similarityDrop=${(1 - similarityToBefore).toFixed(3)}`
        );
        previewed.add(row.language);
      }
      if (options.apply) {
        await tx
          .update(promocodeTranslations)
          .set({ ...rewrite, updatedAt: now })
          .where(eq(promocodeTranslations.id, row.translationId));
      }
      stats.promocodes += 1;
    }
  });

  const outDir = path.join(process.cwd(), "reports");
  await mkdir(outDir, { recursive: true });
  const snapshotPath = path.join(
    outDir,
    options.apply ? "rewrite-snapshot-applied.json" : "rewrite-snapshot-dry-run.json"
  );
  await writeFile(
    snapshotPath,
    JSON.stringify(
      {
        mode: options.apply ? "applied" : "dry-run",
        profile: options.profile,
        generatedAt: now.toISOString(),
        stats,
        rows: snapshot,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        mode: options.apply ? "applied" : "dry-run",
        profile: options.profile,
        ...stats,
        snapshotPath,
        note: options.apply
          ? "Existing filtered entity and promocode translations were rewritten."
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
