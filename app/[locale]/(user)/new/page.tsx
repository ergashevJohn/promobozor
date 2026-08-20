import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { CollectionPageSchema } from "@/components/public/CollectionPageSchema";
import { getPublicCardTranslations } from "@/components/public/PromocodeCardTranslations";
import { PromocodeListOptimized } from "@/components/public/PromocodeListServer";
import ServerPagination from "@/components/public/ServerPagination";
import { getBaseUrl, generateFullMetadata } from "@/lib/metadata";
import { getNewPromocodes, NEW_PROMOCODES_PAGE_SIZE } from "@/lib/queries/new-promocodes";
import { getNewPromocodesPath, getStaticLanguageAlternates, type Locale } from "@/lib/routes";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export const revalidate = 1800;

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
  const [t, data] = await Promise.all([
    getTranslations({ locale, namespace: "newPromocodes" }),
    getNewPromocodes(locale),
  ]);
  return {
    ...generateFullMetadata(
      t("title"),
      t("description"),
      getNewPromocodesPath(locale),
      undefined,
      "website",
      locale,
      "",
      getStaticLanguageAlternates("/new")
    ),
    robots: data.total ? undefined : { index: false, follow: true },
  };
}

export default async function NewPromocodesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  if (!validLocale(locale)) notFound();
  setRequestLocale(locale);
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [t, common, empty, data, card] = await Promise.all([
    getTranslations({ locale, namespace: "newPromocodes" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "empty" }),
    getNewPromocodes(locale, page),
    getPublicCardTranslations(locale),
  ]);
  const totalPages = Math.ceil(data.total / NEW_PROMOCODES_PAGE_SIZE);
  if (data.total && page > totalPages) notFound();
  const path = getNewPromocodesPath(locale);
  return (
    <div className="page-shell section-rhythm">
      <Breadcrumbs locale={locale} items={[{ name: t("title"), url: "/new" }]} />
      <CollectionPageSchema
        name={t("title")}
        description={t("description")}
        url="/new"
        itemCount={data.total}
        lang={locale}
        baseUrl={getBaseUrl()}
      />
      <section>
        <p className="brand-kicker">{t("kicker")}</p>
        <h1 className="brand-page-heading">{t("title")}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-7">{t("description")}</p>
      </section>
      <section className="mt-8">
        <PromocodeListOptimized
          promocodes={data.items}
          translations={{
            noPromocodes: t("emptyTitle"),
            noPromocodesDescription: t("emptyDescription"),
            emptyActionLabel: t("allOffers"),
            emptyActionHref: "/promocodes",
            emptyHint: empty("noPromocodesHint"),
            card,
          }}
        />
        <ServerPagination
          currentPage={page}
          totalPages={totalPages}
          baseUrl={path}
          translations={{
            ariaLabel: common("pagination"),
            previous: common("previous"),
            next: common("next"),
            page: common("page"),
          }}
        />
      </section>
    </div>
  );
}
