import "dotenv/config";

import { and, desc, eq, sql } from "drizzle-orm";
import { db, promocodeTranslations, promocodes, storeTranslations, stores, users } from "@/lib/db";

const PROMOCODE = "ADD76-JUFT26";
const CAMPAIGN_URL = "https://go.uzum.uz/l/cTnQsTTG";
const UZUM_MARKET_SLUG = "uzum-market-chegirmalar";
// The live column is `timestamp without time zone`, while the application reads
// it as an instant. This UTC value is 23:59:59.999 in Asia/Tashkent (UTC+5).
const EXPIRES_AT = sql`TIMESTAMP '2026-09-30 18:59:59.999'`;
const APPLY = process.argv.includes("--apply");

const translations = [
  {
    language: "uz" as const,
    title: "MOVI uchun 6 000 so'm chegirma",
    slug: "movi-uchun-6000-som-chegirma-add76",
    shortDescription:
      "Uzum Market'dagi MOVI do'konining barcha mahsulotlari uchun 6 000 so'm chegirma.",
    conditions:
      "ADD76-JUFT26 promokodini buyurtmani rasmiylashtirishda kiriting. Taklif 2026-yil 30-sentabrgacha amal qiladi.",
  },
  {
    language: "ru" as const,
    title: "Скидка 6 000 сум для MOVI",
    slug: "movi-skidka-6000-sum-add76",
    shortDescription: "Скидка 6 000 сум на все товары магазина MOVI в Uzum Market.",
    conditions:
      "Введите промокод ADD76-JUFT26 при оформлении заказа. Предложение действует до 30 сентября 2026 года.",
  },
  {
    language: "en" as const,
    title: "6,000 UZS off for MOVI",
    slug: "movi-6000-uzs-off-add76",
    shortDescription: "Get 6,000 UZS off all products from the MOVI store on Uzum Market.",
    conditions:
      "Enter promo code ADD76-JUFT26 at checkout. The offer is valid through September 30, 2026.",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!APPLY) {
    console.log(`Dry run: rerun with --apply to add ${PROMOCODE} to production.`);
    return;
  }

  const result = await db.transaction(async (tx) => {
    const [store] = await tx
      .select({ id: stores.id })
      .from(stores)
      .innerJoin(storeTranslations, eq(storeTranslations.storeId, stores.id))
      .where(
        and(eq(storeTranslations.language, "uz"), eq(storeTranslations.slug, UZUM_MARKET_SLUG))
      )
      .limit(1);
    if (!store) throw new Error("Uzum Market store was not found");

    const [admin] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"))
      .orderBy(users.createdAt)
      .limit(1);
    if (!admin) throw new Error("An admin user is required to create the promocode");

    const slugConflicts = await tx
      .select({ slug: promocodeTranslations.slug, promocodeId: promocodeTranslations.promocodeId })
      .from(promocodeTranslations)
      .where(
        sql`${promocodeTranslations.slug} in (${sql.join(
          translations.map((translation) => sql`${translation.slug}`),
          sql`, `
        )})`
      );

    const [existing] = await tx
      .select({ id: promocodes.id, order: promocodes.order, publishedAt: promocodes.publishedAt })
      .from(promocodes)
      .where(eq(promocodes.code, PROMOCODE))
      .limit(1);

    if (slugConflicts.some((conflict) => conflict.promocodeId !== existing?.id)) {
      throw new Error("One of the MOVI promocode slugs is already in use");
    }

    const now = new Date();
    let promocodeId = existing?.id;
    if (existing) {
      await tx
        .update(promocodes)
        .set({
          type: "code",
          link: CAMPAIGN_URL,
          discountType: "amount",
          discountValue: 6000,
          currency: "UZS",
          storeId: store.id,
          status: "active",
          isFeatured: false,
          expiresAt: EXPIRES_AT,
          lastVerifiedAt: now,
          publishedAt: existing.publishedAt ?? now,
          updatedAt: now,
        })
        .where(eq(promocodes.id, existing.id));
    } else {
      const [lastPromocode] = await tx
        .select({ order: promocodes.order })
        .from(promocodes)
        .orderBy(desc(promocodes.order))
        .limit(1);
      const [created] = await tx
        .insert(promocodes)
        .values({
          type: "code",
          code: PROMOCODE,
          link: CAMPAIGN_URL,
          discountType: "amount",
          discountValue: 6000,
          currency: "UZS",
          storeId: store.id,
          status: "active",
          isFeatured: false,
          order: (lastPromocode?.order ?? 0) + 1,
          expiresAt: EXPIRES_AT,
          lastVerifiedAt: now,
          publishedAt: now,
          createdById: admin.id,
        })
        .returning({ id: promocodes.id });
      promocodeId = created.id;
    }

    if (!promocodeId) throw new Error("Failed to resolve MOVI promocode id");
    for (const translation of translations) {
      await tx
        .insert(promocodeTranslations)
        .values({ promocodeId, ...translation })
        .onConflictDoUpdate({
          target: [promocodeTranslations.promocodeId, promocodeTranslations.language],
          set: {
            title: translation.title,
            slug: translation.slug,
            shortDescription: translation.shortDescription,
            conditions: translation.conditions,
            updatedAt: now,
          },
        });
    }

    return { promocodeId, storeId: store.id };
  });

  const [verified] = await db
    .select({
      id: promocodes.id,
      code: promocodes.code,
      link: promocodes.link,
      discountValue: promocodes.discountValue,
      currency: promocodes.currency,
      storeId: promocodes.storeId,
      expiresAt: promocodes.expiresAt,
      status: promocodes.status,
    })
    .from(promocodes)
    .where(eq(promocodes.id, result.promocodeId))
    .limit(1);

  console.log(JSON.stringify(verified, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
