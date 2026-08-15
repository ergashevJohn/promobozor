import { BlogPostCard } from "@/components/public/blog/BlogPostCard";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { CollectionPageSchema } from "@/components/public/CollectionPageSchema";
import { ItemListSchema } from "@/components/public/ItemListSchema";
import { Link } from "@/i18n/navigation";
import { getBlogPosts, type BlogLocale } from "@/lib/blog";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import { ArrowRight, BookOpenText, CheckCircle, Newspaper } from "@phosphor-icons/react/dist/ssr";
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
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const posts = getBlogPosts();
  const lang = locale as BlogLocale;
  const baseUrl = getBaseUrl();
  const [featuredPost, ...remainingPosts] = posts;

  const tagLabels = {
    guide: t("guideTag"),
    store: t("storeGuideTag"),
    brand: t("brandGuideTag"),
  };

  const schemaItems = posts.map((post) => ({
    name: post.title[lang],
    url: `/blog/${post.slug[lang]}`,
    description: post.description[lang],
  }));

  return (
    <>
      <BreadcrumbsSchema
        items={[
          { name: tCommon("home"), url: "/" },
          { name: t("title"), url: "/blog" },
        ]}
        locale={locale}
      />
      <CollectionPageSchema
        name={t("title")}
        description={t("description")}
        url="/blog"
        itemCount={posts.length}
        items={schemaItems}
        lang={locale}
        baseUrl={baseUrl}
      />
      {schemaItems.length > 0 && (
        <ItemListSchema
          locale={locale}
          items={schemaItems}
          listName={t("title")}
          listDescription={t("description")}
        />
      )}

      <div className="page-shell py-10 md:py-12">
        <section className="page-hero-surface">
          <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="hero-copy max-w-3xl">
              <div className="brand-kicker mb-4">{t("heroKicker")}</div>
              <h1 className="page-hero-heading mb-3">{t("title")}</h1>
              <p className="page-hero-copy">{t("description")}</p>
            </div>
            <div className="surface-stat px-5 py-4">
              <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                {t("articlesLabel")}
              </div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                {posts.length}
              </div>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{t("trustLabel")}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="surface-stat">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-red)]/10 text-[color:var(--accent-red)]">
                <BookOpenText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="text-sm font-semibold text-[color:var(--foreground)]">
                {t("topicsLabel")}
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{t("topicsHint")}</p>
            </div>
            <div className="surface-stat">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-red)]/10 text-[color:var(--accent-red)]">
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="text-sm font-semibold text-[color:var(--foreground)]">
                {t("trustLabel")}
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                {t("trustDescription")}
              </p>
            </div>
            <div className="surface-stat">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-red)]/10 text-[color:var(--accent-red)]">
                <Newspaper className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="text-sm font-semibold text-[color:var(--foreground)]">
                {t("ctaLabel")}
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{t("ctaHint")}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="page-shell pb-14 md:pb-16">
        {featuredPost ? (
          <section className="mb-10 md:mb-12">
            <div className="mb-5 flex items-center gap-3">
              <h2 className="text-foreground text-lg font-semibold tracking-tight">
                {t("featuredLabel")}
              </h2>
              <div className="h-px flex-1 bg-[color:var(--border)]" aria-hidden="true" />
            </div>
            <BlogPostCard
              post={featuredPost}
              locale={lang}
              readMoreLabel={t("readMore")}
              updatedLabel={t("updated")}
              tagLabels={tagLabels}
              featured
            />
          </section>
        ) : null}

        {remainingPosts.length > 0 ? (
          <section>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                  {t("allArticlesLabel")}
                </h2>
                <p className="text-muted-foreground mt-2 max-w-[52ch] text-sm leading-6">
                  {t("allArticlesDescription")}
                </p>
              </div>
              <Link
                href="/promocodes"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-4 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)]/40 hover:text-[color:var(--accent-red)]"
              >
                {t("allOffers")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="stagger-reveal grid gap-5 md:grid-cols-2">
              {remainingPosts.map((post) => (
                <li key={post.legacySlug}>
                  <BlogPostCard
                    post={post}
                    locale={lang}
                    readMoreLabel={t("readMore")}
                    updatedLabel={t("updated")}
                    tagLabels={tagLabels}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
