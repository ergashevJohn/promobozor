import { getHowToSteps } from "@/lib/entity-faq";

interface HowToSchemaProps {
  promocodeTitle: string;
  storeName: string;
  locale: string;
  imageUrl?: string | null;
  baseUrl: string;
}

/**
 * HowTo schema for promocode usage instructions.
 * Prefer HowToSection when visible steps are required.
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
  const localeSteps = getHowToSteps(promocodeTitle, storeName, locale);

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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
