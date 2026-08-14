import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageSwitcher } from "./language-switcher";

const switchLocale = vi.fn(async () => undefined);

vi.mock("next-intl", () => ({
  useLocale: () => "uz",
}));

vi.mock("@/lib/use-locale-switch", () => ({
  useLocaleSwitch: () => ({
    switchLocale,
    isLoading: false,
    error: null,
  }),
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    switchLocale.mockClear();
  });

  function getToggle() {
    return screen.getByRole("button", { name: /tilni tanlang/i });
  }

  it("shows responsive labels on the closed button", () => {
    render(<LanguageSwitcher />);
    const toggle = getToggle();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle.querySelector(".sm\\:hidden")?.textContent).toBe("O'z");
    expect(toggle.querySelector(".hidden.sm\\:inline")?.textContent).toBe("O'zbekcha");
  });

  it("opens a listbox and selects another locale", async () => {
    render(<LanguageSwitcher />);
    const toggle = getToggle();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: /english/i }));

    await waitFor(() => {
      expect(switchLocale).toHaveBeenCalledWith("en", "uz");
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and restores focus to the toggle", () => {
    render(<LanguageSwitcher />);
    const toggle = getToggle();

    fireEvent.click(toggle);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });
});
