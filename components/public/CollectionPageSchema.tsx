import serialize from "serialize-javascript";
import { type Locale, resolveInternalHrefToPublicPath } from "@/lib/routes";

/**
 * CollectionPageSchema - Schema.org CollectionPage markup for list pages
 *
 * This helps Google understand that the page is a collection of items (stores, categories, brands, promocodes)
 * and can display rich results in search.
 *
 * Usage: Add to list pages like /stores, /categories, /brands, /promocodes
 */

interface CollectionPageSchemaProps {
  name: string;
  description: string;
  url: string;
  itemCount?: number;
  items?: Array<{
    name: string;
    url: string;
    description?: string;
    image?: string;
  }>;
  lang: string;
  baseUrl: string;
}

export function CollectionPageSchema({
  name,
  description,
  url,
  itemCount,
  items,
  lang,
  baseUrl,
}: CollectionPageSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${baseUrl}${resolveInternalHrefToPublicPath(lang as Locale, url)}`,
    inLanguage: lang,
    ...(itemCount && {
      numberOfItems: itemCount,
    }),
    ...(items &&
      items.length > 0 && {
        itemListElement: items.slice(0, 20).map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Thing",
            name: item.name,
            url: item.url.startsWith("http")
              ? item.url
              : `${baseUrl}${resolveInternalHrefToPublicPath(lang as Locale, item.url)}`,
            ...(item.description && { description: item.description }),
            ...(item.image && { image: item.image }),
          },
        })),
      }),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(schema) }} />
  );
}
