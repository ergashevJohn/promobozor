interface EntityFAQSchemaProps {
  entityName: string;
  entityType: "store" | "category" | "brand";
  locale: string;
}

/**
 * FAQ Schema for entity pages (stores, categories, brands)
 * Provides common questions about promocodes for specific entities
 */
export function EntityFAQSchema({ entityName, locale }: EntityFAQSchemaProps) {
  // Translations for each language
  const faqData = {
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
    ],
    en: [
      {
        question: `How to use promocode for ${entityName}?`,
        answer: `Find the ${entityName} promocode and click the "Copy" button. Then go to the store website and enter the code in the special field at checkout.`,
      },
      {
        question: `Are ${entityName} promocodes free?`,
        answer: `Yes, all ${entityName} promocodes are absolutely free. No payment is required from us.`,
      },
      {
        question: `How long do ${entityName} promocodes last?`,
        answer: `Each promocode has its own expiration date. The expiry date is shown on the promocode page. We update the list of active promocodes daily.`,
      },
    ],
  };

  const questions = faqData[locale as keyof typeof faqData] || faqData.uz;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
