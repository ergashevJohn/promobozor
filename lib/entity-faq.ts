export type EntityFaqItem = { question: string; answer: string };

/**
 * Shared FAQ copy for store/category/brand pages.
 * Used by both visible UI and JSON-LD so they stay in sync.
 */
export function getEntityFaqItems(entityName: string, locale: string): EntityFaqItem[] {
  const faqData: Record<string, EntityFaqItem[]> = {
    uz: [
      {
        question: `${entityName} uchun promokodni qanday ishlataman?`,
        answer: `${entityName} promokodini topib, "Nusxalash" tugmasini bosing. Keyin do'kon saytiga o'ting va to'lov paytida kodni maxsus maydonga kiriting.`,
      },
      {
        question: `${entityName} promokodlari bepulmi?`,
        answer: `Ha, barcha ${entityName} promokodlari mutlaqo bepul. Bizdan hech qanday to'lov talab qilinmaydi.`,
      },
      {
        question: `${entityName} promokodlari necha muddatga amal qiladi?`,
        answer: `Har bir promokod o'z muddatiga ega. Promokod sahifasida tugash sanasi ko'rsatilgan. Muddati tugamagan promokodlarni biz har kuni yangilab boramiz.`,
      },
      {
        question: `${entityName} promokodlari qanchalik tez yangilanadi?`,
        answer: `Jamoamiz ${entityName} takliflarini muntazam tekshiradi, yangi kodlarni qo'shadi va muddati o'tganlarini olib tashlaydi.`,
      },
    ],
    ru: [
      {
        question: `Как использовать промокод для ${entityName}?`,
        answer: `Найдите промокод ${entityName}, нажмите кнопку "Копировать". Затем перейдите на сайт магазина и введите код в специальное поле при оплате.`,
      },
      {
        question: `Промокоды ${entityName} бесплатны?`,
        answer: `Да, все промокоды ${entityName} абсолютно бесплатны. Никаких платежей с нас не требуется.`,
      },
      {
        question: `Как долго действуют промокоды ${entityName}?`,
        answer: `У каждого промокода свой срок действия. Срок окончания указан на странице промокода. Мы ежедневно обновляем список действующих промокодов.`,
      },
      {
        question: `Как часто обновляются промокоды ${entityName}?`,
        answer: `Мы регулярно проверяем предложения ${entityName}, добавляем новые коды и удаляем истекшие.`,
      },
    ],
    en: [
      {
        question: `How to use a promocode for ${entityName}?`,
        answer: `Find the ${entityName} promocode and click Copy. Then open the store checkout and paste the code into the promo field.`,
      },
      {
        question: `Are ${entityName} promocodes free?`,
        answer: `Yes. All ${entityName} promocodes on Promokoduz are free to view and use.`,
      },
      {
        question: `How long do ${entityName} promocodes last?`,
        answer: `Each promocode has its own expiry date shown on the offer page. We refresh active offers daily.`,
      },
      {
        question: `How often are ${entityName} promocodes updated?`,
        answer: `Our team reviews ${entityName} deals regularly, adds fresh codes, and removes expired ones.`,
      },
    ],
  };

  return faqData[locale] || faqData.uz;
}

export type HowToStep = { name: string; text: string };

export function getHowToSteps(
  promocodeTitle: string,
  storeName: string,
  locale: string
): HowToStep[] {
  const steps: Record<string, HowToStep[]> = {
    uz: [
      {
        name: "Promokodni toping",
        text: `${promocodeTitle} promokodini sahifadan toping.`,
      },
      {
        name: "Kodni nusxalang",
        text: '"Nusxalash" tugmasini bosing va kod nusxalanadi.',
      },
      {
        name: "Do'kon saytiga o'ting",
        text: `${storeName} saytiga havola orqali o'ting.`,
      },
      {
        name: "Kodni kiriting",
        text: "To'lov qilish paytida promokodni maxsus maydonga kiriting va chegirmani oling.",
      },
    ],
    ru: [
      {
        name: "Найдите промокод",
        text: `Найдите промокод ${promocodeTitle} на странице.`,
      },
      {
        name: "Скопируйте код",
        text: 'Нажмите кнопку "Копировать" и код будет скопирован.',
      },
      {
        name: "Перейдите в магазин",
        text: `Перейдите на сайт ${storeName} по ссылке.`,
      },
      {
        name: "Введите код",
        text: "Введите промокод в специальное поле при оплате и получите скидку.",
      },
    ],
    en: [
      {
        name: "Find the promocode",
        text: `Find the ${promocodeTitle} promocode on this page.`,
      },
      {
        name: "Copy the code",
        text: "Click Copy so the code is saved to your clipboard.",
      },
      {
        name: "Go to the store",
        text: `Open ${storeName} using the deal link.`,
      },
      {
        name: "Enter the code",
        text: "Paste the promocode in the checkout field and apply the discount.",
      },
    ],
  };

  return steps[locale] || steps.en;
}
