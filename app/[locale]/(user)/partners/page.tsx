import { PartnerInquiryForm } from "@/components/public/PartnerInquiryForm";
import { ReCaptchaProvider } from "@/components/providers/ReCaptchaProvider";
import { generateFullMetadata } from "@/lib/metadata";
import { getPartnersPath, getStaticLanguageAlternates, type Locale } from "@/lib/routes";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

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
  const t = await getTranslations({ locale, namespace: "partners" });
  const formats = t.raw("formats.list") as string[];
  return (
    <div className="page-shell section-rhythm">
      <section className="max-w-3xl">
        <p className="brand-kicker">{t("kicker")}</p>
        <h1 className="brand-page-heading">{t("title")}</h1>
        <p className="text-muted-foreground mt-4 leading-7">{t("description")}</p>
        <h2 className="mt-8 text-xl font-semibold">{t("formatsTitle")}</h2>
        <ul className="text-muted-foreground mt-3 list-disc space-y-2 pl-5">
          {formats.map((format) => (
            <li key={format}>{format}</li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl bg-[color:var(--secondary)] p-4 text-sm leading-6">
          {t("note")}
        </p>
      </section>
      <section>
        <h2 className="brand-section-heading">{t("formTitle")}</h2>
        <ReCaptchaProvider>
          <PartnerInquiryForm />
        </ReCaptchaProvider>
      </section>
    </div>
  );
}
