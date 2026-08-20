import { getTranslations } from "next-intl/server";

export async function getPublicCardTranslations(locale: string) {
  const [card, promocode, store] = await Promise.all([
    getTranslations({ locale, namespace: "card" }),
    getTranslations({ locale, namespace: "promocode" }),
    getTranslations({ locale, namespace: "store" }),
  ]);
  return {
    featured: card("featured"),
    verified: card("verified"),
    fresh: card("fresh"),
    popular: card("popular"),
    endingSoon: promocode("expiresSoon"),
    unlimited: card("unlimited"),
    unknownStore: card("unknownStore"),
    storeTitle: store("title"),
    promocodeTitle: promocode("title"),
    activateLink: card("activateLink"),
    details: card("details"),
    viewDetails: card("viewDetails"),
    storeOffer: card("storeOffer"),
    brandOffer: card("brandOffer"),
    directDeal: card("directDeal"),
    codeReady: card("codeReady"),
    dealRoute: card("dealRoute"),
    promoCodeLabel: card("promoCodeLabel"),
    copy: card("copy"),
    copied: card("copied"),
    getDeal: card("getDeal"),
    like: card("like"),
    dislike: card("dislike"),
    expired: card("expired"),
    disabled: card("disabled"),
    codeCopied: promocode("codeCopied"),
    copyError: promocode("copyError"),
  };
}
