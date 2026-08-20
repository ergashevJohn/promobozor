import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { CollectionPageSchema } from "@/components/public/CollectionPageSchema";
import { FAQSchema } from "@/components/public/FAQSchema";
import { getPublicCardTranslations } from "@/components/public/PromocodeCardTranslations";
import { PromocodeListOptimized } from "@/components/public/PromocodeListServer";
import {
  COLLECTION_FAQS,
  COLLECTION_MIN_OFFERS,
  getCollectionOfferCount,
  isCollectionKey,
} from "@/lib/collections";
import { getBaseUrl, generateFullMetadata } from "@/lib/metadata";
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
  const [t, common, items, card] = await Promise.all([
    getTranslations({ locale, namespace: "collections" }),
    getTranslations({ locale, namespace: "common" }),
    getCollectionPromocodes(locale, key),
    getPublicCardTranslations(locale),
  ]);
  const title = t(`${key}.title`);
  const description = t(`${key}.description`);
  const faqs = COLLECTION_FAQS[key][locale];
  return (
    <div className="page-shell section-rhythm">
      <Breadcrumbs
        locale={locale}
        items={[
          { name: t("title"), url: "/collections" },
          { name: title, url: `/collections/${key}` },
        ]}
      />
      <CollectionPageSchema
        name={title}
        description={description}
        url={`/collections/${key}`}
        itemCount={count}
        lang={locale}
        baseUrl={getBaseUrl()}
      />
      <section>
        <p className="brand-kicker">{t("kicker")}</p>
        <h1 className="brand-page-heading">{title}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-7">{description}</p>
      </section>
      <PromocodeListOptimized
        promocodes={items}
        translations={{
          noPromocodes: common("noResults"),
          noPromocodesDescription: description,
          card,
        }}
      />
      <section>
        <FAQSchema questions={faqs} />
        <h2 className="brand-section-heading">FAQ</h2>
        <div className="mt-5 grid gap-4">
          {faqs.map((faq) => (
            <article key={faq.question} className="brand-panel p-5">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
