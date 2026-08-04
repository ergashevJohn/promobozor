export type Language = "uz" | "ru" | "en";

export const SUPPORTED_LANGUAGES: Language[] = ["uz", "ru", "en"];

export function isValidLanguage(lang: string): lang is Language {
  return SUPPORTED_LANGUAGES.includes(lang as Language);
}
