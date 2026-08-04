import "dotenv/config";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { promocodeTranslations, redirects } from "../../db/schema";
import type { Language } from "../../lib/i18n";
import { PROMOCODE_SLUG_MAPPING } from "./promocode-slug-mapping";

const LOCALES = ["uz", "ru", "en"] as const;
type Locale = (typeof LOCALES)[number];

type TranslationRow = {
  language: Language;
  slug: string;
};

type CurrentByLanguage = Partial<Record<Locale, TranslationRow>>;

type UpdateCandidate = {
  promocodeId: string;
  language: Locale;
  oldSlug: string;
  newSlug: string;
};

type RedirectCandidate = {
  fromPath: string;
  toPath: string;
};

function shortId(id: string): string {
  return id.replaceAll("-", "").slice(0, 8);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const promocodeIds = PROMOCODE_SLUG_MAPPING.map((item) => item.id);

  const currentRows = await db
    .select({
      promocodeId: promocodeTranslations.promocodeId,
      language: promocodeTranslations.language,
      slug: promocodeTranslations.slug,
    })
    .from(promocodeTranslations)
    .where(inArray(promocodeTranslations.promocodeId, promocodeIds));

  const currentById = new Map<string, CurrentByLanguage>();
  for (const row of currentRows) {
    if (!currentById.has(row.promocodeId)) {
      currentById.set(row.promocodeId, {});
    }
    const bucket = currentById.get(row.promocodeId)!;
    bucket[row.language as Locale] = {
      language: row.language,
      slug: row.slug,
    };
  }

  const missingTranslations: string[] = [];
  const updates: UpdateCandidate[] = [];

  for (const item of PROMOCODE_SLUG_MAPPING) {
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
        promocodeId: item.id,
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

  const redirectMap = new Map<string, RedirectCandidate>();
  for (const item of PROMOCODE_SLUG_MAPPING) {
    const current = currentById.get(item.id)!;
    const oldSlugs = Array.from(
      new Set(LOCALES.map((locale) => current[locale]?.slug.trim()).filter(Boolean))
    ) as string[];

    for (const locale of LOCALES) {
      const targetSlug = item.slugs[locale].trim();
      for (const oldSlug of oldSlugs) {
        const fromPath = `/${locale}/promocode/${oldSlug}`;
        const toPath = `/${locale}/promocode/${targetSlug}`;
        if (fromPath === toPath) {
          continue;
        }
        redirectMap.set(fromPath, { fromPath, toPath });
      }
    }
  }

  const redirectsToUpsert = Array.from(redirectMap.values());

  console.log(`ℹ️  Mode: ${dryRun ? "DRY RUN" : "APPLY"}`);
  console.log(`ℹ️  Promocodes in mapping: ${PROMOCODE_SLUG_MAPPING.length}`);
  console.log(`ℹ️  Translation updates: ${updates.length}`);
  console.log(`ℹ️  Redirect upserts: ${redirectsToUpsert.length}`);

  if (updates.length === 0) {
    console.log("✅ No slug updates required. Mapping already applied.");
    return;
  }

  if (dryRun) {
    console.log("\nPreview (first 10 updates):");
    for (const row of updates.slice(0, 10)) {
      console.log(
        `  ${shortId(row.promocodeId)} [${row.language}] ${row.oldSlug} -> ${row.newSlug}`
      );
    }
    return;
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    for (const row of updates) {
      await tx
        .update(promocodeTranslations)
        .set({
          slug: row.newSlug,
          updatedAt: now,
        })
        .where(
          and(
            eq(promocodeTranslations.promocodeId, row.promocodeId),
            eq(promocodeTranslations.language, row.language)
          )
        );
    }

    for (const row of redirectsToUpsert) {
      await tx
        .insert(redirects)
        .values({
          fromPath: row.fromPath,
          toPath: row.toPath,
          entityType: "promocode",
          statusCode: 301,
          isActive: true,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: redirects.fromPath,
          set: {
            toPath: row.toPath,
            entityType: "promocode",
            statusCode: 301,
            isActive: true,
            updatedAt: now,
          },
        });
    }
  });

  console.log("✅ Promocode slug migration completed.");
}

main().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
