import type { Promocode } from "./types";

type BaseEntity = {
  id: string;
  translations: Array<{
    language: string;
    name: string;
    slug: string;
    description?: string | null;
  }>;
};

type StructuredDataInput = Promocode | BaseEntity | Record<string, never>;

interface AggregateRating {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

interface StructuredDataProps {
  type: "Promocode" | "Store" | "Category" | "Brand" | "Homepage";
  data: StructuredDataInput;
  lang: string;
  baseUrl: string;
  rating?: AggregateRating;
  promocodeCount?: number; // For entity pages (Store/Category/Brand)
  entityDescription?: string; // Custom description from entity translation
  datePublished?: string; // For Promocode Article schema (ISO date)
  dateModified?: string; // For Promocode WebPage schema (ISO date)
}

type JsonLdSchema = Record<string, unknown>;

export default function StructuredData({
  type,
  data,
  lang,
  baseUrl,
  rating,
  promocodeCount,
  entityDescription,
  datePublished,
  dateModified,
}: StructuredDataProps) {
  let jsonLd: JsonLdSchema | JsonLdSchema[] = {};

  if (type === "Promocode") {
    const promocode = data as Promocode;
    const translation =
      promocode.translations.find((t) => t.language === lang) || promocode.translations[0];
    const storeTranslation =
      promocode.store?.translations.find((t) => t.language === lang) ||
      promocode.store?.translations[0];
    const discountText =
      promocode.discountType === "percent"
        ? `${promocode.discountValue}%`
        : `${promocode.discountValue} ${promocode.currency || "UZS"}`;

    const pageUrl = `${baseUrl}/${lang}/promocode/${translation?.slug || promocode.id}`;
    const isAvailable = !promocode.expiresAt || new Date(promocode.expiresAt) > new Date();

    // WebPage + Offer stack (coupon/promocode best practice)
    const webPageSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#page`,
      name: translation?.title || "Promocode",
      description:
        translation?.conditions ||
        translation?.title ||
        `Promocode for ${storeTranslation?.name || "Store"}`,
      url: pageUrl,
      inLanguage: lang,
      dateModified: dateModified || new Date().toISOString(),
    };

    const articleSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: translation?.title || "Promocode",
      description:
        translation?.conditions ||
        translation?.title ||
        `Promocode for ${storeTranslation?.name || "Store"}`,
      image: promocode.imageUrl || promocode.store?.logoUrl || `${baseUrl}/promobozor-logo.png`,
      datePublished: datePublished || dateModified || new Date().toISOString(),
      dateModified: dateModified || datePublished || new Date().toISOString(),
      author: {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "PromoBozor",
        url: baseUrl,
      },
      publisher: {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "PromoBozor",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/promobozor-logo.png`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${pageUrl}#page`,
      },
      inLanguage: lang,
    };

    // Product schema (with Brand and Offers) as a wrapper for AggregateRating
    const productSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${pageUrl}#product`,
      name: translation?.title || "Promocode",
      description:
        translation?.conditions ||
        translation?.title ||
        `Promocode for ${storeTranslation?.name || "Store"}`,
      image: promocode.imageUrl || promocode.store?.logoUrl || `${baseUrl}/promobozor-logo.png`,
      brand: {
        "@type": "Brand",
        name: storeTranslation?.name || "Store",
      },
      offers: {
        "@type": "Offer",
        "@id": `${pageUrl}#offer`,
        name: `${translation?.title || "Promocode"} — ${discountText}`,
        description:
          translation?.conditions ||
          `Promocode for ${storeTranslation?.name || "Store"}: ${discountText}`,
        price: "0", // Standard for coupons/vouchers
        priceCurrency: promocode.currency || "UZS",
        availability: isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: promocode.store?.websiteUrl || promocode.link || pageUrl,
        ...(promocode.expiresAt && { priceValidUntil: promocode.expiresAt.split("T")[0] }),
        category: "CouponCode",
        ...(promocode.expiresAt && { validThrough: promocode.expiresAt }),
        ...(promocode.startsAt && { availabilityStarts: promocode.startsAt }),
        ...(promocode.expiresAt && { availabilityEnds: promocode.expiresAt }),
        seller: {
          "@type": "Organization",
          name: storeTranslation?.name || "Store",
        },
      },
      ...(rating && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: rating.ratingValue,
          reviewCount: rating.reviewCount,
          bestRating: rating.bestRating || 5,
          worstRating: rating.worstRating || 1,
        },
      }),
    };

    jsonLd = [webPageSchema, productSchema, articleSchema];
  } else if (type === "Store" || type === "Category" || type === "Brand") {
    const entity = data as BaseEntity;
    const translation =
      entity.translations.find((t) => t.language === lang) || entity.translations[0];

    // Build enhanced description
    const entityName = translation?.name || type;
    const countText = promocodeCount
      ? `${promocodeCount}+ active promocodes and discounts`
      : "Active promocodes and discounts";

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: entityName,
      description: entityDescription || `${entityName} - ${countText}`,
      url: `${baseUrl}/${lang}/${type.toLowerCase()}/${translation?.slug || entity.id}`,
      ...(promocodeCount && {
        numberOfItems: promocodeCount,
      }),
      about: {
        "@type": "Thing",
        name: entityName,
        description: `${countText} for ${entityName}`,
      },
    };
  } else if (type === "Homepage") {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "PromoBozor",
      alternateName: ["PromoBozor", "ПромоБозор"],
      description: "PromoBozor - foydali chegirmalar, promokodlar va kuponlarni bir joyda toping",
      url: `${baseUrl}/${lang}`,
      inLanguage: ["uz", "ru", "en"],
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/${lang}/promocodes?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
