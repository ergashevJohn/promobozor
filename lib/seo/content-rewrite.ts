import type { FaqJsonItem } from "@/db/schema";
import { getSiteVoice, type SiteVoiceProfile } from "@/lib/seo/site-voice";

export type ContentLocale = "uz" | "ru" | "en";
export type EntityContentKind = "store" | "brand" | "category";

export type DealFact = {
  title: string;
  discountType: "percent" | "amount";
  discountValue: number;
  currency: "UZS" | "USD" | "EUR";
  type: "code" | "link";
  minOrderAmount: number | null;
  expiresAt: Date | null;
};

export type EntityRewriteInput = {
  kind: EntityContentKind;
  locale: ContentLocale;
  name: string;
  existingDescription: string | null;
  deals: DealFact[];
  profile?: SiteVoiceProfile;
};

export type EntityRewrite = {
  description: string;
  shortSummary: string;
  bodyHtml: string;
  faqJson: FaqJsonItem[];
  metaTitle: string;
  metaDescription: string;
};

export type PromocodeRewriteInput = {
  locale: ContentLocale;
  title: string;
  existingConditions: string | null;
  entityName: string;
  discountType: "percent" | "amount";
  discountValue: number;
  currency: "UZS" | "USD" | "EUR";
  type: "code" | "link";
  minOrderAmount: number | null;
  expiresAt: Date | null;
  profile?: SiteVoiceProfile;
};

export type PromocodeRewrite = {
  shortDescription: string;
  conditions: string;
  howToHtml: string;
  faqJson: FaqJsonItem[];
  editorVerdict: string;
  metaTitle: string;
  metaDescription: string;
};

const EMOJI_PATTERN = /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;

// Cache Intl formatters at module scope for better performance
const numberFormatterCache = new Map<string, Intl.NumberFormat>();
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getNumberFormatter(locale: ContentLocale): Intl.NumberFormat {
  const intlLocale = locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US";
  if (!numberFormatterCache.has(intlLocale)) {
    numberFormatterCache.set(
      intlLocale,
      new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 })
    );
  }
  return numberFormatterCache.get(intlLocale)!;
}

function getDateFormatter(locale: ContentLocale): Intl.DateTimeFormat {
  const intlLocale = locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US";
  if (!dateFormatterCache.has(intlLocale)) {
    dateFormatterCache.set(
      intlLocale,
      new Intl.DateTimeFormat(intlLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    );
  }
  return dateFormatterCache.get(intlLocale)!;
}

export const BODY_WORD_FLOOR: Record<EntityContentKind, number> = {
  store: 150,
  brand: 120,
  category: 150,
};

export const FAQ_ITEM_FLOOR = 3;

export function plainText(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(EMOJI_PATTERN, "")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(value: string | null | undefined): number {
  return plainText(value).split(/\s+/).filter(Boolean).length;
}

export function isThinEntityBody(
  kind: EntityContentKind,
  bodyHtml: string | null | undefined,
  description?: string | null
): boolean {
  return wordCount(bodyHtml || description) < BODY_WORD_FLOOR[kind];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(value: string, maxLength: number): string {
  const clean = plainText(value);
  if (clean.length <= maxLength) return clean;
  const candidate = clean.slice(0, maxLength - 1);
  const boundary = candidate.lastIndexOf(" ");
  return `${candidate.slice(0, boundary > maxLength * 0.7 ? boundary : undefined).trim()}…`;
}

function formatNumber(value: number, locale: ContentLocale): string {
  return getNumberFormatter(locale).format(value).replace(/\s/g, " ");
}

export function formatDiscount(
  input: Pick<DealFact, "discountType" | "discountValue" | "currency">,
  locale: ContentLocale
): string {
  if (input.discountValue <= 0) {
    return locale === "uz"
      ? "maxsus bonus"
      : locale === "ru"
        ? "специальный бонус"
        : "a special bonus";
  }
  if (input.discountType === "percent") return `${input.discountValue}%`;
  const amount = formatNumber(input.discountValue, locale);
  if (input.currency === "UZS") {
    return locale === "ru" ? `${amount} сум` : `${amount} UZS`;
  }
  return `${amount} ${input.currency}`;
}

function localizedDate(value: Date, locale: ContentLocale): string {
  return getDateFormatter(locale).format(value);
}

function entityFallback(kind: EntityContentKind, name: string, locale: ContentLocale): string {
  if (locale === "uz") {
    if (kind === "category") {
      return `${name} bo‘limida shu yo‘nalishga tegishli promokod, chegirma va bonus takliflari jamlanadi.`;
    }
    return `${name} sahifasida ushbu xizmat yoki do‘konga tegishli promokod va chegirmalar jamlanadi.`;
  }
  if (locale === "ru") {
    if (kind === "category") {
      return `В разделе «${name}» собраны промокоды, скидки и бонусные предложения по этому направлению.`;
    }
    return `На странице ${name} собраны промокоды и скидки этого сервиса или магазина.`;
  }
  if (kind === "category") {
    return `The ${name} section brings together promo codes, discounts, and bonuses in this category.`;
  }
  return `The ${name} page brings together promo codes and discounts for this service or store.`;
}

function dealNames(deals: DealFact[]): string {
  return deals
    .slice(0, 3)
    .map((deal) => plainText(deal.title))
    .filter(Boolean)
    .join("; ");
}

function entityMetaTitle(name: string, kind: EntityContentKind, locale: ContentLocale): string {
  if (locale === "uz") {
    return truncate(
      kind === "category"
        ? `${name}: promokod va chegirmalar`
        : `${name} promokodlari va chegirmalari`,
      60
    );
  }
  if (locale === "ru") {
    return truncate(
      kind === "category" ? `${name}: промокоды и скидки` : `Промокоды и скидки ${name}`,
      60
    );
  }
  return truncate(
    kind === "category" ? `${name} Promo Codes & Deals` : `${name} Promo Codes & Discounts`,
    60
  );
}

function buildEntityUz(
  input: EntityRewriteInput,
  intro: string,
  discountRange: string,
  names: string
): Pick<EntityRewrite, "bodyHtml" | "faqJson"> {
  const count = input.deals.length;
  const availability =
    count > 0
      ? `Hozir sahifada ${count} ta faol taklif bor. Takliflarda ${discountRange} ko‘rinishidagi foyda ko‘rsatilgan.`
      : "Hozir bu sahifada faol taklif yo‘q. Yangi promokod tasdiqlanganda ro‘yxat yangilanadi; muddati o‘tgan kod faol taklif sifatida ko‘rsatilmaydi.";
  const examples = names
    ? `<p><strong>Joriy takliflardan misollar:</strong> ${escapeHtml(names)}.</p>`
    : "";
  const voice = getSiteVoice(input.profile);
  const bodyHtml = [
    `<p>${escapeHtml(intro)}</p>`,
    `<p>${escapeHtml(voice.framing.uz)}</p>`,
    "<h2>Faol takliflar va ularning mazmuni</h2>",
    `<p>${escapeHtml(availability)} ${escapeHtml(voice.offerSeparation.uz)}</p>`,
    examples,
    `<h2>${escapeHtml(voice.compareChecklistTitle.uz)}</h2>`,
    "<ul><li>Taklif yangi yoki mavjud foydalanuvchilar uchun ekanini tekshiring.</li><li>Minimal buyurtma summasi, mahsulot toifasi va hududiy cheklovlarni o‘qing.</li><li>Chegirma savatda yoki to‘lov sahifasida qo‘llanganini yakuniy to‘lovdan oldin tasdiqlang.</li><li>Kod ishlamasa, yozilishidagi bo‘sh joylarni va amal qilish muddatini qayta tekshiring.</li><li>Bir nechta kartochkani yonma-yon solishtirib, mos shartli variantni tanlang.</li></ul>",
    `<h2>${escapeHtml(input.name)} takliflaridan foydalanish</h2>`,
    `<p>Kodli taklifda promokodni nusxalab, ${escapeHtml(input.name)} sayt yoki ilovasidagi promo maydonga kiriting. Havolali aksiyada esa kartochkadagi tugma orqali hamkor sahifaga o‘ting. Har ikki holatda kartochkadagi shartlar asosiy manba hisoblanadi: foiz yoki summa, minimal xarid, foydalanuvchi turi va muddat bir taklifdan boshqasiga farq qilishi mumkin.</p>`,
    "<p>Kontent o‘qishga qulay bo‘lishi uchun asosiy foyda avval, cheklovlar esa alohida ko‘rsatiladi. Taklif ma’lumotlari o‘zgarsa, sahifadagi tekshiruv sanasi va tavsif ham yangilanadi.</p>",
  ]
    .filter(Boolean)
    .join("");

  const faqJson: FaqJsonItem[] = [
    {
      question: `${input.name} uchun hozir nechta faol taklif bor?`,
      answer:
        count > 0
          ? voice.inventoryAnswer.uz.withOffers(input.name, count)
          : voice.inventoryAnswer.uz.withoutOffers(input.name),
    },
    {
      question: `${input.name} promokodini qanday ishlataman?`,
      answer: `Kartochkani ochib, taklif kodli bo‘lsa kodni nusxalang va ${input.name} sayt yoki ilovasidagi promo maydonga kiriting. Taklif havolali bo‘lsa, kartochkadagi tugma orqali hamkor sahifaga o‘ting. To‘lovdan oldin chegirma qo‘llanganini tekshiring.`,
    },
    {
      question: voice.uniqueFaq.uz.question(input.name),
      answer: voice.uniqueFaq.uz.answer(input.name),
    },
  ];
  return { bodyHtml, faqJson };
}

function buildEntityRu(
  input: EntityRewriteInput,
  intro: string,
  discountRange: string,
  names: string
): Pick<EntityRewrite, "bodyHtml" | "faqJson"> {
  const count = input.deals.length;
  const availability =
    count > 0
      ? `Сейчас на странице доступно ${count} активных предложений. В карточках указана следующая выгода: ${discountRange}.`
      : "Сейчас активных предложений на странице нет. Список обновится после проверки нового промокода; истёкшие коды не показываются как действующие.";
  const examples = names
    ? `<p><strong>Примеры актуальных предложений:</strong> ${escapeHtml(names)}.</p>`
    : "";
  const voice = getSiteVoice(input.profile);
  const bodyHtml = [
    `<p>${escapeHtml(intro)}</p>`,
    `<p>${escapeHtml(voice.framing.ru)}</p>`,
    "<h2>Актуальные предложения и их условия</h2>",
    `<p>${escapeHtml(availability)} ${escapeHtml(voice.offerSeparation.ru)}</p>`,
    examples,
    `<h2>${escapeHtml(voice.compareChecklistTitle.ru)}</h2>`,
    "<ul><li>Уточните, доступна ли акция новым или действующим клиентам.</li><li>Проверьте минимальную сумму заказа, категорию товара и региональные ограничения.</li><li>До оплаты убедитесь, что скидка появилась в корзине или на странице оформления.</li><li>Если код не сработал, удалите лишние пробелы и ещё раз проверьте срок действия.</li><li>Сравните несколько карточек рядом и выберите вариант с подходящими условиями.</li></ul>",
    `<h2>Как использовать предложения ${escapeHtml(input.name)}</h2>`,
    `<p>Для предложения с кодом скопируйте промокод и вставьте его в специальное поле на сайте или в приложении ${escapeHtml(input.name)}. Если акция открывается по ссылке, перейдите на сайт партнёра кнопкой в карточке. Условия карточки остаются главным ориентиром: размер скидки, минимальная покупка, тип клиента и срок могут отличаться.</p>`,
    "<p>Текст построен так, чтобы сначала показать выгоду, а затем ограничения. При изменении условий обновляются описание и дата проверки, поэтому перед покупкой полезно сверить текущую карточку.</p>",
  ]
    .filter(Boolean)
    .join("");

  const faqJson: FaqJsonItem[] = [
    {
      question: `Сколько активных предложений ${input.name} доступно сейчас?`,
      answer:
        count > 0
          ? voice.inventoryAnswer.ru.withOffers(input.name, count)
          : voice.inventoryAnswer.ru.withoutOffers(input.name),
    },
    {
      question: `Как применить промокод ${input.name}?`,
      answer: `Откройте карточку. Если это промокод, скопируйте его и вставьте в поле для купона на сайте или в приложении ${input.name}. Если это акция по ссылке, перейдите на сайт партнёра кнопкой в карточке. До оплаты проверьте итоговую сумму.`,
    },
    {
      question: voice.uniqueFaq.ru.question(input.name),
      answer: voice.uniqueFaq.ru.answer(input.name),
    },
  ];
  return { bodyHtml, faqJson };
}

function buildEntityEn(
  input: EntityRewriteInput,
  intro: string,
  discountRange: string,
  names: string
): Pick<EntityRewrite, "bodyHtml" | "faqJson"> {
  const count = input.deals.length;
  const availability =
    count > 0
      ? `There are currently ${count} active offers on this page. The cards state the following benefit: ${discountRange}.`
      : "There are no active offers on this page right now. The list will update after a new promo is checked; expired codes are not presented as current deals.";
  const examples = names
    ? `<p><strong>Examples of current offers:</strong> ${escapeHtml(names)}.</p>`
    : "";
  const voice = getSiteVoice(input.profile);
  const bodyHtml = [
    `<p>${escapeHtml(intro)}</p>`,
    `<p>${escapeHtml(voice.framing.en)}</p>`,
    "<h2>Current offers and what they include</h2>",
    `<p>${escapeHtml(availability)} ${escapeHtml(voice.offerSeparation.en)}</p>`,
    examples,
    `<h2>${escapeHtml(voice.compareChecklistTitle.en)}</h2>`,
    "<ul><li>Confirm whether the campaign is for new or existing customers.</li><li>Read the minimum-spend, product-category, and location restrictions.</li><li>Before paying, make sure the discount appears in the cart or checkout total.</li><li>If a code fails, remove extra spaces and check the validity period again.</li><li>Compare a few cards side by side and pick the offer whose conditions fit.</li></ul>",
    `<h2>How to use ${escapeHtml(input.name)} offers</h2>`,
    `<p>For a code-based offer, copy the promo code and paste it into the coupon field on the ${escapeHtml(input.name)} website or app. For a link-based campaign, use the button on the offer card to open the partner page. The card terms remain the primary reference because discount size, minimum order, customer eligibility, and timing can vary between offers.</p>`,
    "<p>The content is arranged to show the benefit first and the restrictions separately. When offer details change, the description and review date are refreshed, so check the current card before completing a purchase.</p>",
  ]
    .filter(Boolean)
    .join("");

  const faqJson: FaqJsonItem[] = [
    {
      question: `How many active ${input.name} offers are available now?`,
      answer:
        count > 0
          ? voice.inventoryAnswer.en.withOffers(input.name, count)
          : voice.inventoryAnswer.en.withoutOffers(input.name),
    },
    {
      question: `How do I apply a ${input.name} promo code?`,
      answer: `Open the offer card. If it contains a code, copy it into the coupon field on the ${input.name} website or app. If it is a link deal, use the card button to visit the partner page. Confirm the reduced total before payment.`,
    },
    {
      question: voice.uniqueFaq.en.question(input.name),
      answer: voice.uniqueFaq.en.answer(input.name),
    },
  ];
  return { bodyHtml, faqJson };
}

export function buildEntityRewrite(input: EntityRewriteInput): EntityRewrite {
  const cleaned = plainText(input.existingDescription);
  const intro = cleaned || entityFallback(input.kind, input.name, input.locale);
  const discounts = [...new Set(input.deals.map((deal) => formatDiscount(deal, input.locale)))];
  const discountRange = discounts.slice(0, 4).join(", ");
  const names = dealNames(input.deals);
  const localized =
    input.locale === "uz"
      ? buildEntityUz(input, intro, discountRange, names)
      : input.locale === "ru"
        ? buildEntityRu(input, intro, discountRange, names)
        : buildEntityEn(input, intro, discountRange, names);

  const availability =
    input.locale === "uz"
      ? input.deals.length > 0
        ? `${input.name} uchun ${input.deals.length} ta faol taklif mavjud.`
        : `${input.name} uchun yangi takliflar tekshirilmoqda.`
      : input.locale === "ru"
        ? input.deals.length > 0
          ? `Для ${input.name} доступно ${input.deals.length} активных предложений.`
          : `Новые предложения ${input.name} проходят проверку.`
        : input.deals.length > 0
          ? `${input.deals.length} active ${input.name} offers are available.`
          : `New ${input.name} offers are being checked.`;
  const description = truncate(`${intro} ${availability}`, 420);
  const shortSummary = truncate(`${availability} ${intro}`, 180);
  const metaTitle = entityMetaTitle(input.name, input.kind, input.locale);
  const metaDescription = truncate(`${availability} ${intro}`, 155);

  return {
    description,
    shortSummary,
    bodyHtml: localized.bodyHtml,
    faqJson: localized.faqJson,
    metaTitle,
    metaDescription,
  };
}

function promoFacts(input: PromocodeRewriteInput): {
  discount: string;
  minimum: string | null;
  expiry: string | null;
} {
  const discount = formatDiscount(input, input.locale);
  const minimum =
    input.minOrderAmount === null
      ? null
      : input.locale === "uz"
        ? `Minimal buyurtma: ${formatNumber(input.minOrderAmount, input.locale)} ${input.currency}.`
        : input.locale === "ru"
          ? `Минимальный заказ: ${formatNumber(input.minOrderAmount, input.locale)} ${input.currency}.`
          : `Minimum order: ${formatNumber(input.minOrderAmount, input.locale)} ${input.currency}.`;
  const expiry =
    input.expiresAt === null
      ? null
      : input.locale === "uz"
        ? `Amal qilish muddati: ${localizedDate(input.expiresAt, input.locale)}.`
        : input.locale === "ru"
          ? `Срок действия: ${localizedDate(input.expiresAt, input.locale)}.`
          : `Valid until ${localizedDate(input.expiresAt, input.locale)}.`;
  return { discount, minimum, expiry };
}

function readableConditions(value: string | null): string {
  return (value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(EMOJI_PATTERN, "")
    .replace(/\\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function buildConditions(
  input: PromocodeRewriteInput,
  facts: ReturnType<typeof promoFacts>
): string {
  const generatedFacts = [facts.minimum, facts.expiry].filter((value): value is string =>
    Boolean(value)
  );
  // Use Set for O(1) lookups instead of array.includes() inside filter
  const generatedFactsSet = new Set(generatedFacts);
  const existing = readableConditions(input.existingConditions)
    .split("\n")
    .filter((line) => !generatedFactsSet.has(line))
    .join("\n");
  const fallback =
    input.locale === "uz"
      ? "Qo‘shimcha shartlar manba matnida ko‘rsatilmagan; faollashtirishdan oldin hamkor sahifasini tekshiring."
      : input.locale === "ru"
        ? "Дополнительные условия не указаны в исходном тексте; проверьте страницу партнёра перед активацией."
        : "Additional terms were not provided in the source text; check the partner page before activation.";
  const parts = [existing || fallback, ...generatedFacts];
  return parts.join("\n");
}

function buildPromoUz(
  input: PromocodeRewriteInput,
  facts: ReturnType<typeof promoFacts>,
  conditions: string
): PromocodeRewrite {
  const action =
    input.type === "code"
      ? `kodni nusxalab, ${input.entityName} sayt yoki ilovasidagi promo maydonga kiriting`
      : `taklif havolasini ochib, ${input.entityName} sahifasidagi ko‘rsatmalarni bajaring`;
  const sourceSummary = truncate(readableConditions(input.existingConditions), 120);
  const shortDescription = truncate(
    `${input.title}. ${input.discountValue > 0 ? `Foyda: ${facts.discount}.` : ""} ${
      sourceSummary ||
      (input.discountValue > 0
        ? `${facts.discount} chegirma yoki bonus shartlari kartochkada ko‘rsatilgan.`
        : "Maxsus bonus shartlari kartochkada ko‘rsatilgan.")
    } Faollashtirish uchun ${action}. ${facts.minimum ?? ""} ${facts.expiry ?? ""}`,
    260
  );
  return {
    shortDescription,
    conditions,
    howToHtml:
      input.type === "code"
        ? `<ol><li>Taklif shartlari va moslik talablarini o‘qing.</li><li>Promokodni nusxalang.</li><li>${escapeHtml(input.entityName)} sayt yoki ilovasida kerakli mahsulot yoxud xizmatni tanlang.</li><li>To‘lovdan oldin kodni promo maydonga kiriting.</li><li>${escapeHtml(facts.discount)} foyda yakuniy summada ko‘ringanini tekshiring.</li></ol>`
        : `<ol><li>Taklif shartlari va moslik talablarini o‘qing.</li><li>Kartochkadagi havolani oching.</li><li>${escapeHtml(input.entityName)} sahifasida ro‘yxatdan o‘ting yoki kerakli mahsulotni tanlang.</li><li>Taklif avtomatik biriktirilganini tekshiring.</li><li>To‘lov yoki faollashtirishdan oldin yakuniy foydani tasdiqlang.</li></ol>`,
    faqJson: [
      {
        question: `${input.entityName} taklifi qancha foyda beradi?`,
        answer:
          input.discountValue > 0
            ? `Kartochkadagi tuzilgan ma’lumotga ko‘ra, taklif ${facts.discount} miqdoridagi chegirma yoki bonusni ko‘rsatadi. Yakuniy foyda shartlar, minimal buyurtma va foydalanuvchi mosligiga bog‘liq bo‘lishi mumkin.`
            : "Kartochkada maxsus bonus taklifi ko‘rsatilgan, ammo qiymat alohida raqam bilan berilmagan. Yakuniy foydani hamkor sahifasidagi joriy shartlardan tekshiring.",
      },
      {
        question: `Bu ${input.type === "code" ? "promokod" : "havolali taklif"} qanday faollashtiriladi?`,
        answer:
          input.type === "code"
            ? `Kodni nusxalang, ${input.entityName} sayt yoki ilovasida promo maydonga kiriting va to‘lovdan oldin chegirma qo‘llanganini tekshiring.`
            : `Kartochkadagi havolani oching, ${input.entityName} sahifasidagi amallarni bajaring va bonus yoki chegirma biriktirilganini tekshiring.`,
      },
      {
        question: "Foydalanishdan oldin qaysi shartlarni tekshirish kerak?",
        answer: `Foydalanuvchi turi, minimal xarid, hudud, mahsulot yoki xizmat cheklovi va amal qilish muddatini tekshiring. Kartochkadagi shartlar ${input.entityName} taklifidan foydalanish uchun asosiy yo‘riqnoma hisoblanadi.`,
      },
    ],
    editorVerdict: truncate(
      `${facts.discount} foyda ko‘rsatilgan. Shartlar va yakuniy summani faollashtirishdan oldin tekshiring.`,
      300
    ),
    metaTitle: truncate(`${input.title} | ${input.entityName} promokod`, 60),
    metaDescription: truncate(shortDescription, 155),
  };
}

function buildPromoRu(
  input: PromocodeRewriteInput,
  facts: ReturnType<typeof promoFacts>,
  conditions: string
): PromocodeRewrite {
  const action =
    input.type === "code"
      ? `скопируйте код и введите его в поле промокода на сайте или в приложении ${input.entityName}`
      : `откройте ссылку и выполните инструкции на странице ${input.entityName}`;
  const sourceSummary = truncate(readableConditions(input.existingConditions), 120);
  const shortDescription = truncate(
    `${input.title}. ${input.discountValue > 0 ? `Выгода: ${facts.discount}.` : ""} ${
      sourceSummary ||
      (input.discountValue > 0
        ? `В карточке указаны условия скидки или бонуса ${facts.discount}.`
        : "Условия специального бонуса указаны в карточке.")
    } Чтобы активировать предложение, ${action}. ${facts.minimum ?? ""} ${facts.expiry ?? ""}`,
    260
  );
  return {
    shortDescription,
    conditions,
    howToHtml:
      input.type === "code"
        ? `<ol><li>Прочитайте условия и требования акции.</li><li>Скопируйте промокод.</li><li>Выберите товар или услугу на сайте либо в приложении ${escapeHtml(input.entityName)}.</li><li>Введите код в поле промокода до оплаты.</li><li>Убедитесь, что выгода ${escapeHtml(facts.discount)} появилась в итоговой сумме.</li></ol>`
        : `<ol><li>Прочитайте условия и требования акции.</li><li>Откройте ссылку из карточки.</li><li>Зарегистрируйтесь или выберите нужный товар на странице ${escapeHtml(input.entityName)}.</li><li>Проверьте, что предложение привязалось автоматически.</li><li>Подтвердите итоговую выгоду до оплаты или активации.</li></ol>`,
    faqJson: [
      {
        question: `Какую выгоду даёт предложение ${input.entityName}?`,
        answer:
          input.discountValue > 0
            ? `По структурированным данным карточки указана скидка или бонус ${facts.discount}. Итоговая выгода может зависеть от минимального заказа, требований к клиенту и других условий акции.`
            : "В карточке указано специальное бонусное предложение без отдельного числового значения. Проверьте актуальную выгоду в текущих условиях на странице партнёра.",
      },
      {
        question: `Как активировать это ${input.type === "code" ? "предложение с кодом" : "предложение по ссылке"}?`,
        answer:
          input.type === "code"
            ? `Скопируйте код, введите его в поле промокода на сайте или в приложении ${input.entityName} и до оплаты проверьте применение скидки.`
            : `Откройте ссылку в карточке, выполните действия на странице ${input.entityName} и убедитесь, что скидка или бонус подключены.`,
      },
      {
        question: "Какие условия нужно проверить заранее?",
        answer: `Проверьте тип клиента, минимальную покупку, регион, ограничения по товарам или услугам и срок. Условия карточки — основной ориентир для использования предложения ${input.entityName}.`,
      },
    ],
    editorVerdict: truncate(
      `Указана выгода ${facts.discount}. Проверьте условия и итоговую сумму до активации.`,
      300
    ),
    metaTitle: truncate(`${input.title} | промокод ${input.entityName}`, 60),
    metaDescription: truncate(shortDescription, 155),
  };
}

function buildPromoEn(
  input: PromocodeRewriteInput,
  facts: ReturnType<typeof promoFacts>,
  conditions: string
): PromocodeRewrite {
  const action =
    input.type === "code"
      ? `copy the code and enter it in the promo field on the ${input.entityName} website or app`
      : `open the offer link and follow the instructions on the ${input.entityName} page`;
  const sourceSummary = truncate(readableConditions(input.existingConditions), 120);
  const shortDescription = truncate(
    `${input.title}. ${input.discountValue > 0 ? `Benefit: ${facts.discount}.` : ""} ${
      sourceSummary ||
      (input.discountValue > 0
        ? `The card lists the terms for a ${facts.discount} discount or bonus.`
        : "The card lists the special bonus terms.")
    } To activate it, ${action}. ${facts.minimum ?? ""} ${facts.expiry ?? ""}`,
    260
  );
  return {
    shortDescription,
    conditions,
    howToHtml:
      input.type === "code"
        ? `<ol><li>Read the campaign terms and eligibility rules.</li><li>Copy the promo code.</li><li>Choose the relevant product or service on the ${escapeHtml(input.entityName)} website or app.</li><li>Enter the code in the promo field before payment.</li><li>Confirm that the ${escapeHtml(facts.discount)} benefit appears in the final total.</li></ol>`
        : `<ol><li>Read the campaign terms and eligibility rules.</li><li>Open the link on the offer card.</li><li>Sign up or choose the relevant item on the ${escapeHtml(input.entityName)} page.</li><li>Check that the offer has been attached automatically.</li><li>Confirm the final benefit before payment or activation.</li></ol>`,
    faqJson: [
      {
        question: `What benefit does this ${input.entityName} offer provide?`,
        answer:
          input.discountValue > 0
            ? `The structured offer data shows a ${facts.discount} discount or bonus. The final benefit may depend on minimum spend, customer eligibility, and other campaign conditions.`
            : "The card identifies a special bonus offer without a separate numeric value. Check the current partner-page terms to confirm the exact benefit.",
      },
      {
        question: `How do I activate this ${input.type === "code" ? "promo code" : "link offer"}?`,
        answer:
          input.type === "code"
            ? `Copy the code, enter it in the promo field on the ${input.entityName} website or app, and confirm the discount before payment.`
            : `Open the card link, complete the steps on the ${input.entityName} page, and confirm that the discount or bonus is attached.`,
      },
      {
        question: "Which conditions should I check first?",
        answer: `Check customer eligibility, minimum spend, location, product or service restrictions, and timing. The card terms are the primary guide for using this ${input.entityName} offer.`,
      },
    ],
    editorVerdict: truncate(
      `A ${facts.discount} benefit is listed. Check the terms and final total before activation.`,
      300
    ),
    metaTitle: truncate(`${input.title} | ${input.entityName} Promo`, 60),
    metaDescription: truncate(shortDescription, 155),
  };
}

export function buildPromocodeRewrite(input: PromocodeRewriteInput): PromocodeRewrite {
  const facts = promoFacts(input);
  const conditions = buildConditions(input, facts);
  if (input.locale === "uz") return buildPromoUz(input, facts, conditions);
  if (input.locale === "ru") return buildPromoRu(input, facts, conditions);
  return buildPromoEn(input, facts, conditions);
}
