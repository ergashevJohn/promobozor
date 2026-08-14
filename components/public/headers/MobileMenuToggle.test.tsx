import { Link } from "@/i18n/navigation";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileMenuToggle } from "./MobileMenuToggle";

let mockPathname = "/";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
  usePathname: () => mockPathname,
}));

describe("MobileMenuToggle", () => {
  beforeEach(() => {
    mockPathname = "/";
    document.body.style.overflow = "";
  });

  function renderMenu() {
    return render(
      <MobileMenuToggle>
        <Link href="/stores">Stores</Link>
      </MobileMenuToggle>
    );
  }

  function queryToggle() {
    return document.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]');
  }

  function getPanel() {
    const toggle = queryToggle();
    return document.getElementById(
      toggle?.getAttribute("aria-controls") ?? ""
    ) as HTMLDialogElement | null;
  }

  function clickBackdrop() {
    const panel = getPanel();
    expect(panel).toBeTruthy();

    const rect = panel!.getBoundingClientRect();
    fireEvent.click(panel!, {
      clientX: rect.left - 10,
      clientY: rect.top - 10,
    });
  }

  it("starts closed with dialog closed and aria-expanded false", () => {
    renderMenu();

    const toggle = queryToggle();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-label", "openMenu");

    const panel = getPanel();
    expect(panel).toBeTruthy();
    expect(panel).not.toHaveAttribute("open");
  });

  it("opens on toggle click with full-width dialog classes", async () => {
    renderMenu();

    fireEvent.click(queryToggle()!);

    await waitFor(() => {
      expect(queryToggle()).toHaveAttribute("aria-expanded", "true");
      expect(queryToggle()).toHaveAttribute("aria-label", "closeMenu");
      expect(getPanel()).toHaveAttribute("open");
    });

    expect(getPanel()?.className).toContain("w-auto");
    expect(getPanel()?.className).toContain("inset-x-3");
  });

  it("closes on second toggle click", async () => {
    renderMenu();

    fireEvent.click(queryToggle()!);
    await waitFor(() => expect(queryToggle()).toHaveAttribute("aria-expanded", "true"));

    fireEvent.click(queryToggle()!);
    await waitFor(() => {
      expect(queryToggle()).toHaveAttribute("aria-expanded", "false");
      expect(getPanel()).not.toHaveAttribute("open");
    });
  });

  it("closes when the in-dialog close button is clicked", async () => {
    renderMenu();

    fireEvent.click(queryToggle()!);
    await waitFor(() => expect(queryToggle()).toHaveAttribute("aria-expanded", "true"));

    const panel = getPanel();
    expect(panel).toBeTruthy();
    const closeButton = panel!.querySelector<HTMLButtonElement>('button[aria-label="closeMenu"]');
    expect(closeButton).toBeTruthy();
    fireEvent.click(closeButton!);

    await waitFor(() => {
      expect(queryToggle()).toHaveAttribute("aria-expanded", "false");
      expect(getPanel()).not.toHaveAttribute("open");
    });
  });

  it("closes on backdrop click", async () => {
    renderMenu();

    fireEvent.click(queryToggle()!);
    await waitFor(() => expect(queryToggle()).toHaveAttribute("aria-expanded", "true"));

    clickBackdrop();

    await waitFor(() => {
      expect(queryToggle()).toHaveAttribute("aria-expanded", "false");
      expect(getPanel()).not.toHaveAttribute("open");
    });
  });

  it("closes on Escape and returns focus to toggle", async () => {
    renderMenu();

    fireEvent.click(queryToggle()!);
    await waitFor(() => expect(queryToggle()).toHaveAttribute("aria-expanded", "true"));

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(queryToggle()).toHaveAttribute("aria-expanded", "false");
      expect(getPanel()).not.toHaveAttribute("open");
      expect(document.activeElement).toBe(queryToggle());
    });
  });

  it("closes when an inner nav link is clicked", async () => {
    renderMenu();

    fireEvent.click(queryToggle()!);
    await waitFor(() => expect(queryToggle()).toHaveAttribute("aria-expanded", "true"));

    fireEvent.click(screen.getByRole("link", { name: "Stores" }));

    await waitFor(() => {
      expect(queryToggle()).toHaveAttribute("aria-expanded", "false");
      expect(getPanel()).not.toHaveAttribute("open");
    });
  });

  it("closes when pathname changes", async () => {
    const { rerender } = renderMenu();

    fireEvent.click(queryToggle()!);
    await waitFor(() => expect(queryToggle()).toHaveAttribute("aria-expanded", "true"));

    mockPathname = "/stores";
    rerender(
      <MobileMenuToggle>
        <Link href="/stores">Stores</Link>
      </MobileMenuToggle>
    );

    await waitFor(() => {
      expect(queryToggle()).toHaveAttribute("aria-expanded", "false");
      expect(getPanel()).not.toHaveAttribute("open");
    });
  });
});
