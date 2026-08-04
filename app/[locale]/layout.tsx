import { HtmlLangSync } from "@/components/providers/HtmlLangSync";
import LazyToaster from "@/components/providers/LazyToaster";
import LazyConsentBanner from "@/components/public/LazyConsentBanner";
import { locales } from "@/i18n/routing";
import { getBaseUrl } from "@/lib/metadata";
import type { Metadata } from "next";
import { Locale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: Omit<LayoutProps, "children">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "LocaleLayout",
  });

  const baseUrl = getBaseUrl();
  const ogImageUrl = `${baseUrl}/${locale}/opengraph-image`;

  return {
    title: {
      template: "%s | PromoBozor",
      default: t("title"),
    },
    description: t("description"),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: locale,
      siteName: "PromoBozor",
      title: t("title"),
      description: t("description"),
      url: `${baseUrl}/${locale}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [ogImageUrl],
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  // Get messages for the locale
  const messages = await getMessages();
  const messageRecord = messages as Record<string, unknown>;
  const clientMessages = {
    common: messageRecord.common ?? {},
    consent: messageRecord.consent ?? {},
    contact: messageRecord.contact ?? {},
    error: messageRecord.error ?? {},
    admin: messageRecord.admin ?? {},
  };

  return (
    <NextIntlClientProvider messages={clientMessages}>
      <HtmlLangSync />
      {children}
      <LazyConsentBanner />
      <LazyToaster />
    </NextIntlClientProvider>
  );
}
