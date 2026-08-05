import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { Link } from "@/i18n/navigation";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata } from "@/lib/metadata";
import {
  ArrowRight,
  SealCheck,
  Clock,
  ArrowsClockwise,
  MagnifyingGlass,
  ShieldCheck,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "verification" });

  return generateFullMetadata(
    t("title"),
    t("description"),
    `/${locale}/how-we-verify-promocodes`,
    undefined,
    "article",
    locale,
    "/how-we-verify-promocodes"
  );
}

export const revalidate = 3600;

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "verification" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const steps = (await t.raw("steps")) as Array<{ title: string; description: string }>;
  const standards = (await t.raw("standards")) as Array<{ title: string; description: string }>;
  const exclusions = (await t.raw("exclusions")) as string[];

  const stepIcons = [MagnifyingGlass, ShieldCheck, Clock, SealCheck, ArrowsClockwise];
  const standardIcons = [SealCheck, ShieldCheck, Warning];

  const breadcrumbItems = [{ name: t("title"), url: "/how-we-verify-promocodes" }];

  return (
    <>
      <div className="container mx-auto px-6 py-4 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} homeName={tCommon("home")} />
      </div>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />

      <div className="page-shell py-12">
        <section className="page-hero-surface">
          <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-[color:var(--accent-red)]/10 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-52 w-52 rounded-full bg-[color:var(--primary)]/8 blur-3xl" />

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="brand-kicker mb-4">
              <ShieldCheck className="h-4 w-4" />
              <span>{t("heroBadge")}</span>
            </div>
            <h1 className="page-hero-heading text-4xl md:text-5xl">{t("heroTitle")}</h1>
            <p className="page-hero-copy mx-auto mt-5">{t("heroDescription")}</p>
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-8 max-w-3xl">
            <h2 className="brand-section-heading text-3xl">{t("stepsTitle")}</h2>
            <p className="text-muted-foreground mt-3 text-lg leading-7">{t("stepsDescription")}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {steps.map((step, index) => {
              const Icon = stepIcons[index] || SealCheck;

              return (
                <article key={step.title} className="metric-card p-5">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mb-3 text-xs font-semibold tracking-[0.28em] text-[color:var(--accent-red)] uppercase">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3 className="text-foreground text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground mt-3 leading-7">{step.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="brand-panel p-6 md:p-8">
            <h2 className="brand-section-heading text-3xl">{t("standardsTitle")}</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-lg leading-7">
              {t("standardsDescription")}
            </p>

            <div className="mt-8 grid gap-4">
              {standards.map((item, index) => {
                const Icon = standardIcons[index] || SealCheck;

                return (
                  <div key={item.title} className="surface-card flex gap-4 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-foreground text-lg font-semibold">{item.title}</h3>
                      <p className="text-muted-foreground mt-2 leading-7">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="brand-panel p-6 md:p-8">
            <h2 className="brand-section-heading text-2xl">{t("exclusionsTitle")}</h2>
            <ul className="mt-6 space-y-3">
              {exclusions.map((item) => (
                <li
                  key={item}
                  className="bg-card flex items-start gap-3 rounded-xl border border-[color:var(--border)] px-4 py-3"
                >
                  <Warning className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent-red)]" />
                  <span className="text-foreground leading-7">{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="brand-panel mt-14 bg-gradient-to-br from-[color:var(--accent)]/70 to-[color:var(--secondary)] px-6 py-8 md:px-8 md:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="brand-section-heading text-3xl">{t("ctaTitle")}</h2>
            <p className="text-muted-foreground mt-3 text-lg leading-7">{t("ctaDescription")}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/contact">
                  {t("ctaPrimary")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="/faq">
                  {t("ctaSecondary")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
