"use client";

import { routing, type Locale } from "@/i18n/routing";
import { useMemo } from "react";
import { NotFoundUI } from "@/components/public/NotFoundUI";

export default function NotFound() {
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

  return <NotFoundUI locale={locale} messages={messages} />;
}
