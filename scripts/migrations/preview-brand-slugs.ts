import "dotenv/config";

import { asc, eq } from "drizzle-orm";
import { db } from "../../db";
import { brands, brandTranslations } from "../../db/schema";
import { generateSlug } from "../../lib/slug";

const LOCALES = ["uz", "ru", "en"] as const;
type Locale = (typeof LOCALES)[number];

type BrandLocaleRow = {
  name: string;
  slug: string;
};

type BrandGroup = {
  id: string;
  current: Partial<Record<Locale, BrandLocaleRow>>;
  proposed: Partial<Record<Locale, string>>;
};

function shortId(id: string): string {
  return id.replaceAll("-", "").slice(0, 8);
}

function uniqueWithinLanguage(
  lang: Locale,
  baseSlug: string,
  brandId: string,
  used: Record<Locale, Map<string, string>>
): string {
  const initial = baseSlug || `brand-${shortId(brandId)}`;
  let candidate = initial;
  let seq = 1;

  while (true) {
    const existingOwner = used[lang].get(candidate);
    if (!existingOwner || existingOwner === brandId) {
      break;
    }
    seq += 1;
    const suffix = `-${shortId(brandId)}-${seq}`;
    const truncatedBase = initial.slice(0, Math.max(1, 100 - suffix.length));
    candidate = `${truncatedBase}${suffix}`;
  }

  used[lang].set(candidate, brandId);
  return candidate;
}

async function main() {
  const rows = await db
    .select({
      brandId: brands.id,
      createdAt: brands.createdAt,
      language: brandTranslations.language,
      name: brandTranslations.name,
      slug: brandTranslations.slug,
    })
    .from(brands)
    .innerJoin(brandTranslations, eq(brandTranslations.brandId, brands.id))
    .orderBy(asc(brands.createdAt));

  const groups = new Map<string, BrandGroup>();
  for (const row of rows) {
    if (!groups.has(row.brandId)) {
      groups.set(row.brandId, {
        id: row.brandId,
        current: {},
        proposed: {},
      });
    }
    const bucket = groups.get(row.brandId)!;
    bucket.current[row.language as Locale] = {
      name: row.name,
      slug: row.slug,
    };
  }

  const usedByLanguage: Record<Locale, Map<string, string>> = {
    uz: new Map(),
    ru: new Map(),
    en: new Map(),
  };

  for (const brand of groups.values()) {
    for (const locale of LOCALES) {
      const current = brand.current[locale];
      if (!current) {
        continue;
      }

      // Natural SEO: language variants may naturally match; we only ensure
      // uniqueness inside the same language (DB constraint).
      const natural = generateSlug(current.name);
      brand.proposed[locale] = uniqueWithinLanguage(locale, natural, brand.id, usedByLanguage);
    }
  }

  const lines: string[] = [];
  lines.push("ID\tUZ(current=>proposed)\tRU(current=>proposed)\tEN(current=>proposed)");

  let changedAny = 0;
  const changedByLanguage: Record<Locale, number> = { uz: 0, ru: 0, en: 0 };

  for (const brand of groups.values()) {
    const rowParts = [shortId(brand.id)];

    let hasChange = false;
    for (const locale of LOCALES) {
      const current = brand.current[locale];
      const proposed = brand.proposed[locale];
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

    if (hasChange) {
      changedAny += 1;
    }
    lines.push(rowParts.join("\t"));
  }

  console.log("Brand slug preview (Natural SEO rule)\n");
  console.log(`Total brands: ${groups.size}`);
  console.log(`Brands with any changes: ${changedAny}`);
  console.log(
    `Changed by language: uz=${changedByLanguage.uz}, ru=${changedByLanguage.ru}, en=${changedByLanguage.en}\n`
  );
  console.log(lines.join("\n"));
}

main().catch((error) => {
  console.error("❌ Failed to generate brand preview:", error);
  process.exit(1);
});
