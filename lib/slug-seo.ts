import { generateSlug } from "@/lib/slug";
import type { Language } from "@/lib/i18n";

const STOP_WORDS = new Set([
  "promokod",
  "promokodi",
  "promocode",
  "promo-code",
  "promo",
  "kod",
  "code",
  "referral-code",
  "referal",
  "referral",
]);

const STORE_SUFFIX: Record<Language, string> = {
  uz: "chegirmalar",
  ru: "skidki",
  en: "deals",
};

const BRAND_SUFFIX: Record<Language, string> = {
  uz: "chegirmalar",
  ru: "skidki",
  en: "deals",
};

/** Alphanumeric token that looks like a promo code (mixed letters+digits, length 5–12) */
const CODE_LIKE_TOKEN =
  /^[a-z0-9]*[0-9][a-z0-9]*[a-z][a-z0-9]*$|^[a-z0-9]*[a-z][a-z0-9]*[0-9][a-z0-9]*$/i;

export function stripPromocodeCode(text: string, code?: string | null): string {
  let result = text;
  if (code && code.trim()) {
    const escaped = code.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "gi"), " ");
  }
  return result;
}

function removeStopWordsAndCodeTokens(slugParts: string[], code?: string | null): string[] {
  const codeNormalized = code?.trim().toLowerCase() ?? "";
  return slugParts.filter((part) => {
    const lower = part.toLowerCase();
    if (!lower) return false;
    if (STOP_WORDS.has(lower)) return false;
    if (codeNormalized && lower === codeNormalized) return false;
    // Drop short random-looking tokens (length 5–12 with mixed letters and digits)
    if (lower.length >= 5 && lower.length <= 12 && CODE_LIKE_TOKEN.test(lower)) {
      // Keep pure numbers like "30", "30000", "50"
      if (/^\d+$/.test(lower)) return true;
      return false;
    }
    return true;
  });
}

function joinUniqueParts(parts: string[], maxLength = 100): string {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    if (!part || seen.has(part)) continue;
    seen.add(part);
    unique.push(part);
  }
  let slug = unique
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength).replace(/-+$/, "");
  }
  return slug;
}

export function ensureUniqueSlug(
  baseSlug: string,
  used: Set<string> | Map<string, string>,
  ownerId?: string
): string {
  const initial = baseSlug || "item";
  let candidate = initial;
  let seq = 2;

  while (true) {
    if (used instanceof Map) {
      const existing = used.get(candidate);
      if (!existing || (ownerId && existing === ownerId)) {
        used.set(candidate, ownerId ?? candidate);
        return candidate;
      }
    } else if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }

    const suffix = `-${seq}`;
    const truncated = initial.slice(0, Math.max(1, 100 - suffix.length));
    candidate = `${truncated}${suffix}`;
    seq += 1;
  }
}

export type PromocodeSeoSlugInput = {
  storeName: string;
  title: string;
  code?: string | null;
  discountPercent?: number | null;
  language: Language;
};

/**
 * Format: {store}-{benefit} without promo codes or "promokod" stop-words.
 */
export function generatePromocodeSeoSlug(input: PromocodeSeoSlugInput): string {
  const { storeName, title, code, discountPercent, language } = input;
  const cleanedTitle = stripPromocodeCode(title, code);
  const storeSlug = generateSlug(storeName);
  const titleSlug = generateSlug(cleanedTitle);
  const titleParts = removeStopWordsAndCodeTokens(titleSlug.split("-").filter(Boolean), code);

  // Drop store name tokens already present in title to avoid duplication
  const storeParts = new Set(storeSlug.split("-").filter(Boolean));
  const benefitParts = titleParts.filter((p) => !storeParts.has(p));

  const parts = [storeSlug, ...benefitParts].filter(Boolean);

  if (discountPercent != null && discountPercent > 0) {
    const discountToken = String(Math.round(discountPercent));
    if (!parts.includes(discountToken) && !parts.some((p) => p.includes(discountToken))) {
      const hasDiscountWord = parts.some((p) =>
        ["chegirma", "skidka", "discount", "off", "bonus"].includes(p)
      );
      if (!hasDiscountWord) {
        const suffix = language === "uz" ? "chegirma" : language === "ru" ? "skidka" : "discount";
        parts.push(discountToken, suffix);
      }
    }
  }

  const slug = joinUniqueParts(parts);
  return slug || storeSlug || "chegirma";
}

export type StoreSeoSlugInput = {
  storeName: string;
  language: Language;
};

/**
 * Store hub slug: {store}-chegirmalar / {store}-skidki / {store}-deals
 */
export function generateStoreSeoSlug(input: StoreSeoSlugInput): string {
  const base = generateSlug(input.storeName);
  const suffix = STORE_SUFFIX[input.language];
  return joinUniqueParts([base, suffix].filter(Boolean));
}

export type BrandSeoSlugInput = {
  brandName: string;
  language: Language;
};

/**
 * Brand hub slug: {brand}-chegirmalar / {brand}-skidki / {brand}-deals
 */
export function generateBrandSeoSlug(input: BrandSeoSlugInput): string {
  const base = generateSlug(input.brandName);
  const suffix = BRAND_SUFFIX[input.language];
  return joinUniqueParts([base, suffix].filter(Boolean));
}

export type CategorySeoSlugInput = {
  categoryName: string;
  language: Language;
};

/**
 * Category slug from localized name.
 */
export function generateCategorySeoSlug(input: CategorySeoSlugInput): string {
  return generateSlug(input.categoryName) || "kategoriya";
}

export function differentiateFromCompetitor(slug: string, competitorSlugs: Set<string>): string {
  if (!competitorSlugs.has(slug)) {
    return slug;
  }
  return joinUniqueParts([slug, "promobozor"]);
}
