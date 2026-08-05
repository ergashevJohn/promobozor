import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { generateFullMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages();

  const title =
    (messages.header?.title as string) || (messages.LocaleLayout?.title as string) || "PromoBozor";
  const description =
    (messages.footer?.description as string) ||
    (messages.LocaleLayout?.description as string) ||
    "PromoBozor";

  return generateFullMetadata(title, description, `/${locale}`, undefined, "website", locale, "/");
}

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const tCommon = await getTranslations("common");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground sr-only z-[100] p-4 focus:not-sr-only focus:fixed focus:top-0 focus:left-0"
      >
        {tCommon("skipToContent")}
      </a>
      <Header />
      <main id="main-content" className="bg-background flex-1 pt-[4.75rem]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
