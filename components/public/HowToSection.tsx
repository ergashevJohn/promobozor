import { HowToSchema } from "@/components/public/HowToSchema";
import { getHowToSteps } from "@/lib/entity-faq";

interface HowToSectionProps {
  promocodeTitle: string;
  storeName: string;
  locale: string;
  imageUrl?: string | null;
  baseUrl: string;
  title: string;
}

/**
 * Visible HowTo steps + matching HowTo JSON-LD for active promocode pages.
 */
export function HowToSection({
  promocodeTitle,
  storeName,
  locale,
  imageUrl,
  baseUrl,
  title,
}: HowToSectionProps) {
  const steps = getHowToSteps(promocodeTitle, storeName, locale);

  return (
    <section className="section-rhythm" aria-labelledby="howto-heading">
      <HowToSchema
        promocodeTitle={promocodeTitle}
        storeName={storeName}
        locale={locale}
        imageUrl={imageUrl}
        baseUrl={baseUrl}
      />
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h2 id="howto-heading" className="brand-section-heading text-center">
          {title}
        </h2>
      </div>
      <ol className="mx-auto grid max-w-3xl gap-4">
        {steps.map((step, index) => (
          <li
            key={step.name}
            className="bg-card border-border flex gap-4 rounded-2xl border p-5 md:p-6"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-red)] text-sm font-bold text-white"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div>
              <h3 className="text-foreground text-base font-semibold">{step.name}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-7">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
