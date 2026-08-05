"use client";

import { Button } from "@/components/ui/button";
import { routing, type Locale } from "@/i18n/routing";
import {
  Warning,
  House,
  ArrowsClockwise,
  MagnifyingGlass,
  Storefront,
  Tag,
} from "@phosphor-icons/react";
import NextLink from "next/link";
import { useEffect, useMemo } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useMemo(() => {
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
    return (
      localeMatch && routing.locales.includes(localeMatch[1] as Locale)
        ? localeMatch[1]
        : routing.defaultLocale
    ) as Locale;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const messages = require(`@/messages/${locale}.json`);
  const t = (key: string) => messages.error[key as keyof typeof messages.error] || key;
  const c = (key: string) => messages.common[key as keyof typeof messages.common] || key;

  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  const popularLinks = [
    {
      href: `/${locale}`,
      label: c("home"),
      icon: House,
      description: c("goHome"),
    },
    {
      href: `/${locale}/stores`,
      label: c("stores"),
      icon: Storefront,
      description: c("viewAllStores"),
    },
    {
      href: `/${locale}/categories`,
      label: c("categories"),
      icon: Tag,
      description: c("viewCategories"),
    },
    {
      href: `/${locale}/brands`,
      label: c("brands"),
      icon: Tag,
      description: c("viewBrands"),
    },
  ];

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8">
              <h1 className="text-destructive text-9xl font-bold">500</h1>
            </div>

            <div className="mb-6 flex justify-center">
              <div className="bg-destructive/10 rounded-full p-4">
                <Warning className="text-destructive h-12 w-12" />
              </div>
            </div>

            <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl">{t("title")}</h2>

            <p className="text-muted-foreground mb-8 text-lg">{t("description")}</p>

            <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={reset} size="lg">
                <ArrowsClockwise className="mr-2 h-5 w-5" />
                {t("tryAgain")}
              </Button>
              <Button asChild variant="outline" size="lg">
                <NextLink href={`/${locale}`}>
                  <House className="mr-2 h-5 w-5" />
                  {t("goHome")}
                </NextLink>
              </Button>
            </div>

            <div className="border-border bg-card rounded-lg border p-6">
              <h3 className="text-foreground mb-4 text-xl font-semibold">{c("popularPages")}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {popularLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NextLink
                      key={link.href}
                      href={link.href}
                      className="bg-background hover:bg-accent border-border group flex items-center gap-3 rounded-lg border p-4 transition-colors"
                    >
                      <div className="bg-primary/10 text-primary rounded-lg p-2">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-foreground font-medium">{link.label}</div>
                        <div className="text-muted-foreground text-sm">{link.description}</div>
                      </div>
                    </NextLink>
                  );
                })}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-muted-foreground mb-4 text-sm">{c("orSearchPromocodes")}</p>
              <Button asChild variant="outline">
                <NextLink href={`/${locale}`}>
                  <MagnifyingGlass className="mr-2 h-4 w-4" />
                  {c("search")}
                </NextLink>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
