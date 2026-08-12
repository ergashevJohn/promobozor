import serialize from "serialize-javascript";
import { getEntityFaqItems } from "@/lib/entity-faq";

interface EntityFAQSchemaProps {
  entityName: string;
  entityType: "store" | "category" | "brand";
  locale: string;
}

/**
 * FAQ Schema for entity pages (stores, categories, brands).
 * Prefer EntityFAQSection when a visible FAQ is needed (keeps UI + JSON-LD in sync).
 */
export function EntityFAQSchema({ entityName, locale }: EntityFAQSchemaProps) {
  const questions = getEntityFaqItems(entityName, locale);

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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(schema) }} />
  );
}
