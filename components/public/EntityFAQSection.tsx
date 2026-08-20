import { FAQSchema } from "@/components/public/FAQSchema";
import { getEntityFaqItems } from "@/lib/entity-faq";

interface EntityFAQSectionProps {
  entityName: string;
  entityType: "store" | "category" | "brand";
  locale: string;
  title: string;
  description?: string;
  /** DB faq_json when present — otherwise template fallback */
  faqJson?: unknown;
}

/**
 * Visible FAQ + matching FAQPage JSON-LD for entity hubs.
 */
export function EntityFAQSection({
  entityName,
  entityType,
  locale,
  title,
  description,
  faqJson,
}: EntityFAQSectionProps) {
  const items = getEntityFaqItems(entityName, locale, faqJson);

  return (
    <section
      id={`${entityType}-faq`}
      className="section-rhythm scroll-mt-24"
      aria-labelledby={`${entityType}-faq-heading`}
    >
      <FAQSchema questions={items} />
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h2 id={`${entityType}-faq-heading`} className="brand-section-heading text-center">
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground mx-auto mt-3 max-w-[48ch] text-base leading-7">
            {description}
          </p>
        ) : null}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.question}
            className="bg-card border-border rounded-2xl border p-5 shadow-[0_18px_48px_-40px_rgba(15,20,25,0.28)] md:p-6"
          >
            <h3 className="text-foreground text-base leading-snug font-semibold text-balance md:text-lg">
              <span
                className="mb-3 block h-1 w-8 rounded-full bg-[color:var(--accent-red)]"
                aria-hidden="true"
              />
              {item.question}
            </h3>
            <p className="text-muted-foreground mt-3 text-sm leading-7">{item.answer}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
