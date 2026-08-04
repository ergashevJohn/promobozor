import { getBaseUrl } from "@/lib/metadata";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsSchemaProps {
  items: BreadcrumbItem[];
  locale?: string;
}

/**
 * Breadcrumbs structured data (Schema.org) for SEO
 * Helps search engines understand page hierarchy
 */
export function BreadcrumbsSchema({ items, locale }: BreadcrumbsSchemaProps) {
  const baseUrl = getBaseUrl();

  function resolveUrl(url: string): string {
    if (url.startsWith("http")) return url;
    if (locale && !url.startsWith(`/${locale}`)) {
      return `${baseUrl}/${locale}${url}`;
    }
    return `${baseUrl}${url}`;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: resolveUrl(item.url),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
