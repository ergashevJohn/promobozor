import type { Promocode } from "@/components/public/types";
import { getApprovedImageUrl } from "@/lib/media";

export interface PromocodeDisplayData {
  translation: Record<string, string | null> | undefined;
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

  // Discount display
  const discountDisplay =
    promocode.discountType === "percent"
      ? `${promocode.discountValue}%`
      : `${promocode.discountValue?.toLocaleString()} ${promocode.currency || "UZS"}`;

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
