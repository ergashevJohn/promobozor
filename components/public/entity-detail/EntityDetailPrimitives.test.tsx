import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityAnchorNav, EntityConnectionPanel, EntityMetricRail } from "./EntityDetailPrimitives";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("Entity detail primitives", () => {
  it("renders accessible anchor navigation and compact metrics", () => {
    render(
      <>
        <EntityAnchorNav
          ariaLabel="On this page"
          items={[
            { href: "#offers", label: "Offers" },
            { href: "#faq", label: "FAQ" },
          ]}
        />
        <EntityMetricRail items={[{ label: "Active offers", value: 12 }]} />
      </>
    );

    expect(screen.getByRole("navigation", { name: "On this page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Offers" })).toHaveAttribute("href", "#offers");
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders entity links and a composed empty state", () => {
    const { rerender } = render(
      <EntityConnectionPanel
        title="Related brands"
        description="Current routes"
        emptyLabel="No links yet."
        hrefPrefix="/brand/"
        icon={<span>icon</span>}
        links={[{ id: "brand-1", name: "Brand One", slug: "brand-one" }]}
      />
    );

    expect(screen.getByRole("link", { name: /brand one/i })).toHaveAttribute(
      "href",
      "/brand/brand-one"
    );

    rerender(
      <EntityConnectionPanel
        title="Related brands"
        description="Current routes"
        emptyLabel="No links yet."
        hrefPrefix="/brand/"
        icon={<span>icon</span>}
        links={[]}
      />
    );

    expect(screen.getByText("No links yet.")).toBeInTheDocument();
  });
});
