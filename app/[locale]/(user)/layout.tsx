import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LazyPromocodeFeedbackPrompt } from "@/components/public/LazyPromocodeFeedbackPrompt";
import { generateFullMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  const title =
    (messages.header?.title as string) || (messages.LocaleLayout?.title as string) || "PromoBozor";
  const description =
    (messages.footer?.description as string) ||
    (messages.LocaleLayout?.description as string) ||
    "PromoBozor";

  return generateFullMetadata(title, description, `/${locale}`, undefined, "website", locale, "/");
}

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tCommon, tFeedback] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "feedback" }),
  ]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground sr-only z-[100] p-4 focus:not-sr-only focus:fixed focus:top-0 focus:left-0"
      >
        {tCommon("skipToContent")}
      </a>
      <Header locale={locale} />
      <main id="main-content" className="bg-background flex-1 pt-[4.75rem]">
        {children}
      </main>
      <Footer locale={locale} />
      <LazyPromocodeFeedbackPrompt
        translations={{
          question: tFeedback("question"),
          worked: tFeedback("worked"),
          failed: tFeedback("failed"),
          chooseReason: tFeedback("chooseReason"),
          send: tFeedback("send"),
          close: tCommon("close"),
          thanks: tFeedback("thanks"),
          error: tFeedback("error"),
          reasons: {
            invalid_or_expired: tFeedback("reasons.invalid_or_expired"),
            new_customer_only: tFeedback("reasons.new_customer_only"),
            min_order_or_product: tFeedback("reasons.min_order_or_product"),
            region_app_or_payment: tFeedback("reasons.region_app_or_payment"),
            other: tFeedback("reasons.other"),
          },
        }}
      />
    </div>
  );
}
