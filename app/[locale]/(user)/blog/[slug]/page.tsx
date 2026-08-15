import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { BlogPostDetail } from "@/components/public/blog/BlogPostDetail";
import {
  estimateReadingMinutes,
  getBlogInternalHref,
  getBlogLanguageAlternates,
  getBlogPath,
  getBlogStaticParams,
  resolveBlogPost,
  type BlogLocale,
} from "@/lib/blog";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";

export const revalidate = 3600;

export function generateStaticParams() {
  return getBlogStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLanguage(locale)) return {};

  const resolved = resolveBlogPost(slug, locale as BlogLocale);
  if (!resolved) return {};

  const { post, canonicalSlug } = resolved;
  const lang = locale as BlogLocale;
  const languageAlternates = getBlogLanguageAlternates(post);

  return generateFullMetadata(
    post.title[lang],
    post.description[lang],
    getBlogPath(lang, canonicalSlug),
    undefined,
    "article",
    locale,
    "",
    languageAlternates
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLanguage(locale)) notFound();

  const lang = locale as BlogLocale;
  const resolved = resolveBlogPost(slug, lang);
  if (!resolved) notFound();

  if (resolved.needsRedirect) {
    permanentRedirect(getBlogPath(lang, resolved.canonicalSlug));
  }

  const post = resolved.post;
  const t = await getTranslations({ locale, namespace: "blog" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const baseUrl = getBaseUrl();
  const canonicalPath = getBlogInternalHref(resolved.canonicalSlug);

  const breadcrumbItems = [
    { name: t("title"), url: `/blog` },
    { name: post.title[lang], url: canonicalPath },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title[lang],
    description: post.description[lang],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: locale,
    mainEntityOfPage: `${baseUrl}${getBlogPath(lang, resolved.canonicalSlug)}`,
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

  const jsonLd = JSON.stringify(articleSchema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return (
    <>
      <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd,
        }}
      />
      <div className="page-shell pt-8 md:pt-10">
        <Breadcrumbs locale={locale} items={breadcrumbItems} homeName={tCommon("home")} />
      </div>
      <BlogPostDetail
        post={post}
        locale={lang}
        labels={{
          updated: t("updated"),
          published: t("published"),
          readingTime: t("readingTime", { minutes: estimateReadingMinutes(post, lang) }),
          verifiedBadge: t("verifiedBadge"),
          verifiedHint: t("verifiedHint"),
          backToBlog: t("backToBlog"),
          relatedArticles: t("relatedArticles"),
          relatedArticlesDescription: t("relatedArticlesDescription"),
          quickLinks: t("quickLinks"),
          stepsLabel: t("stepsLabel"),
          relatedStore: t("relatedStore"),
          relatedBrand: t("relatedBrand"),
          allOffers: t("allOffers"),
          readMore: t("readMore"),
          guideTag: t("guideTag"),
          storeGuideTag: t("storeGuideTag"),
          brandGuideTag: t("brandGuideTag"),
        }}
      />
    </>
  );
}
