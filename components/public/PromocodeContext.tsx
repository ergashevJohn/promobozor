"use client";

import type { Language } from "@/lib/i18n";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Promocode } from "./types";

interface PromocodeTranslations {
  title: string;
  activateLink: string;
  codeCopied: string;
  copied: string;
  copies: string;
  copyCode: string;
  copyError: string;
  discount: string;
  expiresOn: string;
  linkActivated: string;
  promoCode: string;
  promoLink: string;
  redirecting: string;
  relatedOffers: string;
  views: string;
  daysRemaining: string;
  expiryDate: string;
  expired: string;
  share: string;
  terms: string;
  amount: string;
  percentage: string;
}

interface CommonTranslations {
  featured: string;
}

interface CardTranslations {
  activateLink: string;
  copied: string;
  copy: string;
  details: string;
  dislike: string;
  featured: string;
  getDeal: string;
  like: string;
  storeTitle: string;
  promocodeTitle: string;
  unknownStore: string;
  unlimited: string;
  verified: string;
  codeCopied: string;
  copyError: string;
  expired: string;
  disabled: string;
}

interface PromocodeContextValue {
  promocode: Promocode;
  translations: {
    promocode: PromocodeTranslations;
    common: CommonTranslations;
    card: CardTranslations;
  };
  lang?: Language;
  copied: boolean;
  liked: boolean;
  disliked: boolean;
  handleCopy: () => Promise<void>;
  handleShare: () => Promise<void>;
  handleLike: () => void;
  handleDislike: () => void;
}

const PromocodeContext = createContext<PromocodeContextValue | null>(null);

interface PromocodeProviderProps {
  promocode: Promocode;
  lang?: Language;
  translations: {
    promocode: PromocodeTranslations;
    common: CommonTranslations;
    card: CardTranslations;
  };
  children: ReactNode;
}

export function PromocodeProvider({
  promocode,
  lang,
  translations,
  children,
}: PromocodeProviderProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const viewTracked = useRef(false);

  const translation = promocode.translations[0];
  const t = translations.promocode;

  // Get display URL
  const displayUrl = promocode.store?.websiteUrl || promocode.brand?.websiteUrl || null;

  // Track view
  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    navigator.sendBeacon(`/api/promocodes/${promocode.id}/view`);
  }, [promocode.id]);

  // Copy handler
  const handleCopy = useCallback(async () => {
    try {
      let targetUrl: string | null = null;

      if (promocode.type === "link" && promocode.link) {
        targetUrl = promocode.link;
      } else if (promocode.code) {
        await navigator.clipboard.writeText(promocode.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error(t.copyError);
        return;
      }

      const message = promocode.type === "link" ? t.linkActivated : t.codeCopied;
      toast.success(message);

      await fetch(`/api/promocodes/${promocode.id}/copy`, {
        method: "POST",
      });

      const urlToOpen = targetUrl || displayUrl;
      if (urlToOpen) {
        window.open(urlToOpen, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to copy/open link:", err);
      toast.error(t.copyError);
    }
  }, [promocode, t, displayUrl]);

  // Share handler
  const handleShare = useCallback(async () => {
    const shareData = {
      title: translation?.title || t.title,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t.copied);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Share failed:", err);
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t.copied);
      }
    }
  }, [translation, t]);

  // Like handler
  const handleLike = useCallback(() => {
    if (liked) {
      setLiked(false);
      return;
    }
    setDisliked(false);
    setLiked(true);
    // TODO: Implement like API
  }, [liked]);

  // Dislike handler
  const handleDislike = useCallback(() => {
    if (disliked) {
      setDisliked(false);
      return;
    }
    setLiked(false);
    setDisliked(true);
    // TODO: Implement dislike API
  }, [disliked]);

  const value: PromocodeContextValue = useMemo(
    () => ({
      promocode,
      translations,
      lang,
      copied,
      liked,
      disliked,
      handleCopy,
      handleShare,
      handleLike,
      handleDislike,
    }),
    [
      promocode,
      translations,
      lang,
      copied,
      liked,
      disliked,
      handleCopy,
      handleShare,
      handleLike,
      handleDislike,
    ]
  );

  return <PromocodeContext.Provider value={value}>{children}</PromocodeContext.Provider>;
}

export function usePromocode(): PromocodeContextValue {
  const context = useContext(PromocodeContext);
  if (!context) {
    throw new Error("usePromocode must be used within PromocodeProvider");
  }
  return context;
}

// Helper hook for computed values
export function usePromocodeDisplay() {
  const { promocode, translations } = usePromocode();

  const translation = promocode.translations[0];
  const brandTranslation = promocode.brand?.translations[0];
  const storeTranslation = promocode.store?.translations[0];
  const categoryTranslation = promocode.category?.translations[0];
  const tCard = translations.card;

  const displayName = storeTranslation?.name || brandTranslation?.name || tCard.unknownStore;
  const displayImage =
    promocode.store?.logoUrl || promocode.brand?.imageUrl || promocode.category?.imageUrl || null;
  const displayUrl = promocode.store?.websiteUrl || promocode.brand?.websiteUrl || null;
  const displaySlug =
    storeTranslation?.slug || brandTranslation?.slug || categoryTranslation?.slug || null;
  const displayType = promocode.store ? "store" : promocode.brand ? "brand" : "category";

  // Expiry calculations
  const expiryDate = promocode.expiresAt ? new Date(promocode.expiresAt) : null;
  const isExpired = expiryDate && expiryDate < new Date();
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
      : `${promocode.discountValue.toLocaleString()} ${promocode.currency || "UZS"}`;

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
