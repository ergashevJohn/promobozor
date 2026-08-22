import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { CollectionPageSchema } from "@/components/public/CollectionPageSchema";
import { getPublicCardTranslations } from "@/components/public/PromocodeCardTranslations";
import { PromocodeListOptimized } from "@/components/public/PromocodeListServer";
import ServerPagination from "@/components/public/ServerPagination";
import { Link } from "@/i18n/navigation";
import { getBaseUrl, generateFullMetadata } from "@/lib/metadata";
import { getNewPromocodes, NEW_PROMOCODES_PAGE_SIZE } from "@/lib/queries/new-promocodes";
import { getNewPromocodesPath, getStaticLanguageAlternates, type Locale } from "@/lib/routes";
import { ArrowRightIcon, ClockIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
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
  const breadcrumbItems = [{ name: t("title"), url: "/new" }];

  return (
    <>
      <div className="page-shell py-4">
        <Breadcrumbs locale={locale} items={breadcrumbItems} homeName={common("home")} />
      </div>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
      <CollectionPageSchema
        name={t("title")}
        description={t("description")}
        url="/new"
        itemCount={data.total}
        lang={locale}
        baseUrl={getBaseUrl()}
      />

      <div className="page-shell pb-16">
        <section className="page-hero-surface mb-10">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="brand-kicker mb-4">
                <SparkleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {t("kicker")}
              </p>
              <h1 className="page-hero-heading mb-3">{t("title")}</h1>
              <p className="page-hero-copy">{t("description")}</p>
              <Link
                href="/collections"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--accent-red)]"
              >
                {t("collectionsCta")}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
            <div className="surface-stat px-5 py-4">
              <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                {t("windowLabel")}
              </div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                {t("countLabel", { count: data.total })}
              </div>
              <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                <ClockIcon className="h-4 w-4" aria-hidden="true" />
                {t("windowHint")}
              </p>
            </div>
          </div>
        </section>

        <section>
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
            baseUrl="/new"
            translations={{
              ariaLabel: common("pagination"),
              previous: common("previous"),
              next: common("next"),
              page: common("page"),
            }}
          />
        </section>
      </div>
    </>
  );
}
