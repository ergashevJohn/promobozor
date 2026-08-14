import "dotenv/config";

import { and, eq, inArray, or } from "drizzle-orm";
import type { FaqJsonItem } from "../../db/schema";
import { getEntityFaqItems } from "../../lib/entity-faq";
import { listHubEditorialTargets, type HubLocale } from "../../lib/hub-editorial";
import { activePromocodeStatusConditions } from "../../lib/promocode-active";
import { isThinEntityBody } from "../../lib/seo/content-rewrite";

function escapeHtml(text: string): string {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function metaTitleFor(
  name: string,
  language: HubLocale,
  kind: "store" | "brand" | "category"
): string {
  if (kind === "category") {
    switch (language) {
      case "uz":
        return `${name} chegirmalari va promokodlari — O‘zbekiston`;
      case "ru":
        return `Скидки и промокоды: ${name}`;
      case "en":
        return `${name} Deals & Promo Codes — Uzbekistan`;
      default: {
        const _exhaustive: never = language;
        return _exhaustive;
      }
    }
  }

  switch (language) {
    case "uz":
      return `${name} promokodlari — faol chegirma va kuponlar`;
    case "ru":
      return `Промокоды ${name} — купоны и скидки`;
    case "en":
      return `${name} Promo Codes & Coupons — Verified Deals`;
    default: {
      const _exhaustive: never = language;
      return _exhaustive;
    }
  }
}

function shortSummaryFor(text: string): string {
  const plain = text.replace(/\s+/g, " ").trim();
  if (plain.length <= 180) return plain;
  return `${plain.slice(0, 177).trim()}...`;
}

function faqFor(name: string, language: HubLocale): FaqJsonItem[] {
  const items = getEntityFaqItems(name, language);
  const unique: FaqJsonItem =
    language === "uz"
      ? {
          question: `${name} takliflari qachon yangilanadi?`,
          answer: `${name} bo‘yicha yangi kodlar muntazam qo‘shiladi; muddati o‘tganlar olib tashlanadi. Oxirgi ko‘rib chiqish sanasi sahifada ko‘rsatiladi.`,
        }
      : language === "ru"
        ? {
            question: `Как часто обновляются предложения ${name}?`,
            answer: `Мы регулярно добавляем новые коды ${name} и удаляем истёкшие. Дата последней проверки указана на странице.`,
          }
        : {
            question: `How often are ${name} offers updated?`,
            answer: `We regularly add fresh ${name} codes and remove expired ones. The last reviewed date is shown on the page.`,
          };
  return [...items.slice(0, 3), unique];
}

function promoHowToHtml(language: HubLocale, storeName: string): string {
  if (language === "uz") {
    return `<ol><li>Taklifni oching va kodni nusxalang.</li><li>${escapeHtml(storeName)} savatini to‘ldiring.</li><li>To‘lovdan oldin promo maydonga kodni kiriting.</li><li>Chegirma qo‘llanganini tekshiring.</li></ol>`;
  }
  if (language === "ru") {
    return `<ol><li>Откройте предложение и скопируйте код.</li><li>Соберите корзину в ${escapeHtml(storeName)}.</li><li>Вставьте промокод до оплаты.</li><li>Проверьте, что скидка применилась.</li></ol>`;
  }
  return `<ol><li>Open the offer and copy the code.</li><li>Build your cart at ${escapeHtml(storeName)}.</li><li>Paste the code before checkout.</li><li>Confirm the discount applied.</li></ol>`;
}

function promoMetaTitle(title: string, storeName: string, language: HubLocale): string {
  switch (language) {
    case "uz":
      return `${title} — ${storeName} promokod`;
    case "ru":
      return `${title} — промокод ${storeName}`;
    case "en":
      return `${title} — ${storeName} promo code`;
    default: {
      const _exhaustive: never = language;
      return _exhaustive;
    }
  }
}

/**
 * Tier-1 enrichment: hub store/brand SEO fields, linked active promocodes,
 * and active categories with thin body/meta (uz/ru/en).
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  // Reuse hub upsert first
  const { spawnSync } = await import("node:child_process");
  const hub = spawnSync("npx", ["tsx", "scripts/seo/upsert-hub-editorial.ts"], {
    stdio: "inherit",
    env: process.env,
  });
  if (hub.status !== 0) {
    process.exit(hub.status ?? 1);
  }

  const {
    db,
    brands,
    brandTranslations,
    stores,
    storeTranslations,
    categories,
    categoryTranslations,
    promocodes,
    promocodeTranslations,
  } = await import("../../lib/db");

  const now = new Date();
  const hubs = listHubEditorialTargets();
  const storeSlugs = hubs.filter((h) => h.kind === "store").map((h) => h.slug);
  const brandSlugs = hubs.filter((h) => h.kind === "brand").map((h) => h.slug);

  const storeRows =
    storeSlugs.length > 0
      ? await db
          .select({ id: stores.id })
          .from(storeTranslations)
          .innerJoin(stores, eq(storeTranslations.storeId, stores.id))
          .where(
            and(eq(storeTranslations.language, "uz"), inArray(storeTranslations.slug, storeSlugs))
          )
      : [];

  const brandRows =
    brandSlugs.length > 0
      ? await db
          .select({ id: brands.id })
          .from(brandTranslations)
          .innerJoin(brands, eq(brandTranslations.brandId, brands.id))
          .where(
            and(eq(brandTranslations.language, "uz"), inArray(brandTranslations.slug, brandSlugs))
          )
      : [];

  const storeIds = [...new Set(storeRows.map((r) => r.id))];
  const brandIds = [...new Set(brandRows.map((r) => r.id))];

  const promoFilters = [];
  if (storeIds.length > 0) promoFilters.push(inArray(promocodes.storeId, storeIds));
  if (brandIds.length > 0) promoFilters.push(inArray(promocodes.brandId, brandIds));

  let promoUpdated = 0;
  const promoRows =
    promoFilters.length === 0
      ? []
      : await db
          .select({
            id: promocodes.id,
          })
          .from(promocodes)
          .where(
            and(
              activePromocodeStatusConditions(now),
              promoFilters.length === 1 ? promoFilters[0]! : or(...promoFilters)
            )
          );

  for (const promo of promoRows) {
    const translations = await db
      .select({
        id: promocodeTranslations.id,
        language: promocodeTranslations.language,
        title: promocodeTranslations.title,
        shortDescription: promocodeTranslations.shortDescription,
        conditions: promocodeTranslations.conditions,
        howToHtml: promocodeTranslations.howToHtml,
        metaTitle: promocodeTranslations.metaTitle,
        metaDescription: promocodeTranslations.metaDescription,
        editorVerdict: promocodeTranslations.editorVerdict,
      })
      .from(promocodeTranslations)
      .where(eq(promocodeTranslations.promocodeId, promo.id));

    const storeNameRows = await db
      .select({ language: storeTranslations.language, name: storeTranslations.name })
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .leftJoin(storeTranslations, eq(storeTranslations.storeId, stores.id))
      .where(eq(promocodes.id, promo.id));
    const storeNamesByLocale = new Map(
      storeNameRows
        .filter((row): row is { language: HubLocale; name: string } =>
          Boolean(row.language && row.name)
        )
        .map((row) => [row.language, row.name] as const)
    );

    for (const tr of translations) {
      const language = tr.language as HubLocale;
      const storeName =
        storeNamesByLocale.get(language) || storeNamesByLocale.get("uz") || "PromoBozor";
      const patch: Record<string, unknown> = { updatedAt: now };
      let changed = false;

      if (!tr.shortDescription?.trim() && tr.conditions?.trim()) {
        patch.shortDescription = shortSummaryFor(tr.conditions);
        changed = true;
      }
      if (!tr.howToHtml?.trim()) {
        patch.howToHtml = promoHowToHtml(language, storeName);
        changed = true;
      }
      if (!tr.metaTitle?.trim()) {
        patch.metaTitle = promoMetaTitle(tr.title, storeName, language).slice(0, 255);
        changed = true;
      }
      if (!tr.metaDescription?.trim()) {
        const base = tr.shortDescription || tr.conditions || tr.title;
        patch.metaDescription = shortSummaryFor(base).slice(0, 500);
        changed = true;
      }
      if (!tr.editorVerdict?.trim()) {
        patch.editorVerdict =
          language === "uz"
            ? "Jamoa shartlar va muddatni ko‘rib chiqdi; foydalanishdan oldin kartochkani tekshiring."
            : language === "ru"
              ? "Редакция проверила условия и срок — перед использованием сверьте карточку."
              : "Editorial team reviewed terms and expiry — confirm the card before checkout.";
        changed = true;
      }

      if (changed) {
        await db
          .update(promocodeTranslations)
          .set(patch)
          .where(eq(promocodeTranslations.id, tr.id));
        promoUpdated += 1;
      }
    }
  }

  // Top categories: enrich thin locales
  const categoryRows = await db
    .select({
      categoryId: categories.id,
      language: categoryTranslations.language,
      translationId: categoryTranslations.id,
      name: categoryTranslations.name,
      description: categoryTranslations.description,
      bodyHtml: categoryTranslations.bodyHtml,
      shortSummary: categoryTranslations.shortSummary,
      metaTitle: categoryTranslations.metaTitle,
      metaDescription: categoryTranslations.metaDescription,
      faqJson: categoryTranslations.faqJson,
    })
    .from(categories)
    .innerJoin(categoryTranslations, eq(categoryTranslations.categoryId, categories.id))
    .where(eq(categories.isActive, true));

  let categoryUpdated = 0;
  const byCategory = new Map<string, typeof categoryRows>();
  for (const row of categoryRows) {
    const list = byCategory.get(row.categoryId) || [];
    list.push(row);
    byCategory.set(row.categoryId, list);
  }

  // Prioritize categories that already have at least one non-empty description
  const prioritized = [...byCategory.entries()]
    .filter(([, locales]) => locales.some((l) => (l.description || "").trim().length >= 40))
    .slice(0, 30);

  for (const [categoryId, locales] of prioritized) {
    let categoryChanged = false;

    for (const tr of locales) {
      const language = tr.language as HubLocale;
      const source =
        tr.description?.trim() ||
        `${tr.name} kategoriyasidagi tekshirilgan promokodlar va chegirmalar PromoBozor’da.`;
      const patch: Record<string, unknown> = { updatedAt: now };
      let changed = false;

      if (isThinEntityBody("category", tr.bodyHtml, tr.description)) {
        patch.bodyHtml = `<p>${escapeHtml(source)}</p>`;
        changed = true;
      }
      if (!tr.shortSummary?.trim()) {
        patch.shortSummary = shortSummaryFor(source);
        changed = true;
      }
      if (!tr.metaTitle?.trim()) {
        patch.metaTitle = metaTitleFor(tr.name, language, "category");
        changed = true;
      }
      if (!tr.metaDescription?.trim()) {
        patch.metaDescription = shortSummaryFor(source).slice(0, 500);
        changed = true;
      }
      if (!tr.faqJson || !Array.isArray(tr.faqJson) || tr.faqJson.length === 0) {
        patch.faqJson = faqFor(tr.name, language);
        changed = true;
      }

      if (changed) {
        await db
          .update(categoryTranslations)
          .set(patch)
          .where(eq(categoryTranslations.id, tr.translationId));
        categoryUpdated += 1;
        categoryChanged = true;
      }
    }

    if (categoryChanged) {
      await db
        .update(categories)
        .set({ lastReviewedAt: now, updatedAt: now })
        .where(eq(categories.id, categoryId));
    }
  }

  console.log(`Tier-1 promocode locales updated: ${promoUpdated}`);
  console.log(`Tier-1 category locales updated: ${categoryUpdated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
