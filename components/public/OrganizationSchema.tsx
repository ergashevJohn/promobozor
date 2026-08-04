import { getBaseUrl } from "@/lib/metadata";

const EMPTY_SAME_AS: string[] = [];

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  sameAs?: string[]; // Social media links
  description?: string;
  contactPoint?: {
    telephone?: string;
    contactType?: string;
    email?: string;
  };
}

/**
 * Organization structured data (Schema.org) for homepage
 * Helps search engines understand your business/brand
 */
export function OrganizationSchema({
  name = "PromoBozor",
  url,
  logo,
  sameAs = EMPTY_SAME_AS,
  description = "PromoBozor - foydali chegirmalar, promokodlar va kuponlarni bir joyda topishga yordam beradigan platforma",
  contactPoint,
}: OrganizationSchemaProps) {
  const baseUrl = getBaseUrl();
  const organizationUrl = url || baseUrl;
  const logoUrl = logo || `${baseUrl}/promobozor-logo.png`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name,
    url: organizationUrl,
    logo: logoUrl,
    description,
    foundingDate: "2026",
    areaServed: {
      "@type": "Country",
      name: "Uzbekistan",
    },
    ...(sameAs.length > 0 && {
      sameAs,
    }),
    ...(contactPoint && {
      contactPoint: {
        "@type": "ContactPoint",
        ...(contactPoint.telephone && { telephone: contactPoint.telephone }),
        ...(contactPoint.contactType && { contactType: contactPoint.contactType }),
        ...(contactPoint.email && { email: contactPoint.email }),
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
