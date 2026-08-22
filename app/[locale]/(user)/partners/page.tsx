import { ReCaptchaProvider } from "@/components/providers/ReCaptchaProvider";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { PartnerInquiryForm } from "@/components/public/PartnerInquiryForm";
import { generateFullMetadata } from "@/lib/metadata";
import { getPartnersPath, getStaticLanguageAlternates, type Locale } from "@/lib/routes";
import {
  HouseIcon,
  PackageIcon,
  SealCheckIcon,
  ShieldIcon,
  TagIcon,
  TelegramLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";

const FORMAT_KEYS = ["listing", "exclusive", "homepage", "collection", "telegram"] as const;

const FORMAT_ICONS: Record<(typeof FORMAT_KEYS)[number], ComponentType<{ className?: string }>> = {
  listing: TagIcon,
  exclusive: SealCheckIcon,
  homepage: HouseIcon,
  collection: PackageIcon,
  telegram: TelegramLogoIcon,
};

const HOW_STEPS = [1, 2, 3] as const;

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
  const t = await getTranslations({ locale, namespace: "partners" });
  return generateFullMetadata(
    t("title"),
    t("description"),
    getPartnersPath(locale),
    undefined,
    "website",
    locale,
    "",
    getStaticLanguageAlternates("/partners")
  );
}

export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!validLocale(locale)) notFound();
  setRequestLocale(locale);
  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "partners" }),
    getTranslations({ locale, namespace: "common" }),
  ]);
  const formatDetails = t.raw("formats.list") as string[];
  const breadcrumbItems = [{ name: t("title"), url: "/partners" }];

  return (
    <>
      <div className="page-shell py-4">
        <Breadcrumbs locale={locale} items={breadcrumbItems} homeName={tCommon("home")} />
      </div>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />

      <div className="page-shell pb-16">
        <section className="page-hero-surface mb-10">
          <p className="brand-kicker mb-4">{t("kicker")}</p>
          <h1 className="page-hero-heading max-w-3xl">{t("title")}</h1>
          <p className="page-hero-copy mt-4">{t("description")}</p>
        </section>

        <div className="grid items-start gap-10">
          <div className="space-y-10">
            <section>
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                {t("formatsTitle")}
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {FORMAT_KEYS.map((key, index) => {
                  const Icon = FORMAT_ICONS[key];
                  return (
                    <li key={key} className="brand-panel flex gap-3 p-4">
                      <span className="bg-accent text-accent-red flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-foreground font-semibold">{t(`formats.${key}`)}</p>
                        <p className="text-muted-foreground mt-1 text-sm leading-6">
                          {formatDetails[index]}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                {t("howTitle")}
              </h2>
              <ol className="mt-5 space-y-3">
                {HOW_STEPS.map((step) => (
                  <li key={step} className="brand-panel flex gap-4 p-4">
                    <span className="text-muted-foreground font-mono text-sm font-semibold">
                      {String(step).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-foreground font-semibold">{t(`how.${step}.title`)}</p>
                      <p className="text-muted-foreground mt-1 text-sm leading-6">
                        {t(`how.${step}.text`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <p className="brand-panel flex gap-3 p-4 text-sm leading-6">
              <ShieldIcon className="text-accent-red mt-0.5 h-5 w-5 shrink-0" />
              <span className="text-muted-foreground">{t("note")}</span>
            </p>
          </div>

          <section className="lg:sticky lg:top-24">
            <div className="mb-4">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                {t("formTitle")}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{t("formLead")}</p>
            </div>
            <ReCaptchaProvider>
              <PartnerInquiryForm />
            </ReCaptchaProvider>
          </section>
        </div>
      </div>
    </>
  );
}
