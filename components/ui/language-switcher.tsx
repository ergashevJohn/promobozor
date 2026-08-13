"use client";

import { useLocaleSwitch } from "@/lib/use-locale-switch";
import { CaretDown } from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import { type ChangeEvent } from "react";

const languageOptions = [
  { value: "uz", label: "O'zbekcha", short: "O'z" },
  { value: "ru", label: "Русский", short: "Ru" },
  { value: "en", label: "English", short: "En" },
] as const;

/**
 * Language switcher component
 * Accessible select dropdown for changing site language
 * On detail pages (promocode, store, brand, category), it fetches the correct slug
 * for the target language before navigating.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const { switchLocale, isLoading } = useLocaleSwitch();

  const handleLanguageChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value;
    await switchLocale(newLocale, locale);
  };

  return (
    <div className="relative flex items-center">
      <label htmlFor="language-selector" className="sr-only">
        Select language / Tilni tanlang / Выберите язык
      </label>
      <select
        id="language-selector"
        value={locale}
        onChange={handleLanguageChange}
        disabled={isLoading}
        className="border-input text-foreground focus-visible:border-ring focus-visible:ring-ring/50 bg-card/90 h-11 w-18 appearance-none rounded-full border pr-8 pl-3 text-xs font-medium shadow-[0_16px_36px_-30px_rgba(17,24,39,0.45)] transition-[border-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 sm:w-28 md:w-[148px] md:pl-4 md:text-sm"
      >
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            <span className="hidden sm:block">{option.label}</span>
            <span className="block sm:hidden">{option.short}</span>
          </option>
        ))}
      </select>
      <CaretDown className="text-muted-foreground pointer-events-none absolute right-3 h-4 w-4" />
    </div>
  );
}
