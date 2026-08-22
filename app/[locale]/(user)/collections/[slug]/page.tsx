import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { CollectionHubCard } from "@/components/public/CollectionHubCard";
import { CollectionPageSchema } from "@/components/public/CollectionPageSchema";
import { FAQSchema } from "@/components/public/FAQSchema";
import { getPublicCardTranslations } from "@/components/public/PromocodeCardTranslations";
import { PromocodeListOptimized } from "@/components/public/PromocodeListServer";
import {
  COLLECTION_FAQS,
  COLLECTION_MIN_OFFERS,
  getCollectionOfferCount,
  getCollectionSummaries,
  isCollectionKey,
} from "@/lib/collections";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import { getCollectionPromocodes } from "@/lib/queries/collection-promocodes";
import { getCollectionPath, type Locale } from "@/lib/routes";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

function validLocale(locale: string): locale is Locale {
  return locale === "uz" || locale === "ru" || locale === "en";
}

async function resolve(params: Promise<{ locale: string; slug: string }>) {
  const { locale, slug } = await params;
  if (!validLocale(locale) || !isCollectionKey(slug)) notFound();
  const count = await getCollectionOfferCount(locale, slug);
  if (count < COLLECTION_MIN_OFFERS) notFound();
  return { locale, key: slug, count };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, key } = await resolve(params);
  const t = await getTranslations({ locale, namespace: "collections" });
  const title = t(`${key}.title`);
  return generateFullMetadata(
    title,
    t(`${key}.description`),
    getCollectionPath(locale, key),
    undefined,
    "website",
    locale,
    "",
    {
      uz: getCollectionPath("uz", key),
      ru: getCollectionPath("ru", key),
      en: getCollectionPath("en", key),
    }
  );
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, key, count } = await resolve(params);
  setRequestLocale(locale);
  const [t, common, items, card, summaries] = await Promise.all([
    getTranslations({ locale, namespace: "collections" }),
    getTranslations({ locale, namespace: "common" }),
    getCollectionPromocodes(locale, key),
    getPublicCardTranslations(locale),
    getCollectionSummaries(locale),
  ]);
  const title = t(`${key}.title`);
  const description = t(`${key}.description`);
  const faqs = COLLECTION_FAQS[key][locale];
  const related = summaries.filter(
    (item) => item.key !== key && item.count >= COLLECTION_MIN_OFFERS
  );
  const breadcrumbItems = [
    { name: t("title"), url: "/collections" },
    { name: title, url: `/collections/${key}` },
  ];

  return (
    <>
      <div className="page-shell py-4">
        <Breadcrumbs locale={locale} items={breadcrumbItems} homeName={common("home")} />
      </div>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
      <CollectionPageSchema
        name={title}
        description={description}
        url={`/collections/${key}`}
        itemCount={count}
        lang={locale}
        baseUrl={getBaseUrl()}
      />

      <div className="page-shell pb-16">
        <section className="page-hero-surface mb-10">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="brand-kicker mb-4">{t("kicker")}</p>
              <h1 className="page-hero-heading mb-3">{title}</h1>
              <p className="page-hero-copy">{description}</p>
            </div>
            <div className="surface-stat px-5 py-4">
              <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                {t("browse")}
              </div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                {t("offerCount", { count })}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{t("heroHint")}</p>
            </div>
          </div>
        </section>

        <PromocodeListOptimized
          promocodes={items}
          translations={{
            noPromocodes: common("noResults"),
            noPromocodesDescription: description,
            card,
          }}
        />

        <section className="mt-12">
          <FAQSchema questions={faqs} />
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">{t("faqTitle")}</h2>
          <div className="mt-5 grid gap-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="brand-panel p-5">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        {related.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-foreground text-2xl font-semibold tracking-tight">
              {t("otherCollections")}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {related.map((item) => (
                <CollectionHubCard
                  key={item.key}
                  collectionKey={item.key}
                  href={`/collections/${item.key}`}
                  title={t(`${item.key}.title`)}
                  description={t(`${item.key}.description`)}
                  countLabel={t("offerCount", { count: item.count })}
                  browseLabel={t("browse")}
                  heading="h3"
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
