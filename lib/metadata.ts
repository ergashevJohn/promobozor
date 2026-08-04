import type { Metadata } from "next";

// Cyrillic characters (uz, ru) take more visual space, so use shorter limits
const MAX_TITLE_LENGTH_LATIN = 62; // Allow fuller intent while staying SERP-friendly
const MAX_TITLE_LENGTH_CYRILLIC = 56; // Cyrillic/Uzbek still needs a slightly shorter limit
const MAX_DESCRIPTION_LENGTH = 165; // Keep room for richer summaries before truncation

function truncateTitle(title: string, locale: string = "uz"): string {
  // Cyrillic languages (uz, ru) have shorter limit for better SERP display
  const maxLength =
    locale === "uz" || locale === "ru" ? MAX_TITLE_LENGTH_CYRILLIC : MAX_TITLE_LENGTH_LATIN;
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3).trimEnd() + "...";
}

function truncateDescription(description: string): string {
  if (description.length <= MAX_DESCRIPTION_LENGTH) return description;
  return description.substring(0, MAX_DESCRIPTION_LENGTH - 3).trimEnd() + "...";
}

/**
 * Get base URL for the application
 * Handles trailing slashes and ensures proper protocol
 */
export function getBaseUrl(): string {
  let url: string;

  // 1. Production: Use explicit NEXT_PUBLIC_BASE_URL if set
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    url = process.env.NEXT_PUBLIC_BASE_URL;
  }
  // 2. Vercel preview deployments: Use VERCEL_URL
  else if (process.env.VERCEL_URL) {
    url = `https://${process.env.VERCEL_URL}`;
  }
  // 3. Development fallback
  else {
    url = "http://localhost:3000";
  }

  // Remove trailing slash for consistency
  return url.replace(/\/$/, "");
}

/**
 * Generate dynamic OG image URL
 */
export function generateOgImageUrl(params: {
  title: string;
  description?: string;
  type?: "default" | "store" | "category" | "brand" | "promocode";
  logo?: string;
  discount?: string;
}): string {
  const baseUrl = getBaseUrl();
  const searchParams = new URLSearchParams({
    title: params.title,
    ...(params.description && { description: params.description }),
    ...(params.type && { type: params.type }),
    ...(params.logo && { logo: params.logo }),
    ...(params.discount && { discount: params.discount }),
  });

  return `${baseUrl}/api/og?${searchParams.toString()}`;
}

/**
 * Generate Open Graph metadata
 */
function generateOpenGraph(
  title: string,
  description: string,
  url: string,
  image?: string,
  type: "website" | "article" = "website",
  locale: string = "uz"
): Metadata["openGraph"] {
  const baseUrl = getBaseUrl();
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${baseUrl}${image}`
    : `${baseUrl}/${locale}/opengraph-image`; // Default OG image (locale-aware)

  return {
    title,
    description,
    url: url.startsWith("http") ? url : `${baseUrl}${url}`,
    siteName: "PromoBozor",
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
    locale: locale === "uz" ? "uz_UZ" : locale === "ru" ? "ru_RU" : "en_US",
    type,
  };
}

/**
 * Generate Twitter Card metadata
 */
function generateTwitterCard(
  title: string,
  description: string,
  image?: string,
  locale: string = "uz"
): Metadata["twitter"] {
  const baseUrl = getBaseUrl();
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${baseUrl}${image}`
    : `${baseUrl}/${locale}/opengraph-image`; // Default Twitter image (locale-aware)

  return {
    card: "summary_large_image",
    title,
    description,
    images: [imageUrl],
  };
}

/**
 * Generate full metadata with Open Graph and Twitter Card
 */
export function generateFullMetadata(
  title: string,
  description: string,
  url: string,
  image?: string,
  type: "website" | "article" = "website",
  locale: string = "uz",
  path: string = "",
  alternatesOverride?: Record<string, string>
): Metadata {
  const baseUrl = getBaseUrl();

  // Auto-generate alternates if path is provided
  let alternates = undefined;
  if (path) {
    // Ensure path starts with / via simple check
    const safePath = path.startsWith("/") ? path : `/${path}`;
    // For root path "/", avoid double slashes//trailing slash issues if desired
    // Standardize: if path is exactly "/", treat as empty suffix for cleaner URLs
    const urlSuffix = safePath === "/" ? "" : safePath;

    alternates = {
      canonical: `${baseUrl}/${locale}${urlSuffix}`,
      languages: {
        // x-default: primary language (uz) - fallback when no locale matches (Technical SEO)
        "x-default": `${baseUrl}/uz${urlSuffix}`,
        uz: `${baseUrl}/uz${urlSuffix}`,
        ru: `${baseUrl}/ru${urlSuffix}`,
        en: `${baseUrl}/en${urlSuffix}`,
      },
    };
  }

  // If override is provided (for dynamic pages with different slugs), use it
  if (alternatesOverride) {
    const absoluteAlternates: Record<string, string> = {};
    Object.entries(alternatesOverride).forEach(([lang, link]) => {
      absoluteAlternates[lang] = link.startsWith("http")
        ? link
        : `${baseUrl}${link.startsWith("/") ? link : `/${link}`}`;
    });

    // x-default: primary language fallback for Technical SEO (Google hreflang)
    if (!absoluteAlternates["x-default"]) {
      absoluteAlternates["x-default"] = absoluteAlternates["uz"] || `${baseUrl}/uz`;
    }

    alternates = {
      canonical: url.startsWith("http") ? url : `${baseUrl}${url}`,
      languages: absoluteAlternates,
    };
  }

  return {
    title,
    description,
    openGraph: generateOpenGraph(title, description, url, image, type, locale),
    twitter: generateTwitterCard(title, description, image, locale),
    alternates,
  };
}

/**
 * Generate SEO-optimized title for store page
 * Note: Date removed to prevent title churn in search results
 */
export function generateStoreTitle(
  storeName: string,
  promocodeCount: number,
  locale: string
): string {
  const titles = {
    uz: `${storeName} Promokodlari - ${promocodeCount} ta chegirma`,
    ru: `Промокоды ${storeName} - ${promocodeCount} скидок`,
    en: `${storeName} Promocodes - ${promocodeCount} deals`,
  };

  return truncateTitle(titles[locale as keyof typeof titles] || titles.uz, locale);
}

/**
 * Generate SEO-optimized description for store page
 */
export function generateStoreDescription(
  storeName: string,
  description: string | null,
  promocodeCount: number,
  featuredCount: number,
  locale: string
): string {
  if (description && description.length > 50) {
    return description;
  }

  const descriptions = {
    uz: `${storeName} do'kondagi eng yaxshi promokodlar va chegirmalar. Jami ${promocodeCount} ta promokod, shundan ${featuredCount} ta eksklusiv taklif. Bugungi chegirmalarni oling va tejang!`,
    ru: `Лучшие промокоды и скидки для ${storeName}. Всего ${promocodeCount} промокодов, включая ${featuredCount} эксклюзивных предложений. Получите скидки сегодня!`,
    en: `Best promocodes and discounts for ${storeName}. Total ${promocodeCount} promocodes, including ${featuredCount} exclusive offers. Get your discounts today!`,
  };

  return truncateDescription(descriptions[locale as keyof typeof descriptions] || descriptions.uz);
}

/**
 * Generate SEO-optimized title for category page
 */
export function generateCategoryTitle(
  categoryName: string,
  promocodeCount: number,
  locale: string
): string {
  const titles = {
    uz: `${categoryName} Promokodlari - ${promocodeCount} ta chegirma`,
    ru: `Промокоды ${categoryName} - ${promocodeCount} скидок`,
    en: `${categoryName} Promocodes - ${promocodeCount} discounts`,
  };

  return truncateTitle(titles[locale as keyof typeof titles] || titles.uz, locale);
}

/**
 * Generate SEO-optimized description for category page
 */
export function generateCategoryDescription(
  categoryName: string,
  description: string | null,
  promocodeCount: number,
  storeCount: number,
  locale: string
): string {
  if (description && description.length > 50) {
    return description;
  }

  const descriptions = {
    uz: `${categoryName} kategoriyasidagi eng yaxshi promokodlar. ${storeCount}+ do'kondan ${promocodeCount} ta active promokod. O'zingizga mos taklifni toping!`,
    ru: `Лучшие промокоды в категории ${categoryName}. ${promocodeCount} активных промокодов от ${storeCount}+ магазинов. Найдите подходящее предложение!`,
    en: `Best promocodes in ${categoryName} category. ${promocodeCount} active promocodes from ${storeCount}+ stores. Find your perfect deal!`,
  };

  return truncateDescription(descriptions[locale as keyof typeof descriptions] || descriptions.uz);
}

/**
 * Generate SEO-optimized title for brand page
 */
export function generateBrandTitle(
  brandName: string,
  promocodeCount: number,
  locale: string
): string {
  const titles = {
    uz: `${brandName} Promokodlari - ${promocodeCount} ta chegirma`,
    ru: `Промокоды ${brandName} - ${promocodeCount} скидок`,
    en: `${brandName} Promocodes - ${promocodeCount} discounts`,
  };

  return truncateTitle(titles[locale as keyof typeof titles] || titles.uz, locale);
}

/**
 * Generate SEO-optimized description for brand page
 */
export function generateBrandDescription(
  brandName: string,
  description: string | null,
  promocodeCount: number,
  locale: string
): string {
  if (description && description.length > 50) {
    return description;
  }

  const descriptions = {
    uz: `${brandName} brendining rasmiy promokodlari va chegirmalari. ${promocodeCount} ta active kupon va taklif. Tekshirilgan va ishlaydigan kodlar.`,
    ru: `Официальные промокоды и скидки бренда ${brandName}. ${promocodeCount} активных купонов и предложений. Проверенные и рабочие коды.`,
    en: `Official promocodes and discounts for ${brandName} brand. ${promocodeCount} active coupons and offers. Verified and working codes.`,
  };

  return truncateDescription(descriptions[locale as keyof typeof descriptions] || descriptions.uz);
}

/**
 * Generate SEO-optimized title for promocode page
 */
export function generatePromocodeTitle(
  promocodeTitle: string,
  storeName: string,
  discount: string | null,
  locale: string
): string {
  const discountText = discount ? ` - ${discount}` : "";

  const titles = {
    uz: `${promocodeTitle}${discountText} | ${storeName} Promokodi`,
    ru: `${promocodeTitle}${discountText} | Промокод ${storeName}`,
    en: `${promocodeTitle}${discountText} | ${storeName} Promocode`,
  };

  return truncateTitle(titles[locale as keyof typeof titles] || titles.uz, locale);
}

/**
 * Generate SEO-optimized description for promocode page
 */
export function generatePromocodeDescription(
  promocodeTitle: string,
  storeName: string,
  discount: string | null,
  conditions: string | null,
  locale: string
): string {
  const discountText = discount ? `${discount} ` : "";
  const conditionsText = conditions ? conditions.substring(0, 100) : "";

  const descriptions = {
    uz: `${promocodeTitle} - ${storeName} do'koni uchun ${discountText}chegirma promokod.${conditionsText ? ` Shartlar: ${conditionsText}` : ""} Kodni nusxalang va tejang!`,
    ru: `${promocodeTitle} - промокод на скидку ${discountText}для ${storeName}.${conditionsText ? ` Условия: ${conditionsText}` : ""} Скопируйте код и сэкономьте!`,
    en: `${promocodeTitle} - ${discountText}discount promocode for ${storeName}.${conditionsText ? ` Conditions: ${conditionsText}` : ""} Copy the code and save!`,
  };

  return truncateDescription(descriptions[locale as keyof typeof descriptions] || descriptions.uz);
}
