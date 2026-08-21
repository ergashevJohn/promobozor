import { HtmlLangSync } from "@/components/providers/HtmlLangSync";
import LazyAnalytics from "@/components/providers/LazyAnalytics";
import LazyToaster from "@/components/providers/LazyToaster";
import LazyConsentBanner from "@/components/public/LazyConsentBanner";
import { locales } from "@/i18n/routing";
import { getBaseUrl } from "@/lib/metadata";
import { ThemeProvider } from "@/lib/theme-provider";
import { Agentation } from "agentation";
import type { Metadata } from "next";
import { Locale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { notFound } from "next/navigation";

const brandSans = Manrope({
  subsets: ["latin", "cyrillic", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
  // Preload primary UI font to improve text LCP on mobile
  preload: true,
  variable: "--font-brand-sans",
});

const brandMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  adjustFontFallback: true,
  // Mono is only used on promocode codes — don't preload site-wide
  preload: false,
  variable: "--font-brand-mono",
});

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

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages({ locale });
  const messageRecord = messages as Record<string, unknown>;
  const clientMessages = {
    common: messageRecord.common ?? {},
    consent: messageRecord.consent ?? {},
    contact: messageRecord.contact ?? {},
    partners: messageRecord.partners ?? {},
    error: messageRecord.error ?? {},
    admin: messageRecord.admin ?? {},
  };

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${brandSans.variable} ${brandMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={clientMessages}>
            <HtmlLangSync />
            {children}
            <LazyConsentBanner />
            <LazyToaster />
          </NextIntlClientProvider>
          {process.env.NODE_ENV === "development" && <Agentation />}
          <LazyAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
