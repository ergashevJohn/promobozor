export type BlogAuthorSchema = {
  "@type": "Person";
  "@id": string;
  name: string;
  url: string;
};

export function getBlogAuthorSchema({
  baseUrl,
  locale,
  name,
}: {
  baseUrl: string;
  locale: string;
  name: string;
}): BlogAuthorSchema {
  const aboutUrl = `${baseUrl}/${locale}/about`;

  return {
    "@type": "Person",
    "@id": `${aboutUrl}#person`,
    name,
    url: aboutUrl,
  };
}
