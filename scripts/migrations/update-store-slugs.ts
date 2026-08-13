import "dotenv/config";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { redirects, storeTranslations } from "../../db/schema";
import type { Language } from "../../lib/i18n";
import { STORE_SLUG_MAPPING } from "./store-slug-mapping";
import { buildEntityRedirects } from "./slug-migration-utils";

const LOCALES = ["uz", "ru", "en"] as const;
type Locale = (typeof LOCALES)[number];

type TranslationRow = {
  language: Language;
  slug: string;
};

type CurrentByLanguage = Partial<Record<Locale, TranslationRow>>;

type UpdateCandidate = {
  storeId: string;
  language: Locale;
  oldSlug: string;
  newSlug: string;
};

function shortId(id: string): string {
  return id.replaceAll("-", "").slice(0, 8);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const storeIds = STORE_SLUG_MAPPING.map((item) => item.id);

  if (storeIds.length === 0) {
    console.log("ℹ️  No stores in mapping. Run generate-slug-mappings.ts first.");
    return;
  }

  const currentRows = await db
    .select({
      storeId: storeTranslations.storeId,
      language: storeTranslations.language,
      slug: storeTranslations.slug,
    })
    .from(storeTranslations)
    .where(inArray(storeTranslations.storeId, storeIds));

  const currentById = new Map<string, CurrentByLanguage>();
  for (const row of currentRows) {
    if (!currentById.has(row.storeId)) {
      currentById.set(row.storeId, {});
    }
    const bucket = currentById.get(row.storeId)!;
    bucket[row.language as Locale] = {
      language: row.language,
      slug: row.slug,
    };
  }

  const missingTranslations: string[] = [];
  const updates: UpdateCandidate[] = [];

  for (const item of STORE_SLUG_MAPPING) {
    const current = currentById.get(item.id);

    if (!current) {
      missingTranslations.push(`${shortId(item.id)}: no translations in DB`);
      continue;
    }

    for (const locale of LOCALES) {
      const currentTranslation = current[locale];
      if (!currentTranslation) {
        missingTranslations.push(`${shortId(item.id)}: missing ${locale} translation`);
        continue;
      }

      const normalizedCurrent = currentTranslation.slug.trim();
      const normalizedNext = item.slugs[locale].trim();
      if (normalizedCurrent === normalizedNext) {
        continue;
      }

      updates.push({
        storeId: item.id,
        language: locale,
        oldSlug: normalizedCurrent,
        newSlug: normalizedNext,
      });
    }
  }

  if (missingTranslations.length > 0) {
    console.error("❌ Cannot run migration: missing translations in DB");
    for (const row of missingTranslations) {
      console.error(`  - ${row}`);
    }
    process.exit(1);
  }

  const redirectMap = new Map<string, { fromPath: string; toPath: string }>();
  for (const item of STORE_SLUG_MAPPING) {
    const current = currentById.get(item.id)!;
    const oldSlugs = Array.from(
      new Set(LOCALES.map((locale) => current[locale]?.slug.trim()).filter(Boolean))
    ) as string[];

    for (const locale of LOCALES) {
      const targetSlug = item.slugs[locale].trim();
      for (const redirect of buildEntityRedirects({
        entityType: "store",
        locale,
        oldSlugs,
        newSlug: targetSlug,
      })) {
        redirectMap.set(redirect.fromPath, redirect);
      }
    }
  }

  const redirectsToUpsert = Array.from(redirectMap.values());

  console.log(`ℹ️  Mode: ${dryRun ? "DRY RUN" : "APPLY"}`);
  console.log(`ℹ️  Stores in mapping: ${STORE_SLUG_MAPPING.length}`);
  console.log(`ℹ️  Translation updates: ${updates.length}`);
  console.log(`ℹ️  Redirect upserts: ${redirectsToUpsert.length}`);

  if (updates.length === 0 && redirectsToUpsert.length === 0) {
    console.log("✅ No slug updates required. Mapping already applied.");
    return;
  }

  if (dryRun) {
    console.log("\nPreview updates:");
    for (const row of updates) {
      console.log(`  ${shortId(row.storeId)} [${row.language}] ${row.oldSlug} -> ${row.newSlug}`);
    }
    console.log("\nRedirect preview (first 10):");
    for (const row of redirectsToUpsert.slice(0, 10)) {
      console.log(`  ${row.fromPath} -> ${row.toPath}`);
    }
    return;
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    for (const row of updates) {
      await tx
        .update(storeTranslations)
        .set({
          slug: row.newSlug,
          updatedAt: now,
        })
        .where(
          and(
            eq(storeTranslations.storeId, row.storeId),
            eq(storeTranslations.language, row.language)
          )
        );
    }

    for (const row of redirectsToUpsert) {
      await tx
        .insert(redirects)
        .values({
          fromPath: row.fromPath,
          toPath: row.toPath,
          entityType: "store",
          statusCode: 301,
          isActive: true,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: redirects.fromPath,
          set: {
            toPath: row.toPath,
            entityType: "store",
            statusCode: 301,
            isActive: true,
            updatedAt: now,
          },
        });
    }
  });

  console.log("✅ Store slug migration completed.");
}

main().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
