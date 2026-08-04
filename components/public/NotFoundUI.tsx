"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Home, Search, Store, Tag } from "lucide-react";
import NextLink from "next/link";

interface NotFoundUIProps {
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any;
  statusCode?: string;
  title?: string;
  description?: string;
}

export function NotFoundUI({
  locale,
  messages,
  statusCode = "404",
  title,
  description,
}: NotFoundUIProps) {
  const t = (key: string) => messages.notFound?.[key as keyof typeof messages.notFound] || key;
  const c = (key: string) => messages.common?.[key as keyof typeof messages.common] || key;

  const popularLinks = [
    {
      href: `/${locale}`,
      label: c("home"),
      icon: Home,
      description: c("goHome"),
    },
    {
      href: `/${locale}/stores`,
      label: c("stores"),
      icon: Store,
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
    <div className="bg-background flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        {/* Number */}
        <div className="mb-8">
          <h1 className="text-foreground text-8xl font-semibold tracking-tight md:text-9xl">
            {statusCode}
          </h1>
        </div>

        {/* Error Icon and Message */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[color:var(--accent)] p-4">
            <AlertCircle className="h-12 w-12 text-[color:var(--accent-red)]" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl">
          {title || t("title")}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8 text-lg">{description || t("description")}</p>

        {/* Primary Action Button */}
        <div className="mb-12">
          <Button asChild size="lg">
            <NextLink href={`/${locale}`}>
              <Home className="mr-2 h-5 w-5" />
              {t("goHome")}
            </NextLink>
          </Button>
        </div>

        {/* Popular Pages Section */}
        <div className="empty-state-card p-6 text-left">
          <h3 className="text-foreground mb-4 text-xl font-semibold">{t("popularPages")}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {popularLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NextLink
                  key={link.href}
                  href={link.href}
                  className="border-border group flex items-center gap-3 rounded-[20px] border bg-[color:var(--secondary)] p-4 transition-colors hover:bg-[color:var(--accent)]"
                >
                  <div className="rounded-xl bg-card p-2 text-[color:var(--accent-red)] shadow-[0_14px_30px_-22px_rgba(17,24,39,0.6)]">
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

        {/* Search Suggestion */}
        <div className="mt-8">
          <p className="text-muted-foreground mb-4 text-sm">{t("orSearch")}</p>
          <Button asChild variant="outline">
            <NextLink href={`/${locale}`}>
              <Search className="mr-2 h-4 w-4" />
              {c("search")}
            </NextLink>
          </Button>
        </div>
      </div>
    </div>
  );
}
