import type { Promocode } from "./types";

export type PromocodeCardTranslations = {
  featured: string;
  verified: string;
  fresh: string;
  popular: string;
  endingSoon: string;
  unlimited: string;
  unknownStore: string;
  storeTitle: string;
  promocodeTitle: string;
  activateLink: string;
  details: string;
  viewDetails: string;
  storeOffer: string;
  brandOffer: string;
  directDeal: string;
  codeReady: string;
  dealRoute: string;
  promoCodeLabel: string;
  copy: string;
  copied: string;
  getDeal: string;
  like: string;
  dislike: string;
  codeCopied: string;
  copyError: string;
  expired: string;
  disabled: string;
  conditionsLabel?: string;
};

export function getTimeRemaining(expiresAt: string | null) {
  if (!expiresAt) return null;
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getCardInactiveState(promocode: Promocode) {
  const isDisabledByStatus =
    !promocode.status ||
    promocode.status === "disabled" ||
    promocode.status === "expired" ||
    promocode.status === "draft";

  const now = Date.now();
  const isExpiredByDate = promocode.expiresAt
    ? new Date(promocode.expiresAt).getTime() < now
    : false;

  return {
    isDisabledByStatus,
    isExpiredByDate,
    isInactive: isDisabledByStatus || isExpiredByDate,
  };
}

/**
 * Truncate by Unicode code points (not UTF-16 units) so we never split an emoji
 * surrogate pair — mid-emoji slices cause SSR `` vs client emoji hydration #418.
 */
export function truncateAtCodePoint(text: string, maxChars: number): string {
  const chars = Array.from(text);
  if (chars.length <= maxChars) return text;
  if (maxChars <= 1) return "…";
  return `${chars.slice(0, maxChars - 1).join("")}…`;
}

/** Short readable conditions line for cards */
export function summarizeConditions(conditions?: string | null): string | null {
  if (!conditions) return null;
  const cleaned = conditions
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return truncateAtCodePoint(cleaned, 90);
}
