import { Link } from "@/i18n/navigation";
import { getBlogPosts, type BlogLocale } from "@/lib/blog";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLanguage(locale)) return {};
  const t = await getTranslations({ locale, namespace: "blog" });
  return generateFullMetadata(
    t("title"),
    t("description"),
    `/${locale}/blog`,
    undefined,
    "website",
    locale
  );
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLanguage(locale)) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = getBlogPosts();
  const lang = locale as BlogLocale;
  const baseUrl = getBaseUrl();

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("title"),
    description: t("description"),
    url: `${baseUrl}/${locale}/blog`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${baseUrl}/${locale}/blog/${post.slug}`,
        name: post.title[lang],
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <div className="page-shell py-10 md:py-14">
        <header className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className="brand-section-heading text-center">{t("title")}</h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-[52ch] text-base leading-7 md:text-lg">
            {t("description")}
          </p>
        </header>
        <ul className="mx-auto grid max-w-3xl gap-4">
          {posts.map((post) => (
            <li key={post.slug} className="bg-card border-border rounded-2xl border p-5 md:p-6">
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                {post.updatedAt}
              </p>
              <h2 className="text-foreground mt-2 text-xl font-semibold text-balance">
                <Link href={`/blog/${post.slug}`} className="hover:text-[color:var(--accent-red)]">
                  {post.title[lang]}
                </Link>
              </h2>
              <p className="text-muted-foreground mt-3 text-sm leading-7">
                {post.description[lang]}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 inline-flex text-sm font-semibold text-[color:var(--accent-red)]"
              >
                {t("readMore")}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
