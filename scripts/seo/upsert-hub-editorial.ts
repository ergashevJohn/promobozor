import "dotenv/config";

import { and, eq } from "drizzle-orm";
import type { FaqJsonItem } from "../../db/schema";
import { getEntityFaqItems } from "../../lib/entity-faq";
import { listHubEditorialTargets, type HubLocale } from "../../lib/hub-editorial";
import { isThinEntityBody } from "../../lib/seo/content-rewrite";
import { getSiteVoice } from "../../lib/seo/site-voice";

function metaTitleFor(name: string, language: HubLocale): string {
  switch (language) {
    case "uz":
      return `${name} promokodlari — solishtirish va shartlar`;
    case "ru":
      return `Промокоды ${name} — сравнение и условия`;
    case "en":
      return `${name} Promo Codes — Compare Verified Deals`;
    default: {
      const _exhaustive: never = language;
      return _exhaustive;
    }
  }
}

function shortSummaryFor(description: string): string {
  const plain = description.replace(/\s+/g, " ").trim();
  if (plain.length <= 180) return plain;
  return `${plain.slice(0, 177).trim()}...`;
}

function bodyHtmlFor(description: string, language: HubLocale): string {
  const voice = getSiteVoice("promobozor-editorial");
  return `<p>${description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><p>${voice.framing[language].replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
}

function faqFor(name: string, language: HubLocale): FaqJsonItem[] {
  const voice = getSiteVoice("promobozor-editorial");
  const items = getEntityFaqItems(name, language);
  const unique: FaqJsonItem = {
    question: voice.uniqueFaq[language].question(name),
    answer: voice.uniqueFaq[language].answer(name),
  };
  return [...items.slice(0, 3), unique];
}

/**
 * Upsert unique hub descriptions for top store/brand targets into SEO content fields.
 * Does NOT invent promocodes — only editorial entity + translation copy.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const { db, brands, brandTranslations, stores, storeTranslations } = await import("../../lib/db");
  const hubs = listHubEditorialTargets();
  let updated = 0;
  let created = 0;
  const now = new Date();

  for (const hub of hubs) {
    if (hub.kind === "brand") {
      const [existing] = await db
        .select({
          brandId: brands.id,
        })
        .from(brandTranslations)
        .innerJoin(brands, eq(brandTranslations.brandId, brands.id))
        .where(and(eq(brandTranslations.slug, hub.slug), eq(brandTranslations.language, "uz")))
        .limit(1);

      let brandId = existing?.brandId;
      if (!brandId) {
        const [inserted] = await db
          .insert(brands)
          .values({
            isActive: true,
            imageUrl: null,
            websiteUrl: null,
            lastReviewedAt: now,
          })
          .returning({ id: brands.id });
        brandId = inserted.id;
        created += 1;
        console.log(`Created brand ${hub.slug}`);
      }

      let brandTouched = !existing?.brandId;
      for (const language of ["uz", "ru", "en"] as const) {
        const [tr] = await db
          .select({
            id: brandTranslations.id,
            description: brandTranslations.description,
            bodyHtml: brandTranslations.bodyHtml,
            metaTitle: brandTranslations.metaTitle,
            faqJson: brandTranslations.faqJson,
          })
          .from(brandTranslations)
          .where(
            and(eq(brandTranslations.brandId, brandId), eq(brandTranslations.language, language))
          )
          .limit(1);

        const description = hub.description[language];
        const name = hub.name[language];
        const payload = {
          name,
          description,
          shortSummary: shortSummaryFor(description),
          bodyHtml: bodyHtmlFor(description, language),
          faqJson: faqFor(name, language),
          metaTitle: metaTitleFor(name, language),
          metaDescription: description.slice(0, 155),
          updatedAt: now,
        };

        if (tr) {
          const patch: Record<string, unknown> = { updatedAt: now };
          let changed = false;
          if (isThinEntityBody("brand", tr.bodyHtml, tr.description)) {
            patch.description = payload.description;
            patch.shortSummary = payload.shortSummary;
            patch.bodyHtml = payload.bodyHtml;
            changed = true;
          }
          if (!tr.metaTitle) {
            patch.metaTitle = payload.metaTitle;
            patch.metaDescription = payload.metaDescription;
            changed = true;
          }
          if (!tr.faqJson || !Array.isArray(tr.faqJson) || tr.faqJson.length === 0) {
            patch.faqJson = payload.faqJson;
            changed = true;
          }
          if (changed) {
            await db.update(brandTranslations).set(patch).where(eq(brandTranslations.id, tr.id));
            updated += 1;
            brandTouched = true;
          }
        } else {
          await db.insert(brandTranslations).values({
            brandId,
            language,
            slug: hub.slug,
            ...payload,
          });
          created += 1;
          brandTouched = true;
        }
      }

      if (brandTouched) {
        await db
          .update(brands)
          .set({ lastReviewedAt: now, updatedAt: now })
          .where(eq(brands.id, brandId));
      }
    } else {
      const [existing] = await db
        .select({
          storeId: stores.id,
        })
        .from(storeTranslations)
        .innerJoin(stores, eq(storeTranslations.storeId, stores.id))
        .where(and(eq(storeTranslations.slug, hub.slug), eq(storeTranslations.language, "uz")))
        .limit(1);

      let storeId = existing?.storeId;
      if (!storeId) {
        const [inserted] = await db
          .insert(stores)
          .values({
            isActive: true,
            logoUrl: null,
            websiteUrl: null,
            lastReviewedAt: now,
          })
          .returning({ id: stores.id });
        storeId = inserted.id;
        created += 1;
        console.log(`Created store ${hub.slug}`);
      }

      let storeTouched = !existing?.storeId;
      for (const language of ["uz", "ru", "en"] as const) {
        const [tr] = await db
          .select({
            id: storeTranslations.id,
            description: storeTranslations.description,
            bodyHtml: storeTranslations.bodyHtml,
            metaTitle: storeTranslations.metaTitle,
            faqJson: storeTranslations.faqJson,
          })
          .from(storeTranslations)
          .where(
            and(eq(storeTranslations.storeId, storeId), eq(storeTranslations.language, language))
          )
          .limit(1);

        const description = hub.description[language];
        const name = hub.name[language];
        const payload = {
          name,
          description,
          shortSummary: shortSummaryFor(description),
          bodyHtml: bodyHtmlFor(description, language),
          faqJson: faqFor(name, language),
          metaTitle: metaTitleFor(name, language),
          metaDescription: description.slice(0, 155),
          updatedAt: now,
        };

        if (tr) {
          const patch: Record<string, unknown> = { updatedAt: now };
          let changed = false;
          if (isThinEntityBody("store", tr.bodyHtml, tr.description)) {
            patch.description = payload.description;
            patch.shortSummary = payload.shortSummary;
            patch.bodyHtml = payload.bodyHtml;
            changed = true;
          }
          if (!tr.metaTitle) {
            patch.metaTitle = payload.metaTitle;
            patch.metaDescription = payload.metaDescription;
            changed = true;
          }
          if (!tr.faqJson || !Array.isArray(tr.faqJson) || tr.faqJson.length === 0) {
            patch.faqJson = payload.faqJson;
            changed = true;
          }
          if (changed) {
            await db.update(storeTranslations).set(patch).where(eq(storeTranslations.id, tr.id));
            updated += 1;
            storeTouched = true;
          }
        } else {
          await db.insert(storeTranslations).values({
            storeId,
            language,
            slug: hub.slug,
            ...payload,
          });
          created += 1;
          storeTouched = true;
        }
      }

      if (storeTouched) {
        await db
          .update(stores)
          .set({ lastReviewedAt: now, updatedAt: now })
          .where(eq(stores.id, storeId));
      }
    }
  }

  console.log(`Done. created=${created} updated=${updated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
