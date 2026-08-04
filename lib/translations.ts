import { getTranslations } from "next-intl/server";

export async function getHomeTranslations(locale: string) {
  const [home, common, empty, card, promocode, filter] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "empty" }),
    getTranslations({ locale, namespace: "card" }),
    getTranslations({ locale, namespace: "promocode" }),
    getTranslations({ locale, namespace: "filter" }),
  ]);

  return { home, common, empty, card, promocode, filter };
}
