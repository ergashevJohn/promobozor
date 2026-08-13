export type BlogLocale = "uz" | "ru" | "en";

export type BlogPost = {
  slug: string;
  publishedAt: string;
  updatedAt: string;
  relatedStoreSlug?: string;
  relatedBrandSlug?: string;
  title: Record<BlogLocale, string>;
  description: Record<BlogLocale, string>;
  body: Record<BlogLocale, string[]>;
};

/**
 * Editorial SEO guides targeting competitor long-tail queries.
 * Keep body paragraphs as plain text arrays for simple rendering.
 */
export const blogPosts: BlogPost[] = [
  {
    slug: "yandex-eats-promokod-2026",
    publishedAt: "2026-08-01",
    updatedAt: "2026-08-11",
    relatedBrandSlug: "yandex-eats",
    title: {
      uz: "Yandex Eats promokod 2026: birinchi buyurtmaga qanday tejash mumkin",
      ru: "Промокод Yandex Eats 2026: как сэкономить на первом заказе",
      en: "Yandex Eats promocode 2026: how to save on your first order",
    },
    description: {
      uz: "Yandex Eats promokodlarini qanday topish, nusxalash va checkout’da qo‘llash. Amal qilish muddati, minimal summa va tekshirilgan takliflar.",
      ru: "Как найти и применить промокоды Yandex Eats: срок действия, минимальная сумма и проверенные предложения.",
      en: "How to find and apply Yandex Eats promocodes: expiry, minimum order rules, and verified deals.",
    },
    body: {
      uz: [
        "Yandex Eats (Yandex Go ichidagi Eats) O‘zbekistonda yetkazib berish uchun eng ko‘p qidiriladigan promokod yo‘nalishlaridan biri.",
        "PromoBozor’da faqat tekshirilgan takliflar chiqadi: kodni nusxalang, ilovada savatni to‘ldiring va to‘lovdan oldin promo maydonga qo‘ying.",
        "Ko‘p kodlar birinchi buyurtma yoki minimal savat shartiga bog‘liq. Har bir kartochkadagi shartlar va tugash sanasini o‘qing.",
        "Yangi kodlar uchun Yandex Eats brend sahifasini kuzating va muddati o‘tgan takliflarni ishlatmang.",
      ],
      ru: [
        "Yandex Eats — одно из самых популярных направлений промокодов в Узбекистане.",
        "На PromoBozor публикуются проверенные предложения: скопируйте код, соберите корзину в приложении и вставьте промокод до оплаты.",
        "Многие коды действуют на первый заказ или от минимальной суммы. Всегда читайте условия на карточке.",
        "Следите за страницей бренда Yandex Eats, чтобы не использовать устаревшие коды.",
      ],
      en: [
        "Yandex Eats is one of the most searched promocode topics in Uzbekistan.",
        "On PromoBozor we list verified deals: copy the code, build your cart in the app, and paste it before checkout.",
        "Many codes require a first order or a minimum basket. Always read the conditions on the card.",
        "Follow the Yandex Eats brand page so you do not reuse expired offers.",
      ],
    },
  },
  {
    slug: "uzum-market-promokod-qollanma",
    publishedAt: "2026-08-05",
    updatedAt: "2026-08-11",
    relatedStoreSlug: "uzum-market",
    title: {
      uz: "Uzum Market promokod: checkout’da to‘g‘ri qo‘llash qo‘llanmasi",
      ru: "Промокод Uzum Market: инструкция по применению на checkout",
      en: "Uzum Market promocode: checkout application guide",
    },
    description: {
      uz: "Uzum Market promokodlarini qayerdan olish, qachon ishlashi va nima uchun ba’zi kodlar rad etilishi mumkinligi haqida qisqa qo‘llanma.",
      ru: "Краткая инструкция: где брать промокоды Uzum Market, когда они работают и почему код могут отклонить.",
      en: "A short guide to Uzum Market promocodes: where to get them, when they work, and why codes get rejected.",
    },
    body: {
      uz: [
        "Uzum Market aksiyalari tez yangilanadi. Shuning uchun kodni ishlatishdan oldin amal qilish muddati va kategoriya cheklovini tekshiring.",
        "PromoBozor store sahifasidagi aktiv takliflardan birini tanlang, kodni nusxalang va to‘lov sahifasidagi promo maydonga joylashtiring.",
        "Agar kod ishlamasa: minimal summa, birinchi xarid sharti yoki muddat tugagan bo‘lishi mumkin. Bizga xabar bering — listingni yangilaymiz.",
      ],
      ru: [
        "Акции Uzum Market обновляются часто. Перед использованием проверьте срок и ограничения по категориям.",
        "Выберите активное предложение на странице магазина PromoBozor, скопируйте код и вставьте его в поле промокода.",
        "Если код не сработал: возможны минимальная сумма, условие первого заказа или истекший срок. Сообщите нам — мы обновим листинг.",
      ],
      en: [
        "Uzum Market deals change quickly. Check expiry and category limits before you apply a code.",
        "Pick an active offer on the PromoBozor store page, copy it, and paste it into the promo field at checkout.",
        "If a code fails, it may need a minimum spend, first-order eligibility, or it may have expired. Tell us and we will refresh the listing.",
      ],
    },
  },
  {
    slug: "promokod-qanday-ishlatiladi",
    publishedAt: "2026-07-20",
    updatedAt: "2026-08-11",
    title: {
      uz: "Promokod qanday ishlatiladi: 4 qadamda tejash",
      ru: "Как использовать промокод: экономия за 4 шага",
      en: "How to use a promocode: save in 4 steps",
    },
    description: {
      uz: "O‘zbekiston do‘konlarida promokodni topish, nusxalash va to‘lovda qo‘llashning oddiy tartibi.",
      ru: "Простой порядок: найти, скопировать и применить промокод в магазинах Узбекистана.",
      en: "A simple flow to find, copy, and apply promocodes at Uzbekistan checkouts.",
    },
    body: {
      uz: [
        "1) Do‘kon yoki brend sahifasidan aktiv taklifni tanlang.",
        "2) «Nusxalash» tugmasi bilan kodni oling.",
        "3) Do‘kon ilovasi yoki saytiga o‘ting va savatni to‘ldiring.",
        "4) To‘lovdan oldin promo maydonga kodni qo‘ying va chegirmani tasdiqlang.",
        "PromoBozor har bir listingni manba va muddat bo‘yicha tekshiradi; ishlamagan kodlarni tez yangilaydi.",
      ],
      ru: [
        "1) Выберите активное предложение на странице магазина или бренда.",
        "2) Нажмите «Копировать».",
        "3) Откройте сайт или приложение магазина и соберите корзину.",
        "4) Вставьте код в поле промокода до оплаты.",
        "PromoBozor проверяет источники и сроки, а неработающие коды обновляет быстро.",
      ],
      en: [
        "1) Choose an active offer on a store or brand page.",
        "2) Tap Copy.",
        "3) Open the merchant app or site and build your cart.",
        "4) Paste the code into the promo field before paying.",
        "PromoBozor verifies sources and expiry dates, and refreshes broken codes quickly.",
      ],
    },
  },
  {
    slug: "click-va-payme-promokod",
    publishedAt: "2026-08-08",
    updatedAt: "2026-08-11",
    relatedBrandSlug: "click",
    title: {
      uz: "Click va Payme promokod: to‘lov ilovalarida qanday tejash mumkin",
      ru: "Промокоды Click и Payme: как экономить в платёжных приложениях",
      en: "Click and Payme promocodes: how to save in payment apps",
    },
    description: {
      uz: "Click va Payme aksiyalarini qanday topish, shartlarini o‘qish va ilovada to‘g‘ri faollashtirish bo‘yicha qisqa qo‘llanma.",
      ru: "Краткий гайд: как находить акции Click и Payme, читать условия и правильно активировать их в приложении.",
      en: "A short guide to finding Click and Payme deals, reading the rules, and activating them correctly in-app.",
    },
    body: {
      uz: [
        "To‘lov ilovalari aksiyalari ko‘pincha cashback, komissiya chegirmasi yoki hamkor do‘kon bonusiga bog‘liq.",
        "PromoBozor’da Click va Payme brend hublaridan tekshirilgan taklifni oching, shartlarni o‘qing va faqat amal qilish muddati ichida faollashtiring.",
        "Agar kod ishlamasa, xizmat turi yoki mijoz segmenti mos kelmasligi mumkin — listingni yangilash uchun bizga yozing.",
      ],
      ru: [
        "Акции платёжных приложений часто связаны с кэшбэком, скидкой на комиссию или бонусом партнёра.",
        "Откройте проверенное предложение в хабах Click или Payme на PromoBozor, прочитайте условия и активируйте только в срок действия.",
        "Если код не сработал, возможно не подходит тип услуги или сегмент клиента — напишите нам для обновления.",
      ],
      en: [
        "Payment-app campaigns often involve cashback, fee discounts, or partner-store bonuses.",
        "Open a verified Click or Payme hub offer on PromoBozor, read the conditions, and activate only while it is valid.",
        "If a code fails, the service type or customer segment may not match — tell us so we can refresh the listing.",
      ],
    },
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
