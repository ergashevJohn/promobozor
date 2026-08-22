import { getTranslations } from "next-intl/server";

export type HubEditorialKind = "promocodes" | "stores" | "blog";

type HubEditorialContent = {
  eyebrow: string;
  title: string;
  intro: string;
  paragraphs: string[];
  checklistTitle: string;
  checklist: string[];
};

interface HubEditorialSectionProps {
  locale: string;
  kind: HubEditorialKind;
}

/**
 * Server-rendered editorial copy for the three public directory hubs.
 * Keeping the copy in locale messages makes it crawlable without adding
 * client-side JavaScript or a database dependency.
 */
export async function HubEditorialSection({ locale, kind }: HubEditorialSectionProps) {
  const t = await getTranslations({ locale, namespace: "hubEditorial" });
  const content = t.raw(kind) as HubEditorialContent;

  return (
    <section className="page-shell pb-14 md:pb-16" aria-labelledby={`hub-editorial-${kind}`}>
      <div className="content-prose-panel mx-auto md:p-8">
        <div className="brand-kicker mb-4">{content.eyebrow}</div>
        <h2
          id={`hub-editorial-${kind}`}
          className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl"
        >
          {content.title}
        </h2>
        <p className="text-muted-foreground mt-4 text-base leading-8 md:text-lg">{content.intro}</p>

        <div className="mt-7 space-y-5">
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-foreground text-base leading-8">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-8 border-t border-[color:var(--border)] pt-7">
          <h3 className="text-foreground text-lg font-semibold">{content.checklistTitle}</h3>
          <ul className="mt-4 space-y-3">
            {content.checklist.map((item) => (
              <li key={item} className="text-muted-foreground flex gap-3 text-sm leading-6">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent-red)]"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
