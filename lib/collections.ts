import { promocodeTags, promocodeTranslations, promocodes, stores } from "@/lib/db";
import { activePromocodeConditions } from "@/lib/promocode-active";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const COLLECTION_KEYS = ["first-order", "repeat-order", "delivery"] as const;
export type CollectionKey = (typeof COLLECTION_KEYS)[number];
export const COLLECTION_MIN_OFFERS = 6;

export const COLLECTION_FAQS: Record<
  CollectionKey,
  Record<string, Array<{ question: string; answer: string }>>
> = {
  "first-order": {
    uz: [
      {
        question: "Bu takliflar kimga mos?",
        answer:
          "Ular yangi mijozlar va birinchi buyurtma sharti bo‘lgan takliflar uchun tanlangan.",
      },
    ],
    ru: [
      {
        question: "Кому подходят эти предложения?",
        answer: "Они подобраны для новых клиентов и первых заказов.",
      },
    ],
    en: [
      {
        question: "Who are these offers for?",
        answer: "They are selected for new customers and first-order conditions.",
      },
    ],
  },
  "repeat-order": {
    uz: [
      {
        question: "Taklifni ishlatishdan oldin nimani tekshirish kerak?",
        answer: "Savatchadagi minimal summa va amal muddatini tekshiring.",
      },
    ],
    ru: [
      {
        question: "Что проверить перед использованием?",
        answer: "Проверьте минимальную сумму заказа и срок действия.",
      },
    ],
    en: [
      {
        question: "What should I check first?",
        answer: "Check the minimum order and expiry date before using an offer.",
      },
    ],
  },
  delivery: {
    uz: [
      {
        question: "Yetkazib berish aksiyasi hamma hududda ishlaydimi?",
        answer: "Yo‘q. Hudud, savat summasi va ilova shartlarini promokod sahifasida tekshiring.",
      },
    ],
    ru: [
      {
        question: "Работает ли акция на доставку во всех регионах?",
        answer: "Нет. Проверьте регион, сумму корзины и условия приложения на странице промокода.",
      },
    ],
    en: [
      {
        question: "Does a delivery deal work in every region?",
        answer: "No. Check region, basket amount, and app conditions on the promocode page.",
      },
    ],
  },
};

export function isCollectionKey(key: string): key is CollectionKey {
  return (COLLECTION_KEYS as readonly string[]).includes(key);
}

export function activeCollectionConditions(locale: "uz" | "ru" | "en", key: CollectionKey) {
  const now = new Date();
  return and(
    eq(promocodeTags.tagKey, key),
    eq(promocodeTranslations.language, locale),
    activePromocodeConditions(now),
    orPublished()
  );
}

function orPublished() {
  // Keep query shape explicit: collection eligibility does not depend on publication date.
  return sql`TRUE`;
}

export async function getCollectionOfferCount(locale: "uz" | "ru" | "en", key: CollectionKey) {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(promocodeTags)
    .innerJoin(promocodes, eq(promocodeTags.promocodeId, promocodes.id))
    .leftJoin(stores, eq(promocodes.storeId, stores.id))
    .innerJoin(promocodeTranslations, eq(promocodeTranslations.promocodeId, promocodes.id))
    .where(activeCollectionConditions(locale, key));
  return row?.count ?? 0;
}

export async function getIndexableCollections(locale: "uz" | "ru" | "en") {
  const counts = await Promise.all(
    COLLECTION_KEYS.map(async (key) => [key, await getCollectionOfferCount(locale, key)] as const)
  );
  return counts.filter(([, count]) => count >= COLLECTION_MIN_OFFERS).map(([key]) => key);
}
