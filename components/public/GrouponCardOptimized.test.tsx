/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GrouponCardOptimized from "./GrouponCardOptimized";
import type { Promocode } from "./types";

vi.mock("next/image", () => ({
  default: ({ alt, src, className }: any) => (
    <span
      data-testid="next-image"
      data-src={src}
      role="img"
      aria-label={alt}
      className={className}
    />
  ),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  BadgeCheck: ({ className }: any) => <span data-testid="icon-badge-check" className={className} />,
  Clock: ({ className }: any) => <span data-testid="icon-clock" className={className} />,
  Clock3: ({ className }: any) => <span data-testid="icon-clock-3" className={className} />,
  Copy: ({ className }: any) => <span data-testid="icon-copy" className={className} />,
  Eye: ({ className }: any) => <span data-testid="icon-eye" className={className} />,
  Star: ({ className }: any) => <span data-testid="icon-star" className={className} />,
  TicketPercent: ({ className }: any) => (
    <span data-testid="icon-ticket-percent" className={className} />
  ),
}));

vi.mock("./GrouponCardActions", () => ({
  GrouponCardActions: ({ disabled, translations }: { disabled?: boolean; translations: any }) => (
    <button type="button" aria-label={translations.copy} disabled={disabled}>
      {translations.copy}
    </button>
  ),
}));

describe("GrouponCardOptimized", () => {
  const translations = {
    featured: "Featured",
    verified: "Verified",
    fresh: "Fresh",
    popular: "Popular",
    endingSoon: "Ending Soon",
    unlimited: "Unlimited",
    unknownStore: "Unknown Store",
    storeTitle: "Store",
    promocodeTitle: "Promocode",
    activateLink: "Activate the link",
    details: "Details",
    viewDetails: "View Details",
    storeOffer: "Store offer",
    brandOffer: "Brand offer",
    directDeal: "Direct deal",
    codeReady: "Code ready",
    dealRoute: "Deal route",
    promoCodeLabel: "Promo code",
    copy: "Copy",
    copied: "Copied",
    getDeal: "Get Deal",
    like: "Like",
    dislike: "Dislike",
    codeCopied: "Code copied!",
    copyError: "Failed to copy",
    expired: "Expired",
    disabled: "Disabled",
  };

  const expiredPromocode: Promocode = {
    id: "promo-expired",
    type: "code",
    code: "OLDCODE",
    discountType: "amount",
    discountValue: 15000,
    currency: "UZS",
    isFeatured: false,
    status: "expired",
    viewsCount: 12,
    copyCount: 3,
    likesCount: 1,
    dislikesCount: 0,
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
    translations: [
      {
        language: "en",
        title: "Expired promo",
        slug: "expired-promo",
      },
    ],
    store: {
      id: "store-1",
      logoUrl: "/store-logo.png",
      translations: [{ language: "en", name: "Test Store", slug: "test-store" }],
    },
    category: null,
    brand: null,
  };

  it("disables copy actions for inactive promocodes", async () => {
    render(<GrouponCardOptimized promocode={expiredPromocode} translations={translations} />);

    expect(screen.getByText("Expired")).toBeInTheDocument();

    const copyButton = await waitFor(() => screen.getByRole("button", { name: "Copy" }));
    expect(copyButton).toBeDisabled();
    expect(screen.queryByLabelText(/^Details -/)).not.toBeInTheDocument();
  });
});
