import "dotenv/config";

import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db";
import { promocodes, promocodeTranslations, stores, storeTranslations } from "../../db/schema";
import { ensureUniqueSlug, generatePromocodeSeoSlug } from "../../lib/slug-seo";

const LOCALES = ["uz", "ru", "en"] as const;
type Locale = (typeof LOCALES)[number];

type LocaleRow = {
  title: string;
  slug: string;
  storeName: string | null;
};

type Group = {
  id: string;
  code: string | null;
  discountPercent: number | null;
  current: Partial<Record<Locale, LocaleRow>>;
  proposed: Partial<Record<Locale, string>>;
};

function shortId(id: string): string {
  return id.replaceAll("-", "").slice(0, 8);
}

async function main() {
  const rows = await db
    .select({
      promocodeId: promocodes.id,
      code: promocodes.code,
      discountPercent: promocodes.discountValue,
      createdAt: promocodes.createdAt,
      language: promocodeTranslations.language,
      title: promocodeTranslations.title,
      slug: promocodeTranslations.slug,
      storeName: storeTranslations.name,
    })
    .from(promocodes)
    .innerJoin(promocodeTranslations, eq(promocodeTranslations.promocodeId, promocodes.id))
    .leftJoin(stores, eq(stores.id, promocodes.storeId))
    .leftJoin(
      storeTranslations,
      and(
        eq(storeTranslations.storeId, stores.id),
        eq(storeTranslations.language, promocodeTranslations.language)
      )
    )
    .orderBy(asc(promocodes.createdAt));

  const groups = new Map<string, Group>();
  for (const row of rows) {
    if (!groups.has(row.promocodeId)) {
      groups.set(row.promocodeId, {
        id: row.promocodeId,
        code: row.code,
        discountPercent: row.discountPercent,
        current: {},
        proposed: {},
      });
    }
    const bucket = groups.get(row.promocodeId)!;
    bucket.current[row.language as Locale] = {
      title: row.title,
      slug: row.slug,
      storeName: row.storeName,
    };
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

      const natural = generatePromocodeSeoSlug({
        storeName: current.storeName || current.title.split(" ")[0] || "offer",
        title: current.title,
        code: group.code,
        discountPercent: group.discountPercent,
        language: locale,
      });
      group.proposed[locale] = ensureUniqueSlug(natural, usedByLanguage[locale], group.id);
    }
  }

  const lines: string[] = [];
  lines.push("ID\tCODE\tUZ(current=>proposed)\tRU(current=>proposed)\tEN(current=>proposed)");

  let changedAny = 0;
  const changedByLanguage: Record<Locale, number> = { uz: 0, ru: 0, en: 0 };

  for (const group of groups.values()) {
    const rowParts = [shortId(group.id), group.code ?? ""];
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

  console.log("Promocode slug preview (store + benefit, code-stripped)\n");
  console.log(`Total promocodes: ${groups.size}`);
  console.log(`Promocodes with any changes: ${changedAny}`);
  console.log(
    `Changed by language: uz=${changedByLanguage.uz}, ru=${changedByLanguage.ru}, en=${changedByLanguage.en}\n`
  );
  console.log(lines.join("\n"));
}

main().catch((error) => {
  console.error("❌ Failed to generate promocode preview:", error);
  process.exit(1);
});
