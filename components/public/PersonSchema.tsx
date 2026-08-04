import { getBaseUrl } from "@/lib/metadata";

const EMPTY_SAME_AS: string[] = [];
const EMPTY_KNOWS_ABOUT: string[] = [];

interface PersonSchemaProps {
  name?: string;
  jobTitle?: string;
  url?: string;
  description?: string;
  sameAs?: string[];
  knowsAbout?: string[];
  worksForName?: string;
  image?: string;
}

export function PersonSchema({
  name = "Jahongir Ergashev",
  jobTitle = "Founder",
  url,
  description = "Founder of PromoBozor, helping Uzbekistan shoppers save money with verified promo codes and discounts.",
  sameAs = EMPTY_SAME_AS,
  knowsAbout = EMPTY_KNOWS_ABOUT,
  worksForName = "PromoBozor",
  image,
}: PersonSchemaProps) {
  const baseUrl = getBaseUrl();
  const personUrl = url || baseUrl;
  const imageUrl =
    image &&
    (image.startsWith("http") ? image : `${baseUrl}${image.startsWith("/") ? image : `/${image}`}`);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${personUrl}#person`,
    name,
    jobTitle,
    url: personUrl,
    description,
    worksFor: {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: worksForName,
      url: baseUrl,
    },
    ...(imageUrl && { image: imageUrl }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(knowsAbout.length > 0 && { knowsAbout }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
