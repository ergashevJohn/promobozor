"use client";

import { useLocaleSwitch } from "@/lib/use-locale-switch";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { useLocale } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

const languageOptions = [
  { value: "uz", label: "O'zbekcha", short: "O'z" },
  { value: "ru", label: "Русский", short: "Ru" },
  { value: "en", label: "English", short: "En" },
] as const;

type LocaleValue = (typeof languageOptions)[number]["value"];

function ResponsiveLabel({ label, short }: { label: string; short: string }) {
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{label}</span>
    </>
  );
}

/**
 * Language switcher component
 * Custom listbox so mobile/desktop labels can use real CSS (native <option> cannot).
 * On detail pages (promocode, store, brand, category), it fetches the correct slug
 * for the target language before navigating.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const { switchLocale, isLoading } = useLocaleSwitch();
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const current = languageOptions.find((option) => option.value === locale) ?? languageOptions[0];
  const selectedIndex = languageOptions.findIndex((option) => option.value === current.value);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const selectLocale = useCallback(
    async (nextLocale: LocaleValue) => {
      close();
      await switchLocale(nextLocale, locale);
    },
    [close, locale, switchLocale]
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    const focusIndex = selectedIndex >= 0 ? selectedIndex : 0;
    optionRefs.current[focusIndex]?.focus();
  }, [open, selectedIndex]);

  const focusOption = (index: number) => {
    const next = (index + languageOptions.length) % languageOptions.length;
    optionRefs.current[next]?.focus();
  };

  const onButtonKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const activeIndex = optionRefs.current.findIndex((node) => node === document.activeElement);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusOption(activeIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusOption(activeIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        focusOption(0);
        break;
      case "End":
        event.preventDefault();
        focusOption(languageOptions.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        close();
        buttonRef.current?.focus();
        break;
      case "Tab":
        close();
        break;
      default:
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative flex items-center">
      <span id={`${listboxId}-label`} className="sr-only">
        Select language / Tilni tanlang / Выберите язык
      </span>
      <button
        ref={buttonRef}
        type="button"
        id={`${listboxId}-button`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={`${listboxId}-label ${listboxId}-button`}
        disabled={isLoading}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onButtonKeyDown}
        className="border-input text-foreground focus-visible:border-ring focus-visible:ring-ring/50 bg-card/90 relative flex h-11 w-18 items-center rounded-full border pr-8 pl-3 text-left text-xs font-medium shadow-[0_16px_36px_-30px_rgba(17,24,39,0.45)] transition-[border-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 sm:w-28 md:w-[148px] md:pl-4 md:text-sm"
      >
        <ResponsiveLabel label={current.label} short={current.short} />
        <CaretDown
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={`${listboxId}-label`}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="border-border bg-card absolute top-[calc(100%+0.35rem)] right-0 z-50 min-w-full overflow-hidden rounded-2xl border py-1 shadow-[0_18px_50px_-28px_rgba(17,24,39,0.45)]"
        >
          {languageOptions.map((option, index) => {
            const selected = option.value === current.value;
            return (
              <button
                key={option.value}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={isLoading}
                onClick={() => {
                  void selectLocale(option.value);
                }}
                className={
                  selected
                    ? "bg-muted text-foreground flex w-full items-center px-3 py-2.5 text-left text-xs font-semibold md:px-4 md:text-sm"
                    : "text-foreground hover:bg-muted/70 flex w-full items-center px-3 py-2.5 text-left text-xs font-medium md:px-4 md:text-sm"
                }
              >
                <ResponsiveLabel label={option.label} short={option.short} />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
