import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { ContactForm } from "@/components/public/ContactForm";
import { ReCaptchaProvider } from "@/components/providers/ReCaptchaProvider";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata } from "@/lib/metadata";
import { Clock, Envelope, MapPin } from "@phosphor-icons/react/dist/ssr";
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

  const t = await getTranslations({ locale, namespace: "contact" });

  const title = t("title");
  const description = t("description");
  const url = `/${locale}/contact`;

  return {
    ...generateFullMetadata(title, description, url, undefined, "website", locale, "/contact"),
  };
}

export const revalidate = 3600;

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "contact" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const breadcrumbItems = [
    {
      name: t("title"),
      url: `/contact`,
    },
  ];

  return (
    <>
      <div className="page-shell py-4">
        <Breadcrumbs locale={locale} items={breadcrumbItems} homeName={tCommon("home")} />
      </div>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />

      <div className="page-shell pb-12">
        <div className="mx-auto">
          {/* Header */}
          <div className="page-hero-surface mb-12 text-center">
            <div className="brand-kicker mb-4">{t("heroKicker")}</div>
            <h1 className="page-hero-heading mb-4">{t("title")}</h1>
            <p className="page-hero-copy mx-auto">{t("subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h2 className="text-foreground text-xl font-semibold">{t("contactInfo")}</h2>
              </div>
              <div className="brand-panel p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-[color:var(--accent)] p-2 text-[color:var(--accent-red)]">
                    <Envelope className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold">{t("email")}</h3>
                    <p className="text-muted-foreground text-sm">{t("emailValue")}</p>
                  </div>
                </div>
              </div>

              <div className="brand-panel p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-[color:var(--accent)] p-2 text-[color:var(--accent-red)]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold">{t("address")}</h3>
                    <p className="text-muted-foreground text-sm">{t("addressValue")}</p>
                  </div>
                </div>
              </div>

              <div className="brand-panel p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-[color:var(--accent)] p-2 text-[color:var(--accent-red)]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold">{t("workingHours")}</h3>
                    <p className="text-muted-foreground text-sm">{t("workingHoursValue")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-foreground mb-6 text-xl font-semibold">{t("sendMessage")}</h2>
              <ReCaptchaProvider>
                <ContactForm />
              </ReCaptchaProvider>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
