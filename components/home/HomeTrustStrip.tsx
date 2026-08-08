import { getTranslations } from "next-intl/server";

interface HomeTrustStripProps {
  locale: string;
}

export async function HomeTrustStrip({ locale }: HomeTrustStripProps) {
  const t = await getTranslations({ locale, namespace: "home" });
  const trustPills = (await t.raw("trustPills")) as string[];

  return (
    <section className="page-shell border-border border-b pb-8 md:pb-10" aria-label={t("title")}>
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        {trustPills.map((pill) => (
          <li key={pill} className="brand-chip">
            {pill}
          </li>
        ))}
      </ul>
    </section>
  );
}
