import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { CollectionHubCard } from "@/components/public/CollectionHubCard";
import { ItemListSchema } from "@/components/public/ItemListSchema";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { COLLECTION_MIN_OFFERS, getCollectionSummaries } from "@/lib/collections";
import { generateFullMetadata } from "@/lib/metadata";
import { getCollectionsPath, getStaticLanguageAlternates, type Locale } from "@/lib/routes";
import { PackageIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

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
  const [t, summaries] = await Promise.all([
    getTranslations({ locale, namespace: "collections" }),
    getCollectionSummaries(locale),
  ]);
  const visible = summaries.filter((item) => item.count >= COLLECTION_MIN_OFFERS);
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
    robots: visible.length ? undefined : { index: false, follow: true },
  };
}

export default async function CollectionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!validLocale(locale)) notFound();
  setRequestLocale(locale);
  const [t, tCommon, summaries] = await Promise.all([
    getTranslations({ locale, namespace: "collections" }),
    getTranslations({ locale, namespace: "common" }),
    getCollectionSummaries(locale),
  ]);
  const visible = summaries.filter((item) => item.count >= COLLECTION_MIN_OFFERS);
  const totalOffers = visible.reduce((sum, item) => sum + item.count, 0);
  const breadcrumbItems = [{ name: t("title"), url: "/collections" }];

  return (
    <>
      <div className="page-shell py-4">
        <Breadcrumbs locale={locale} items={breadcrumbItems} homeName={tCommon("home")} />
      </div>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
      {visible.length > 0 ? (
        <ItemListSchema
          locale={locale}
          listName={t("title")}
          listDescription={t("description")}
          items={visible.map((item) => ({
            name: t(`${item.key}.title`),
            url: `/collections/${item.key}`,
            description: t(`${item.key}.description`),
          }))}
        />
      ) : null}

      <div className="page-shell pb-16">
        <section className="page-hero-surface mb-10">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="brand-kicker mb-4">{t("kicker")}</p>
              <h1 className="page-hero-heading mb-3">{t("title")}</h1>
              <p className="page-hero-copy">{t("description")}</p>
            </div>
            <div className="surface-stat px-5 py-4">
              <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                {t("kicker")}
              </div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                {t("collectionCount", { count: visible.length })}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("offerCount", { count: totalOffers })}
              </p>
            </div>
          </div>
        </section>

        {visible.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <CollectionHubCard
                key={item.key}
                collectionKey={item.key}
                href={`/collections/${item.key}`}
                title={t(`${item.key}.title`)}
                description={t(`${item.key}.description`)}
                countLabel={t("offerCount", { count: item.count })}
                browseLabel={t("browse")}
              />
            ))}
          </div>
        ) : (
          <div className="brand-panel mx-auto flex max-w-lg flex-col items-center px-6 py-14 text-center">
            <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
              <PackageIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="text-foreground text-xl font-semibold">{t("emptyTitle")}</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">{t("emptyDescription")}</p>
            <Button asChild className="mt-6">
              <Link href="/promocodes">{t("allOffers")}</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
