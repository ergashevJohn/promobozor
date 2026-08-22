import type { Promocode } from "@/components/public/types";
import { getApprovedImageUrl } from "@/lib/media";

// Hoist Intl formatter to module scope for performance (created once, reused across all calls)
const numberFormatter = new Intl.NumberFormat("en-US");

export interface PromocodeDisplayData {
  translation:
    | {
        language: string;
        title: string;
        slug: string;
        shortDescription?: string | null;
        conditions?: string | null;
        howToHtml?: string | null;
        editorVerdict?: string | null;
        faqJson?: unknown;
      }
    | undefined;
  brandTranslation: Record<string, string | null> | undefined;
  storeTranslation: Record<string, string | null> | undefined;
  categoryTranslation: Record<string, string | null> | undefined;
  displayName: string;
  displayImage: string | null;
  displayUrl: string | null;
  displaySlug: string | null;
  displayType: string;
  expiryDate: Date | null;
  isExpired: boolean;
  isDisabled: boolean;
  isInactive: boolean;
  daysUntilExpiry: number | null;
  discountDisplay: string;
}

/** Prefer a campaign-specific destination over the merchant's generic homepage. */
export function getPromocodeRedirectUrl(promocode: Promocode): string | null {
  return promocode.link || promocode.store?.websiteUrl || promocode.brand?.websiteUrl || null;
}

export function getPromocodeDisplayData(
  promocode: Promocode,
  translations: { card: Record<string, string> }
): PromocodeDisplayData {
  const translation = promocode.translations?.[0];
  const brandTranslation = promocode.brand?.translations?.[0];
  const storeTranslation = promocode.store?.translations?.[0];
  const categoryTranslation = promocode.category?.translations?.[0];
  const tCard = translations.card;

  const displayName =
    storeTranslation?.name || brandTranslation?.name || tCard.unknownStore || tCard.storeTitle;
  const displayImage = getApprovedImageUrl(
    promocode.store?.logoUrl || promocode.brand?.imageUrl || promocode.category?.imageUrl || null
  );
  const displayUrl = promocode.store?.websiteUrl || promocode.brand?.websiteUrl || null;
  const displaySlug =
    storeTranslation?.slug || brandTranslation?.slug || categoryTranslation?.slug || null;
  const displayType = promocode.store ? "store" : promocode.brand ? "brand" : "category";

  // Expiry calculations
  const expiryDate = promocode.expiresAt ? new Date(promocode.expiresAt) : null;
  const isExpired = expiryDate ? expiryDate < new Date() : false;
  const isDisabled =
    promocode.status === "disabled" ||
    promocode.status === "expired" ||
    promocode.status === "draft";
  const isInactive = isExpired || isDisabled;
  const daysUntilExpiry = expiryDate
    ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Discount display — fixed locale avoids Node vs browser toLocaleString mismatches
  const discountDisplay =
    promocode.discountType === "percent"
      ? `${promocode.discountValue}%`
      : `${numberFormatter.format(promocode.discountValue ?? 0)} ${promocode.currency || "UZS"}`;

  return {
    translation,
    brandTranslation,
    storeTranslation,
    categoryTranslation,
    displayName,
    displayImage,
    displayUrl,
    displaySlug,
    displayType,
    expiryDate,
    isExpired,
    isDisabled,
    isInactive,
    daysUntilExpiry,
    discountDisplay,
  };
}
