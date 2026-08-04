import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata } from "@/lib/metadata";
import { FileText } from "lucide-react";
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

  const t = await getTranslations({ locale, namespace: "terms" });

  const title = t("title");
  const description = t("description");
  const url = `/${locale}/terms`;

  return generateFullMetadata(title, description, url, undefined, "website", locale, "/terms");
}

export const revalidate = 3600;

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "terms" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const lastUpdated = "2026-01-05";

  const sections = t.raw("sections") as Array<{
    title: string;
    content: string;
  }>;

  const breadcrumbItems = [
    {
      name: t("title"),
      url: `/terms`,
    },
  ];

  return (
    <>
      <div className="page-shell py-4">
        <Breadcrumbs items={breadcrumbItems} homeName={tCommon("home")} />
      </div>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />

      <div className="page-shell py-12">
        <div className="mx-auto">
          {/* Header */}
          <div className="page-hero-surface mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-[color:var(--accent)] p-4 text-[color:var(--accent-red)]">
                <FileText className="h-12 w-12" />
              </div>
            </div>
            <div className="brand-kicker mb-4">{t("heroKicker")}</div>
            <h1 className="page-hero-heading mb-4">{t("title")}</h1>
            <p className="page-hero-copy mx-auto mb-2">{t("description")}</p>
            <p className="text-muted-foreground text-sm">
              {t("lastUpdated")}: {new Date(lastUpdated).toLocaleDateString(locale)}
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="brand-panel p-6">
                <h2 className="text-foreground mb-4 text-2xl font-semibold">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
