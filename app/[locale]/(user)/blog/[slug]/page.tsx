import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { Link } from "@/i18n/navigation";
import { getBlogPost, getBlogPosts, type BlogLocale } from "@/lib/blog";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export function generateStaticParams() {
  return getBlogPosts().flatMap((post) =>
    (["uz", "ru", "en"] as const).map((locale) => ({ locale, slug: post.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLanguage(locale)) return {};
  const post = getBlogPost(slug);
  if (!post) return {};
  const lang = locale as BlogLocale;
  return generateFullMetadata(
    post.title[lang],
    post.description[lang],
    `/${locale}/blog/${slug}`,
    undefined,
    "article",
    locale
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLanguage(locale)) notFound();

  const post = getBlogPost(slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const lang = locale as BlogLocale;
  const baseUrl = getBaseUrl();

  const breadcrumbItems = [
    { name: t("title"), url: `/blog` },
    { name: post.title[lang], url: `/blog/${post.slug}` },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title[lang],
    description: post.description[lang],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: locale,
    mainEntityOfPage: `${baseUrl}/${locale}/blog/${post.slug}`,
    author: {
      "@type": "Organization",
      name: "PromoBozor",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "PromoBozor",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/promobozor-logo.png`,
      },
    },
    image: `${baseUrl}/promobozor-logo.png`,
  };

  return (
    <>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <article className="page-shell py-8 md:py-12">
        <div className="mb-6">
          <Breadcrumbs locale={locale} items={breadcrumbItems} homeName={tCommon("home")} />
        </div>
        <header className="mx-auto max-w-3xl">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {t("updated")}: {post.updatedAt}
          </p>
          <h1 className="text-foreground mt-3 text-3xl font-semibold text-balance md:text-4xl">
            {post.title[lang]}
          </h1>
          <p className="text-muted-foreground mt-4 text-base leading-7 md:text-lg">
            {post.description[lang]}
          </p>
        </header>
        <div className="text-foreground mx-auto mt-10 max-w-3xl space-y-5 text-base leading-8">
          {post.body[lang].map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap gap-3">
          {post.relatedStoreSlug ? (
            <Link
              href={`/store/${post.relatedStoreSlug}`}
              className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold"
            >
              {t("relatedStore")}
            </Link>
          ) : null}
          {post.relatedBrandSlug ? (
            <Link
              href={`/brand/${locale === "ru" && post.relatedBrandSlug === "yandex-eats" ? "yandex-eda" : post.relatedBrandSlug}`}
              className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold"
            >
              {t("relatedBrand")}
            </Link>
          ) : null}
          <Link
            href="/promocodes"
            className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--accent-red)] px-4 text-sm font-semibold text-white"
          >
            {t("allOffers")}
          </Link>
        </div>
      </article>
    </>
  );
}
