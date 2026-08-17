/**
 * Soft-merge internal semantic duplicates after human review of the overlap report.
 *
 * Default: dry-run. Reads reports/cross-site-dupes.json (or --report) internalDuplicates
 * and emits a merge plan. With --apply + --pair=canonicalId:duplicateId,
 * rewrites promocode FKs, inserts redirects, and deactivates the duplicate.
 * Either side of an audited pair may be selected as canonical.
 *
 * Cross-type store↔brand pairs are never auto-merged.
 *
 * Usage:
 *   npx tsx scripts/seo/merge-internal-duplicates.ts
 *   npx tsx scripts/seo/merge-internal-duplicates.ts --apply --pair=<canonicalId>:<duplicateId>
 */
import "dotenv/config";

import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../../db";
import {
  brandTranslations,
  brands,
  categories,
  categoryTranslations,
  promocodes,
  redirects,
  storeTranslations,
  stores,
} from "../../db/schema";
import { getEntityPath, type Locale as RouteLocale } from "../../lib/routes";

type EntityKind = "store" | "brand" | "category" | "promocode";

type InternalDup = {
  kind: EntityKind;
  locale: string;
  leftSlug: string;
  rightSlug: string;
  leftEntityId: string;
  rightEntityId: string;
  reason: string;
};

type MergePlan = {
  kind: EntityKind;
  canonicalId: string;
  duplicateId: string;
  canonicalSlug: string;
  duplicateSlug: string;
  locale: string;
  reason: string;
  redirects: Array<{ fromPath: string; toPath: string }>;
  blockedReason?: string;
};

function parseArgs(argv: string[]) {
  let apply = false;
  let reportPath = path.join(process.cwd(), "reports", "cross-site-dupes.json");
  const pairs: Array<{ canonicalId: string; duplicateId: string }> = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") apply = true;
    else if (arg === "--report") {
      reportPath = argv[++i] ?? reportPath;
    } else if (arg.startsWith("--report=")) {
      reportPath = arg.slice("--report=".length);
    } else if (arg === "--pair") {
      const value = argv[++i];
      if (!value?.includes(":")) throw new Error("--pair expects canonicalId:duplicateId");
      const [canonicalId, duplicateId] = value.split(":");
      pairs.push({ canonicalId, duplicateId });
    } else if (arg.startsWith("--pair=")) {
      const value = arg.slice("--pair=".length);
      const [canonicalId, duplicateId] = value.split(":");
      pairs.push({ canonicalId, duplicateId });
    }
  }

  return { apply, reportPath, pairs };
}

function entityTable(kind: EntityKind) {
  switch (kind) {
    case "store":
      return { table: stores, translations: storeTranslations, fk: "storeId" as const };
    case "brand":
      return { table: brands, translations: brandTranslations, fk: "brandId" as const };
    case "category":
      return { table: categories, translations: categoryTranslations, fk: "categoryId" as const };
    case "promocode":
      return null;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

async function buildRedirects(
  kind: EntityKind,
  duplicateId: string,
  canonicalId: string
): Promise<Array<{ fromPath: string; toPath: string }>> {
  if (kind === "promocode") return [];
  const meta = entityTable(kind);
  if (!meta) return [];

  const dupTranslations =
    kind === "store"
      ? await db
          .select({ language: storeTranslations.language, slug: storeTranslations.slug })
          .from(storeTranslations)
          .where(eq(storeTranslations.storeId, duplicateId))
      : kind === "brand"
        ? await db
            .select({ language: brandTranslations.language, slug: brandTranslations.slug })
            .from(brandTranslations)
            .where(eq(brandTranslations.brandId, duplicateId))
        : await db
            .select({ language: categoryTranslations.language, slug: categoryTranslations.slug })
            .from(categoryTranslations)
            .where(eq(categoryTranslations.categoryId, duplicateId));

  const canTranslations =
    kind === "store"
      ? await db
          .select({ language: storeTranslations.language, slug: storeTranslations.slug })
          .from(storeTranslations)
          .where(eq(storeTranslations.storeId, canonicalId))
      : kind === "brand"
        ? await db
            .select({ language: brandTranslations.language, slug: brandTranslations.slug })
            .from(brandTranslations)
            .where(eq(brandTranslations.brandId, canonicalId))
        : await db
            .select({ language: categoryTranslations.language, slug: categoryTranslations.slug })
            .from(categoryTranslations)
            .where(eq(categoryTranslations.categoryId, canonicalId));

  const canByLang = new Map(canTranslations.map((t) => [t.language, t.slug]));
  const plans: Array<{ fromPath: string; toPath: string }> = [];

  for (const row of dupTranslations) {
    const targetSlug = canByLang.get(row.language);
    if (!targetSlug) continue;
    const locale = row.language as RouteLocale;
    plans.push({
      fromPath: getEntityPath(locale, kind, row.slug),
      toPath: getEntityPath(locale, kind, targetSlug),
    });
  }

  return plans;
}

async function applyMerge(plan: MergePlan): Promise<void> {
  if (plan.blockedReason) {
    throw new Error(plan.blockedReason);
  }

  const kind = plan.kind;
  if (kind === "promocode") {
    throw new Error("Promocode merges are not supported by this script — merge hubs only.");
  }

  await db.transaction(async (tx) => {
    switch (kind) {
      case "store": {
        await tx
          .update(promocodes)
          .set({ storeId: plan.canonicalId, updatedAt: new Date() })
          .where(eq(promocodes.storeId, plan.duplicateId));
        await tx
          .update(stores)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(stores.id, plan.duplicateId));
        break;
      }
      case "brand": {
        await tx
          .update(promocodes)
          .set({ brandId: plan.canonicalId, updatedAt: new Date() })
          .where(eq(promocodes.brandId, plan.duplicateId));
        await tx
          .update(brands)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(brands.id, plan.duplicateId));
        break;
      }
      case "category": {
        await tx
          .update(promocodes)
          .set({ categoryId: plan.canonicalId, updatedAt: new Date() })
          .where(eq(promocodes.categoryId, plan.duplicateId));
        await tx
          .update(categories)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(categories.id, plan.duplicateId));
        break;
      }
      default: {
        const _exhaustive: never = kind;
        void _exhaustive;
      }
    }

    for (const redirect of plan.redirects) {
      await tx
        .insert(redirects)
        .values({
          id: randomUUID(),
          fromPath: redirect.fromPath,
          toPath: redirect.toPath,
          entityType: kind,
          statusCode: 301,
          isActive: true,
        })
        .onConflictDoNothing();
    }
  });
}

async function main() {
  const { apply, reportPath, pairs } = parseArgs(process.argv.slice(2));
  const raw = await readFile(reportPath, "utf8");
  const report = JSON.parse(raw) as { internalDuplicates?: InternalDup[] };
  const dups = report.internalDuplicates ?? [];

  if (dups.length === 0) {
    console.log(`No internalDuplicates in ${reportPath}. Run seo:compare-sites first.`);
    return;
  }

  const plans: MergePlan[] = [];
  const plannedPairs = new Set<string>();
  for (const dup of dups) {
    const pairKey = [dup.kind, ...[dup.leftEntityId, dup.rightEntityId].sort()].join(":");
    if (plannedPairs.has(pairKey)) continue;
    plannedPairs.add(pairKey);

    if (dup.kind === "promocode") {
      plans.push({
        kind: dup.kind,
        canonicalId: dup.leftEntityId,
        duplicateId: dup.rightEntityId,
        canonicalSlug: dup.leftSlug,
        duplicateSlug: dup.rightSlug,
        locale: dup.locale,
        reason: dup.reason,
        redirects: [],
        blockedReason: "Promocode duplicate — review manually; do not auto-merge",
      });
      continue;
    }

    const redirectsPlan = await buildRedirects(dup.kind, dup.rightEntityId, dup.leftEntityId);
    plans.push({
      kind: dup.kind,
      canonicalId: dup.leftEntityId,
      duplicateId: dup.rightEntityId,
      canonicalSlug: dup.leftSlug,
      duplicateSlug: dup.rightSlug,
      locale: dup.locale,
      reason: dup.reason,
      redirects: redirectsPlan,
    });
  }

  await mkdir(path.join(process.cwd(), "reports"), { recursive: true });
  const outPath = path.join(process.cwd(), "reports", "internal-merge-plan.json");
  await writeFile(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), plans }, null, 2)
  );
  console.log(`Wrote ${plans.length} merge plan(s) → ${outPath}`);

  if (!apply) {
    console.log(
      "Dry-run only. Re-run with --apply --pair=<canonicalId>:<duplicateId> after review."
    );
    return;
  }

  if (pairs.length === 0) {
    throw new Error("--apply requires at least one --pair=canonicalId:duplicateId");
  }

  for (const pair of pairs) {
    const audited = dups.find(
      (dup) =>
        (dup.leftEntityId === pair.canonicalId && dup.rightEntityId === pair.duplicateId) ||
        (dup.leftEntityId === pair.duplicateId && dup.rightEntityId === pair.canonicalId)
    );
    if (!audited) {
      throw new Error(`Pair ${pair.canonicalId}:${pair.duplicateId} not found in merge plan`);
    }

    const canonicalIsLeft = audited.leftEntityId === pair.canonicalId;
    const plan: MergePlan = {
      kind: audited.kind,
      canonicalId: pair.canonicalId,
      duplicateId: pair.duplicateId,
      canonicalSlug: canonicalIsLeft ? audited.leftSlug : audited.rightSlug,
      duplicateSlug: canonicalIsLeft ? audited.rightSlug : audited.leftSlug,
      locale: audited.locale,
      reason: audited.reason,
      redirects: await buildRedirects(audited.kind, pair.duplicateId, pair.canonicalId),
      ...(audited.kind === "promocode"
        ? { blockedReason: "Promocode duplicate — review manually; do not auto-merge" }
        : {}),
    };

    if (plan.blockedReason) {
      console.warn(`Skip ${pair.canonicalId}:${pair.duplicateId}: ${plan.blockedReason}`);
      continue;
    }
    await applyMerge(plan);
    console.log(`Merged ${plan.kind} ${plan.duplicateSlug} → ${plan.canonicalSlug}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
