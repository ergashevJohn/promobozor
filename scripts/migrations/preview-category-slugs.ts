import "dotenv/config";

import { asc, eq } from "drizzle-orm";
import { db } from "../../db";
import { categories, categoryTranslations } from "../../db/schema";
import {
  differentiateFromCompetitor,
  ensureUniqueSlug,
  generateCategorySeoSlug,
} from "../../lib/slug-seo";

const LOCALES = ["uz", "ru", "en"] as const;
type Locale = (typeof LOCALES)[number];

/** Known competitor-style category slugs that should be differentiated */
const COMPETITOR_CATEGORY_SLUGS = new Set([
  "travel",
  "fashion",
  "food-delivery",
  "electronics",
  "beauty",
  "finance",
  "crypto",
]);

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
      categoryId: categories.id,
      createdAt: categories.createdAt,
      language: categoryTranslations.language,
      name: categoryTranslations.name,
      slug: categoryTranslations.slug,
    })
    .from(categories)
    .innerJoin(categoryTranslations, eq(categoryTranslations.categoryId, categories.id))
    .orderBy(asc(categories.createdAt));

  const groups = new Map<string, Group>();
  for (const row of rows) {
    if (!groups.has(row.categoryId)) {
      groups.set(row.categoryId, { id: row.categoryId, current: {}, proposed: {} });
    }
    const bucket = groups.get(row.categoryId)!;
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
      const natural = generateCategorySeoSlug({ categoryName: current.name, language: locale });
      const differentiated = differentiateFromCompetitor(natural, COMPETITOR_CATEGORY_SLUGS);
      group.proposed[locale] = ensureUniqueSlug(differentiated, usedByLanguage[locale], group.id);
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

  console.log("Category slug preview (name-based + competitor differentiation)\n");
  console.log(`Total categories: ${groups.size}`);
  console.log(`Categories with any changes: ${changedAny}`);
  console.log(
    `Changed by language: uz=${changedByLanguage.uz}, ru=${changedByLanguage.ru}, en=${changedByLanguage.en}\n`
  );
  console.log(lines.join("\n"));
}

main().catch((error) => {
  console.error("❌ Failed to generate category preview:", error);
  process.exit(1);
});
