import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getIndexableCollections, COLLECTION_KEYS } from "@/lib/collections";
import { generateFullMetadata } from "@/lib/metadata";
import {
  getCollectionPath,
  getCollectionsPath,
  getStaticLanguageAlternates,
  type Locale,
} from "@/lib/routes";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";

function validLocale(locale: string): locale is Locale {
  return locale === "uz" || locale === "ru" || locale === "en";
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!validLocale(locale)) return {};
  const [t, keys] = await Promise.all([
    getTranslations({ locale, namespace: "collections" }),
    getIndexableCollections(locale),
  ]);
  return {
    ...generateFullMetadata(
      t("title"),
      t("description"),
      getCollectionsPath(locale),
      undefined,
      "website",
      locale,
      "",
      getStaticLanguageAlternates("/collections")
    ),
    robots: keys.length ? undefined : { index: false, follow: true },
  };
}
export default async function CollectionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!validLocale(locale)) notFound();
  setRequestLocale(locale);
  const [t, keys] = await Promise.all([
    getTranslations({ locale, namespace: "collections" }),
    getIndexableCollections(locale),
  ]);
  return (
    <div className="page-shell section-rhythm">
      <Breadcrumbs locale={locale} items={[{ name: t("title"), url: "/collections" }]} />
      <section>
        <p className="brand-kicker">{t("kicker")}</p>
        <h1 className="brand-page-heading">{t("title")}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-7">{t("description")}</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTION_KEYS.filter((key) => keys.includes(key)).map((key) => (
          <article key={key} className="brand-panel p-6">
            <h2 className="text-xl font-semibold">{t(`${key}.title`)}</h2>
            <p className="text-muted-foreground mt-3 text-sm leading-6">
              {t(`${key}.description`)}
            </p>
            <Link
              className="mt-5 inline-flex text-sm font-semibold text-[color:var(--accent-red)]"
              href={getCollectionPath(locale, key)}
            >
              {t("browse")}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
