import { SUPPORTED_LANGUAGES, type Language } from "@/lib/i18n";

/**
 * Common validation utilities for API routes
 * Prevents code duplication and ensures consistent validation across all endpoints
 */

type PromocodeTranslationInput = {
  language: Language;
  title: string;
  slug: string;
  shortDescription?: string | null;
  conditions?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

const normalizeSlug = (slug: string): string => slug.trim().toLowerCase();

export const hasDistinctLanguageSlugs = (
  translations: readonly { language: Language; slug: string }[]
): boolean => {
  const uniqueSlugs = new Set(translations.map((t) => normalizeSlug(t.slug)));
  return uniqueSlugs.size === translations.length;
};

// Promocode Translation Validation
export const validatePromocodeTranslations = (
  translations: unknown
): translations is readonly PromocodeTranslationInput[] => {
  if (!Array.isArray(translations)) return false;
  if (translations.length !== SUPPORTED_LANGUAGES.length) return false;
  const seenLanguages = new Set<Language>();

  for (const t of translations) {
    if (!t.language || !SUPPORTED_LANGUAGES.includes(t.language)) return false;
    if (seenLanguages.has(t.language)) return false;
    seenLanguages.add(t.language);
    if (!t.title || typeof t.title !== "string" || t.title.trim().length === 0) return false;
    if (!t.slug || typeof t.slug !== "string" || t.slug.trim().length === 0) return false;
    if (t.shortDescription && typeof t.shortDescription !== "string") return false;
    if (t.conditions && typeof t.conditions !== "string") return false;
    if (t.metaTitle && typeof t.metaTitle !== "string") return false;
    if (t.metaDescription && typeof t.metaDescription !== "string") return false;
  }

  if (!SUPPORTED_LANGUAGES.every((lang) => seenLanguages.has(lang))) return false;
  if (!hasDistinctLanguageSlugs(translations)) return false;

  return true;
};

// URL Validation
export const validateUrl = (url: string | null | undefined): boolean => {
  if (!url) return true; // null or undefined is allowed
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// Number Range Validation
export const validateNumber = (value: unknown, min: number, max?: number): boolean => {
  const num = parseFloat(value as string);
  if (Number.isNaN(num)) return false;
  if (num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};

// Email Validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// UUID Validation
export const validateId = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};
