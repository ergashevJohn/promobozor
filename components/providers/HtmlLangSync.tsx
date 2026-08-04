"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

export function HtmlLangSync() {
  const locale = useLocale();

  useEffect(() => {
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
