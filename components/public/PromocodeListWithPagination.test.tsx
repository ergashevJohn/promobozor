import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PromocodeListWithPagination from "./PromocodeListWithPagination";
import type { Promocode } from "./types";

vi.mock("./LoadMore", () => ({
  default: () => <button type="button">load-more</button>,
}));

vi.mock("./PromocodeList", () => ({
  default: ({ promocodes }: { promocodes: Promocode[] }) => (
    <div data-testid="client-list">{promocodes.map((p) => p.id).join(",")}</div>
  ),
}));

const cardTranslations = {
  featured: "featured",
  verified: "verified",
  fresh: "fresh",
  popular: "popular",
  endingSoon: "endingSoon",
  unlimited: "unlimited",
  unknownStore: "unknownStore",
  storeTitle: "store",
  promocodeTitle: "promo",
  activateLink: "activate",
  details: "details",
  viewDetails: "view",
  storeOffer: "storeOffer",
  brandOffer: "brandOffer",
  directDeal: "directDeal",
  codeReady: "codeReady",
  dealRoute: "dealRoute",
  promoCodeLabel: "code",
  copy: "copy",
  copied: "copied",
  getDeal: "getDeal",
  like: "like",
  dislike: "dislike",
  expired: "expired",
  disabled: "disabled",
  codeCopied: "copied",
  copyError: "error",
};

function makePromocode(id: string): Promocode {
  return {
    id,
    type: "code",
    code: "TEST",
    link: null,
    status: "active",
    isFeatured: false,
    discountType: "percent",
    discountValue: 10,
    expiresAt: null,
    imageUrl: null,
    viewsCount: 0,
    copyCount: 0,
    likesCount: 0,
    dislikesCount: 0,
    translations: [{ language: "uz", title: `Promo ${id}`, slug: id, conditions: null }],
    store: null,
    brand: null,
  };
}

describe("PromocodeListWithPagination", () => {
  it("renders SSR children for the initial list instead of client cards", () => {
    render(
      <PromocodeListWithPagination
        initialCount={1}
        initialIds={["a"]}
        totalCount={1}
        listKicker="kicker"
        translations={{
          noPromocodes: "empty",
          noPromocodesDescription: "desc",
          card: cardTranslations,
        }}
      >
        <div data-testid="ssr-list">server-cards</div>
      </PromocodeListWithPagination>
    );

    expect(screen.getByTestId("ssr-list")).toHaveTextContent("server-cards");
    expect(screen.queryByTestId("client-list")).not.toBeInTheDocument();
  });

  it("falls back to client PromocodeList when children are omitted", async () => {
    render(
      <PromocodeListWithPagination
        initialPromocodes={[makePromocode("a"), makePromocode("b")]}
        totalCount={2}
        listKicker="kicker"
        translations={{
          noPromocodes: "empty",
          noPromocodesDescription: "desc",
          card: cardTranslations,
        }}
      />
    );

    expect(await screen.findByTestId("client-list")).toHaveTextContent("a,b");
  });
});
