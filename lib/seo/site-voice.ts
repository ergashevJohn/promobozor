import type { ContentLocale } from "@/lib/seo/content-rewrite";

export type SiteVoiceProfile = "promobozor-editorial";

export type SiteVoice = {
  profile: SiteVoiceProfile;
  brand: string;
  domain: string;
  /** Short positioning phrase used in body/FAQ */
  framing: Record<ContentLocale, string>;
  /** How offers are separated (code vs link) */
  offerSeparation: Record<ContentLocale, string>;
  /** Compare-before-use checklist intro */
  compareChecklistTitle: Record<ContentLocale, string>;
  /** Unique FAQ angle for hubs */
  uniqueFaq: Record<
    ContentLocale,
    {
      question: (entityName: string) => string;
      answer: (entityName: string) => string;
    }
  >;
  inventoryAnswer: Record<
    ContentLocale,
    {
      withOffers: (entityName: string, count: number) => string;
      withoutOffers: (entityName: string) => string;
    }
  >;
  socialNetworkDisclosure: Record<ContentLocale, string>;
};

const PROMOBOZOR_EDITORIAL: SiteVoice = {
  profile: "promobozor-editorial",
  brand: "PromoBozor",
  domain: "promobozor.uz",
  framing: {
    uz: "PromoBozor takliflarni solishtirish, shartlarni tushuntirish va tekshirilgan variantni tanlash uchun mo‘ljallangan.",
    ru: "PromoBozor помогает сравнивать предложения, разбирать условия и выбирать проверенный вариант.",
    en: "PromoBozor is built to compare offers, explain conditions, and help you pick a verified option.",
  },
  offerSeparation: {
    uz: "PromoBozor takliflarni kod yoki maxsus havola turiga ajratadi. Bu chegirma qanday olinishi, qaysi bosqichda faollashtirilishi va qo‘shimcha shart bor-yo‘qligini tez tushunishga yordam beradi.",
    ru: "PromoBozor разделяет предложения на промокоды и специальные ссылки. Так проще понять, нужно ли вводить код вручную, на каком этапе активировать скидку и какие ограничения проверить перед оплатой.",
    en: "PromoBozor separates manual promo codes from deal links. This makes it easier to see how a discount is activated, where it should appear, and which restrictions need checking before payment.",
  },
  compareChecklistTitle: {
    uz: "Tanlashdan oldin nimalarni solishtirish kerak?",
    ru: "Что сравнить перед выбором?",
    en: "What should you compare before choosing?",
  },
  uniqueFaq: {
    uz: {
      question: (entityName) => `${entityName} takliflarini PromoBozor’da qanday solishtiraman?`,
      answer: (entityName) =>
        `${entityName} kartochkalarida foyda, minimal summa, foydalanuvchi turi va muddat yonma-yon ko‘rsatiladi. Avval shartlarni solishtiring, keyin kod yoki havolani faollashtiring — shunda birinchi uchragan taklifga emas, mos variantga o‘tasiz.`,
    },
    ru: {
      question: (entityName) => `Как сравнить предложения ${entityName} на PromoBozor?`,
      answer: (entityName) =>
        `В карточках ${entityName} рядом указаны выгода, минимальная сумма, тип клиента и срок. Сначала сравните условия, затем активируйте код или ссылку — так вы выбираете подходящий вариант, а не первый попавшийся.`,
    },
    en: {
      question: (entityName) => `How do I compare ${entityName} offers on PromoBozor?`,
      answer: (entityName) =>
        `${entityName} cards list benefit, minimum spend, customer eligibility, and timing side by side. Compare those conditions first, then activate the code or link so you pick a fit — not just the first offer you see.`,
    },
  },
  inventoryAnswer: {
    uz: {
      withOffers: (entityName, count) =>
        `PromoBozor bazasida hozir ${entityName} bilan bog‘langan ${count} ta faol taklif ko‘rsatilgan. Son vaqt o‘tishi bilan o‘zgaradi: yangi takliflar qo‘shiladi, muddati o‘tganlari faol ro‘yxatdan olinadi.`,
      withoutOffers: (entityName) =>
        `Hozir ${entityName} uchun faol taklif ko‘rsatilmagan. Sahifa saqlanadi va yangi, tekshirilgan promokod paydo bo‘lganda yangilanadi.`,
    },
    ru: {
      withOffers: (entityName, count) =>
        `Сейчас в базе PromoBozor опубликовано ${count} активных предложений, связанных с ${entityName}. Количество меняется: новые акции добавляются после проверки, а завершённые перестают считаться действующими.`,
      withoutOffers: (entityName) =>
        `Сейчас активных предложений ${entityName} нет. Страница сохранена и будет обновлена, когда появится новый проверенный промокод.`,
    },
    en: {
      withOffers: (entityName, count) =>
        `PromoBozor currently lists ${count} active offers linked to ${entityName}. The number changes as new deals are checked and added, while ended promotions are removed from the active count.`,
      withoutOffers: (entityName) =>
        `There are no active ${entityName} offers right now. This page is retained and will be updated when a new verified promotion becomes available.`,
    },
  },
  socialNetworkDisclosure: {
    uz: "Telegram, Instagram va YouTube kanallari PromoBozor va Promokoduz loyihalari uchun umumiy network. Bu ikki alohida sayt — bitta domen emas.",
    ru: "Каналы Telegram, Instagram и YouTube — общая сеть для проектов PromoBozor и Promokoduz. Это два отдельных сайта, а не один домен.",
    en: "The Telegram, Instagram, and YouTube channels are a shared network for the PromoBozor and Promokoduz projects. They are two separate sites, not one domain.",
  },
};

const VOICES: Record<SiteVoiceProfile, SiteVoice> = {
  "promobozor-editorial": PROMOBOZOR_EDITORIAL,
};

export function getSiteVoice(profile: SiteVoiceProfile = "promobozor-editorial"): SiteVoice {
  return VOICES[profile];
}

export function resolveSiteVoiceProfile(value: string | undefined | null): SiteVoiceProfile {
  if (value === "promobozor-editorial") return value;
  return "promobozor-editorial";
}
