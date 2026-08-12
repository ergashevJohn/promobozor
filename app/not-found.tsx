"use client";

import { NotFoundUI } from "@/components/public/NotFoundUI";
import { routing, type Locale } from "@/i18n/routing";
import { useMemo } from "react";

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

  return (
    <html lang={locale}>
      <body>
        <NotFoundUI locale={locale} messages={messages} />
      </body>
    </html>
  );
}
