import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { PersonSchema } from "@/components/public/PersonSchema";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import {
  ArrowRight,
  CheckCircle,
  Globe,
  Mail,
  RefreshCcw,
  RefreshCw,
  Shield,
  Youtube,
  Users,
  Zap,
} from "lucide-react";
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

  const t = await getTranslations({ locale, namespace: "about" });

  const title = t("title");
  const description = t("description");
  const url = `/${locale}/about`;

  return generateFullMetadata(title, description, url, undefined, "website", locale, "/about");
}

export const revalidate = 3600;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "about" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const founderHighlights = (await t.raw("founder.highlights")) as string[];
  const founderExperience = (await t.raw("founder.experience")) as Array<{
    title: string;
    description: string;
  }>;
  const aboutUrl = `${getBaseUrl()}/${locale}/about`;

  const reasons = [
    { icon: CheckCircle, title: t("reason1Title"), description: t("reason1Description") },
    { icon: RefreshCw, title: t("reason2Title"), description: t("reason2Description") },
    { icon: Zap, title: t("reason3Title"), description: t("reason3Description") },
    { icon: Globe, title: t("reason4Title"), description: t("reason4Description") },
  ];

  const stats = [
    { label: t("statsStores"), value: "50+" },
    { label: t("statsCategories"), value: "20+" },
    { label: t("statsPromocodes"), value: "500+" },
    { label: t("statsUsers"), value: "10K+" },
  ];

  return (
    <>
      <PersonSchema
        name={t("founder.name")}
        jobTitle={t("founder.role")}
        url={aboutUrl}
        description={t("founder.bio")}
        sameAs={[
          "https://t.me/promokoduz_app",
          "https://instagram.com/promokoduz_app",
          "https://www.youtube.com/@promokoduz_app",
        ]}
        knowsAbout={[
          "Promocode verification",
          "E-commerce savings strategies",
          "Uzbekistan online shopping market",
          "Next.js and TypeScript development",
          "Full-stack web development",
          "Affiliate marketing optimization",
          "SEO and GEO (Generative Engine Optimization)",
        ]}
      />

      <div className="page-shell py-4">
        <Breadcrumbs items={[{ name: t("title"), url: "/about" }]} homeName={tCommon("home")} />
      </div>
      <BreadcrumbsSchema
        items={[
          { name: tCommon("home"), url: "/" },
          { name: t("title"), url: "/about" },
        ]}
        locale={locale}
      />

      <div className="page-shell py-12">
        {/* Hero */}
        <div className="page-hero-surface mb-16 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-[color:var(--accent)] p-4 text-[color:var(--accent-red)]">
              <Users className="h-12 w-12" />
            </div>
          </div>
          <div className="brand-kicker mb-4">{t("heroKicker")}</div>
          <h1 className="page-hero-heading mb-4">{t("heroTitle")}</h1>
          <p className="page-hero-copy mx-auto">{t("heroDescription")}</p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <Card className="brand-panel">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-2xl bg-[color:var(--accent)] p-3 text-[color:var(--accent-red)]">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-foreground mb-3 text-2xl font-semibold">
                    {t("missionTitle")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">{t("missionDescription")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How We Work */}
        <section className="mb-16">
          <Card className="brand-panel">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-2xl bg-[color:var(--accent)] p-3 text-[color:var(--accent-red)]">
                  <RefreshCw className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-foreground mb-3 text-2xl font-semibold">{t("howWeWork")}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("howWeWorkDescription")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stats */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <div className="brand-kicker mb-4">{t("statsKicker")}</div>
            <h2 className="text-foreground text-2xl font-semibold">{t("statsTitle")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="metric-card">
                <CardContent className="p-6 text-center">
                  <p className="mb-1 text-3xl font-bold text-[color:var(--accent-red)]">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Us */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <div className="brand-kicker mb-4">{t("whyUsKicker")}</div>
            <h2 className="text-foreground text-2xl font-semibold">{t("whyUsTitle")}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {reasons.map((reason) => (
              <Card key={reason.title} className="brand-panel">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex-shrink-0 rounded-2xl bg-[color:var(--accent)] p-3 text-[color:var(--accent-red)]">
                    <reason.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-foreground mb-2 text-lg font-semibold">{reason.title}</h3>
                    <p className="text-muted-foreground text-sm">{reason.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-1.5 text-sm font-semibold text-[color:var(--accent-red)]">
              <Users className="h-4 w-4" />
              <span>{t("founder.badge")}</span>
            </div>
            <h2 className="text-foreground text-3xl font-semibold md:text-4xl">
              {t("founder.name")}
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">{t("founder.role")}</p>
            {t.raw("founder.credentials") && (
              <p className="text-muted-foreground mt-2 text-sm">{t("founder.credentials")}</p>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="brand-panel overflow-hidden">
              <CardContent className="bg-gradient-to-br from-[color:var(--accent)] via-card to-[color:var(--secondary)] p-8">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[color:var(--foreground)] text-2xl font-bold text-white">
                  JE
                </div>
                <p className="text-muted-foreground text-lg leading-8">{t("founder.bio")}</p>
                <blockquote className="border-primary/30 text-foreground mt-6 border-l-2 pl-4 text-lg font-medium italic">
                  {t("founder.quote")}
                </blockquote>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="mailto:jahongirergawev2@gmail.com"
                    className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                  <a
                    href="https://t.me/promokoduz_app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Telegram
                  </a>
                  <a
                    href="https://instagram.com/promokoduz_app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://www.youtube.com/@promokoduz_app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </a>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              <Card className="brand-panel">
                <CardContent className="p-8">
                  <h3 className="text-foreground mb-5 text-xl font-semibold">
                    {t("founder.highlightsTitle")}
                  </h3>
                  <ul className="space-y-4">
                    {founderHighlights.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-[color:var(--accent)] p-1 text-[color:var(--accent-red)]">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <span className="text-muted-foreground leading-7">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="brand-panel">
                <CardContent className="p-8">
                  <h3 className="text-foreground mb-5 text-xl font-semibold">
                    {t("founder.experienceTitle")}
                  </h3>
                  <div className="space-y-5">
                    {founderExperience.map((item) => (
                      <div key={item.title}>
                        <h4 className="text-foreground text-lg font-semibold">{item.title}</h4>
                        <p className="text-muted-foreground mt-2 leading-7">{item.description}</p>
                      </div>
                    ))}
                  </div>

                  <Link href="/how-we-verify-promocodes" className="mt-6 inline-flex">
                    <span className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90">
                      {t("founder.cta")}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="page-hero-surface text-center">
          <div className="brand-kicker mb-4">{t("contactKicker")}</div>
          <h2 className="text-foreground mb-4 text-2xl font-semibold">{t("contactTitle")}</h2>
          <p className="text-muted-foreground mb-6">{t("contactDescription")}</p>
          <div className="flex justify-center gap-4">
            <a
              href="https://t.me/promokoduz_app"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
            >
              Telegram
            </a>
            <a
              href="mailto:jahongirergawev2@gmail.com"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
            >
              Email
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
