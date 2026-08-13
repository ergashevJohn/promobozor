import "dotenv/config";

import { asc, eq } from "drizzle-orm";
import { db } from "../../db";
import { stores, storeTranslations } from "../../db/schema";
import { ensureUniqueSlug, generateStoreSeoSlug } from "../../lib/slug-seo";

const LOCALES = ["uz", "ru", "en"] as const;
type Locale = (typeof LOCALES)[number];

type LocaleRow = { name: string; slug: string };

type Group = {
  id: string;
  current: Partial<Record<Locale, LocaleRow>>;
  proposed: Partial<Record<Locale, string>>;
};

function shortId(id: string): string {
  return id.replaceAll("-", "").slice(0, 8);
}

async function main() {
  const rows = await db
    .select({
      storeId: stores.id,
      createdAt: stores.createdAt,
      language: storeTranslations.language,
      name: storeTranslations.name,
      slug: storeTranslations.slug,
    })
    .from(stores)
    .innerJoin(storeTranslations, eq(storeTranslations.storeId, stores.id))
    .orderBy(asc(stores.createdAt));

  const groups = new Map<string, Group>();
  for (const row of rows) {
    if (!groups.has(row.storeId)) {
      groups.set(row.storeId, { id: row.storeId, current: {}, proposed: {} });
    }
    const bucket = groups.get(row.storeId)!;
    bucket.current[row.language as Locale] = { name: row.name, slug: row.slug };
  }

  const usedByLanguage: Record<Locale, Map<string, string>> = {
    uz: new Map(),
    ru: new Map(),
    en: new Map(),
  };

  for (const group of groups.values()) {
    for (const locale of LOCALES) {
      const current = group.current[locale];
      if (!current) continue;
      const natural = generateStoreSeoSlug({ storeName: current.name, language: locale });
      group.proposed[locale] = ensureUniqueSlug(natural, usedByLanguage[locale], group.id);
    }
  }

  const lines: string[] = [];
  lines.push("ID\tUZ(current=>proposed)\tRU(current=>proposed)\tEN(current=>proposed)");

  let changedAny = 0;
  const changedByLanguage: Record<Locale, number> = { uz: 0, ru: 0, en: 0 };

  for (const group of groups.values()) {
    const rowParts = [shortId(group.id)];
    let hasChange = false;
    for (const locale of LOCALES) {
      const current = group.current[locale];
      const proposed = group.proposed[locale];
      if (!current || !proposed) {
        rowParts.push("-");
        continue;
      }
      if (current.slug !== proposed) {
        hasChange = true;
        changedByLanguage[locale] += 1;
      }
      rowParts.push(`${current.slug}=>${proposed}`);
    }
    if (hasChange) changedAny += 1;
    lines.push(rowParts.join("\t"));
  }

  console.log("Store slug preview ({name}-chegirmalar/skidki/deals)\n");
  console.log(`Total stores: ${groups.size}`);
  console.log(`Stores with any changes: ${changedAny}`);
  console.log(
    `Changed by language: uz=${changedByLanguage.uz}, ru=${changedByLanguage.ru}, en=${changedByLanguage.en}\n`
  );
  console.log(lines.join("\n"));
}

main().catch((error) => {
  console.error("❌ Failed to generate store preview:", error);
  process.exit(1);
});
