"use client";

import { useLocale } from "next-intl";
import { type ChangeEvent } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { useLocaleSwitch } from "@/lib/use-locale-switch";

const languageOptions = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
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
        className="border-input text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-[7.5rem] appearance-none rounded-full border bg-card/90 pr-8 pl-3 text-xs font-medium shadow-[0_16px_36px_-30px_rgba(17,24,39,0.45)] transition-[border-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 sm:w-28 md:w-[148px] md:pl-4 md:text-sm"
      >
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <CaretDown className="text-muted-foreground pointer-events-none absolute right-3 h-4 w-4" />
    </div>
  );
}
