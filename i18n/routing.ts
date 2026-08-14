import { ROUTE_LOCALES, localizedPathnames } from "@/lib/routes";
import { defineRouting } from "next-intl/routing";

export const locales = ROUTE_LOCALES;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales: [...ROUTE_LOCALES],
  defaultLocale: "uz",
  localePrefix: "always",
  pathnames: localizedPathnames,
});
