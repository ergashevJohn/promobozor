/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GrouponCard from "./GrouponCard";
import { Promocode } from "./types";

// Mock dependencies
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    className,
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    ...rest
  }: any) => (
    <span
      data-testid="next-image"
      data-src={src}
      role="img"
      aria-label={alt}
      className={className}
      {...rest}
    />
  ),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Phosphor icons
vi.mock("@phosphor-icons/react", () => ({
  SealCheck: ({ className }: any) => <span data-testid="icon-badge-check" className={className} />,
  Check: ({ className }: any) => <span data-testid="icon-check" className={className} />,
  Clock: ({ className }: any) => <span data-testid="icon-clock" className={className} />,
  Copy: ({ className }: any) => <span data-testid="icon-copy" className={className} />,
  Eye: ({ className }: any) => <span data-testid="icon-eye" className={className} />,
  CircleNotch: ({ className }: any) => <span data-testid="icon-loader" className={className} />,
  Star: ({ className }: any) => <span data-testid="icon-star" className={className} />,
  Ticket: ({ className }: any) => <span data-testid="icon-ticket-percent" className={className} />,
  ThumbsDown: ({ className }: any) => <span data-testid="icon-thumbs-down" className={className} />,
  ThumbsUp: ({ className }: any) => <span data-testid="icon-thumbs-up" className={className} />,
}));

vi.mock("@phosphor-icons/react/dist/ssr", () => ({
  SealCheck: ({ className }: any) => <span data-testid="icon-badge-check" className={className} />,
  Check: ({ className }: any) => <span data-testid="icon-check" className={className} />,
  Clock: ({ className }: any) => <span data-testid="icon-clock" className={className} />,
  Copy: ({ className }: any) => <span data-testid="icon-copy" className={className} />,
  Eye: ({ className }: any) => <span data-testid="icon-eye" className={className} />,
  CircleNotch: ({ className }: any) => <span data-testid="icon-loader" className={className} />,
  Star: ({ className }: any) => <span data-testid="icon-star" className={className} />,
}));

// Mock API calls
global.fetch = vi.fn();

describe("GrouponCard", () => {
  const mockPromocode: Promocode = {
    id: "promo-1",
    type: "code",
    code: "TESTCODE",
    discountType: "amount",
    discountValue: 50000,
    currency: "UZS",
    isFeatured: false,
    status: "active",
    viewsCount: 10,
    copyCount: 5,
    likesCount: 2,
    dislikesCount: 0,
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    translations: [
      {
        language: "uz",
        title: "Test Promo",
        slug: "test-promo",
        conditions: "Test conditions",
      },
    ],
    store: {
      id: "store-1",
      translations: [{ language: "uz", name: "Test Store", slug: "test-store" }],
      logoUrl: "/store-logo.png",
    },
    category: null,
    brand: null,
  };

  const mockTranslations = {
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

  it("renders correctly with basic info", () => {
    render(<GrouponCard promocode={mockPromocode} translations={mockTranslations} />);

    expect(screen.getByText("Test Store")).toBeInTheDocument();
    expect(screen.getByText("Test Promo")).toBeInTheDocument();
    expect(screen.getByText("-50000 UZS")).toBeInTheDocument();
    expect(screen.getByText("TESTCODE")).toBeInTheDocument();
    expect(screen.queryByText("Fresh")).not.toBeInTheDocument();
    expect(screen.queryByText("Popular")).not.toBeInTheDocument();
  });

  it("renders with percent discount", () => {
    const percentPromo = {
      ...mockPromocode,
      discountType: "percent" as const,
      discountValue: 20,
    };

    render(<GrouponCard promocode={percentPromo} translations={mockTranslations} />);
    expect(screen.getByText("-20%")).toBeInTheDocument();
  });

  it("renders with different currency (USD)", () => {
    const usdPromo = {
      ...mockPromocode,
      currency: "USD" as const,
      discountValue: 10,
    };

    render(<GrouponCard promocode={usdPromo} translations={mockTranslations} />);
    expect(screen.getByText("-10 USD")).toBeInTheDocument();
  });

  it("does not use a full-card stretch link", () => {
    const { container } = render(
      <GrouponCard promocode={mockPromocode} translations={mockTranslations} />
    );

    expect(container.querySelector("a.absolute.inset-0")).toBeNull();
  });

  it("shows promo link activation for link type", () => {
    const linkPromo = {
      ...mockPromocode,
      type: "link" as const,
      link: "https://example.com",
    };

    render(<GrouponCard promocode={linkPromo} translations={mockTranslations} />);

    // Check for "Activate the link" text (translation value)
    expect(screen.getByText("Activate the link")).toBeInTheDocument();
  });

  it("links title to details page", () => {
    render(<GrouponCard promocode={mockPromocode} translations={mockTranslations} />);

    const detailLink = screen.getByRole("link", { name: /Test Promo/i });
    expect(detailLink).toHaveAttribute("href", "/promocode/test-promo");
    expect(screen.queryByText("View Details")).not.toBeInTheDocument();
  });

  it("handles copy action", async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<GrouponCard promocode={mockPromocode} translations={mockTranslations} />);

    const copyButton = screen.getByLabelText("Copy"); // Based on aria-label with translation value
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith("TESTCODE");
    });
  });

  it("renders expired status correctly", () => {
    const expiredPromo = {
      ...mockPromocode,
      status: "expired" as const,
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    };

    render(<GrouponCard promocode={expiredPromo} translations={mockTranslations} />);

    // Should show "Expired" badge
    expect(screen.getByText("Expired")).toBeInTheDocument();

    // Title should not be an active detail link when inactive
    expect(screen.queryByLabelText(/^Details -/)).not.toBeInTheDocument();
    expect(screen.queryByText("View Details")).not.toBeInTheDocument();

    const cardContainer = screen.getByRole("article");
    expect(cardContainer).toHaveClass("grayscale");
    expect(cardContainer).not.toHaveClass("opacity-60");
  });

  it("renders disabled status correctly", () => {
    const disabledPromo = {
      ...mockPromocode,
      status: "disabled" as const,
    };

    render(<GrouponCard promocode={disabledPromo} translations={mockTranslations} />);

    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Details -/)).not.toBeInTheDocument();
    expect(screen.queryByText("View Details")).not.toBeInTheDocument();

    const cardContainer = screen.getByRole("article");
    expect(cardContainer).toHaveClass("grayscale");
    expect(cardContainer).not.toHaveClass("opacity-60");
  });
});
