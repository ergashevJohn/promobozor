import serialize from "serialize-javascript";
import { getBaseUrl } from "@/lib/metadata";
import { type Locale, resolveInternalHrefToPublicPath } from "@/lib/routes";

interface ItemListItem {
  name: string;
  url: string;
  image?: string;
  description?: string;
}

interface ItemListSchemaProps {
  items: ItemListItem[];
  listName?: string;
  listDescription?: string;
  locale?: string;
}

/**
 * ItemList structured data (Schema.org) for collection/listing pages
 * Used for store listings, category listings, brand listings, etc.
 * Helps search engines understand the list of items on the page
 */
export function ItemListSchema({ items, listName, listDescription, locale }: ItemListSchemaProps) {
  const baseUrl = getBaseUrl();

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(listName && { name: listName }),
    ...(listDescription && { description: listDescription }),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Offer",
        name: item.name,
        url: item.url.startsWith("http")
          ? item.url
          : locale
            ? `${baseUrl}${resolveInternalHrefToPublicPath(locale as Locale, item.url)}`
            : `${baseUrl}${item.url}`,
        ...(item.image && {
          image: item.image.startsWith("http") ? item.image : `${baseUrl}${item.image}`,
        }),
        ...(item.description && { description: item.description }),
      },
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(schema) }} />
  );
}
