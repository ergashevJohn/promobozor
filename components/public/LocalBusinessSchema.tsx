import { getBaseUrl } from "@/lib/metadata";

interface AggregateRating {
  ratingValue: number; // e.g., 4.5
  reviewCount: number; // e.g., 150
  bestRating?: number; // e.g., 5 (default)
  worstRating?: number; // e.g., 1 (default)
}

interface LocalBusinessSchemaProps {
  name: string;
  url: string;
  description?: string;
  image?: string;
  logo?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  telephone?: string;
  email?: string;
  priceRange?: string; // e.g., "$$" or "10000-50000 UZS"
  rating?: AggregateRating;
  openingHours?: string[]; // e.g., ["Mo-Fr 09:00-18:00"]
  sameAs?: string[]; // Social media links
}

/**
 * LocalBusiness structured data (Schema.org) for stores and brands
 * Helps search engines understand business information
 * Supports rich snippets in search results
 */
export function LocalBusinessSchema({
  name,
  url,
  description,
  image,
  logo,
  address,
  telephone,
  email,
  priceRange,
  rating,
  openingHours,
  sameAs,
}: LocalBusinessSchemaProps) {
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
  const fullImage = image ? (image.startsWith("http") ? image : `${baseUrl}${image}`) : undefined;
  const fullLogo = logo ? (logo.startsWith("http") ? logo : `${baseUrl}${logo}`) : undefined;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: fullUrl,
    ...(description && { description }),
    ...(fullImage && { image: fullImage }),
    ...(fullLogo && { logo: fullLogo }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        ...(address.streetAddress && { streetAddress: address.streetAddress }),
        ...(address.addressLocality && { addressLocality: address.addressLocality }),
        ...(address.addressRegion && { addressRegion: address.addressRegion }),
        ...(address.postalCode && { postalCode: address.postalCode }),
        ...(address.addressCountry && { addressCountry: address.addressCountry }),
      },
    }),
    ...(telephone && { telephone }),
    ...(email && { email }),
    ...(priceRange && { priceRange }),
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating.ratingValue,
        reviewCount: rating.reviewCount,
        bestRating: rating.bestRating || 5,
        worstRating: rating.worstRating || 1,
      },
    }),
    ...(openingHours && openingHours.length > 0 && { openingHours }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
