import serialize from "serialize-javascript";

interface HowToSchemaProps {
  promocodeTitle: string;
  storeName: string;
  locale: string;
  imageUrl?: string | null;
  baseUrl: string;
}

/**
 * HowTo schema for promocode usage instructions
 * Helps search engines display step-by-step instructions in rich results
 */
export function HowToSchema({
  promocodeTitle,
  storeName,
  locale,
  imageUrl,
  baseUrl,
}: HowToSchemaProps) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const resolveAbsoluteUrl = (url: string) =>
    url.startsWith("http") ? url : `${normalizedBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
  const howToImage = resolveAbsoluteUrl(imageUrl || "/icon.png");

  // Translations for each language
  const steps = {
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
        text: `Find the ${promocodeTitle} promocode on the page.`,
      },
      {
        name: "Copy the code",
        text: 'Click the "Copy" button and the code will be copied.',
      },
      {
        name: "Go to the store",
        text: `Go to the ${storeName} website via the link.`,
      },
      {
        name: "Enter the code",
        text: "Enter the promocode in the special field at checkout and get your discount.",
      },
    ],
  };

  const localeSteps = steps[locale as keyof typeof steps] || steps.en;

  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${promocodeTitle} promocode`,
    description: `Step by step guide to use ${promocodeTitle} promocode from ${storeName}`,
    image: howToImage,
    step: localeSteps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      image: howToImage,
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(schema) }} />
  );
}
