import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { FAQSchema } from "@/components/public/FAQSchema";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata } from "@/lib/metadata";
import { HelpCircle } from "lucide-react";
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

  const t = await getTranslations({ locale, namespace: "faq" });

  const title = t("title");
  const description = t("description");
  const url = `/${locale}/faq`;

  return {
    ...generateFullMetadata(title, description, url, undefined, "website", locale, "/faq"),
  };
}

export const revalidate = 3600;

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "faq" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const questions = t.raw("questions") as Array<{
    question: string;
    answer: string;
  }>;

  const breadcrumbItems = [
    {
      name: t("title"),
      url: `/faq`,
    },
  ];

  return (
    <>
      <div className="page-shell py-4">
        <Breadcrumbs items={breadcrumbItems} homeName={tCommon("home")} />
      </div>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
      <FAQSchema questions={questions} />

      <div className="page-shell py-12">
        <div className="mx-auto">
          {/* Header */}
          <div className="page-hero-surface mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-[color:var(--accent)] p-4 text-[color:var(--accent-red)]">
                <HelpCircle className="h-12 w-12" />
              </div>
            </div>
            <div className="brand-kicker mb-4">FAQ</div>
            <h1 className="page-hero-heading mb-4">{t("title")}</h1>
            <p className="page-hero-copy mx-auto">{t("description")}</p>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {questions.map((item) => (
              <div key={item.question} className="brand-panel p-6">
                <h2 className="text-foreground mb-3 text-xl font-semibold">{item.question}</h2>
                <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
