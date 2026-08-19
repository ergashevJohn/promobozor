import { BlogPostCard } from "@/components/public/blog/BlogPostCard";
import { Link } from "@/i18n/navigation";
import { formatBlogDate, getRelatedBlogPosts, type BlogLocale, type BlogPost } from "@/lib/blog";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  StorefrontIcon,
  TagIcon,
} from "@phosphor-icons/react/dist/ssr";

type BlogPostDetailProps = {
  post: BlogPost;
  locale: BlogLocale;
  labels: {
    updated: string;
    published: string;
    authorBy: string;
    authorName: string;
    authorRole: string;
    readingTime: string;
    verifiedBadge: string;
    verifiedHint: string;
    backToBlog: string;
    relatedArticles: string;
    relatedArticlesDescription: string;
    quickLinks: string;
    stepsLabel: string;
    relatedStore: string;
    relatedBrand: string;
    allOffers: string;
    readMore: string;
    guideTag: string;
    storeGuideTag: string;
    brandGuideTag: string;
  };
};

function getPostTag(post: BlogPost, labels: BlogPostDetailProps["labels"]) {
  if (post.relatedStoreSlug) {
    return { label: labels.storeGuideTag, icon: StorefrontIcon };
  }
  if (post.relatedBrandSlug) {
    return { label: labels.brandGuideTag, icon: TagIcon };
  }
  return { label: labels.guideTag, icon: BookOpenIcon };
}

function parseStepParagraph(paragraph: string): { step?: string; text: string } {
  const match = paragraph.match(/^(\d+)[).]\s*(.+)$/);
  if (!match) return { text: paragraph };
  return { step: match[1], text: match[2] };
}

export function BlogPostDetail({ post, locale, labels }: BlogPostDetailProps) {
  const tag = getPostTag(post, labels);
  const TagIcon = tag.icon;
  const related = getRelatedBlogPosts(post, 2);
  const bodyParagraphs = post.body[locale];
  const stepLikeCount = bodyParagraphs.filter((p) => /^\d+[).]\s/.test(p)).length;
  const useSteps = stepLikeCount >= 3;
  const tagLabels = {
    guide: labels.guideTag,
    store: labels.storeGuideTag,
    brand: labels.brandGuideTag,
  };

  return (
    <div className="page-shell py-8 md:py-12">
      <div className="mb-6">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          {labels.backToBlog}
        </Link>
      </div>

      <header className="page-hero-surface mb-8 md:mb-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="brand-kicker">
                <TagIcon
                  className="h-3.5 w-3.5 text-[color:var(--accent-red)]"
                  aria-hidden="true"
                />
                {tag.label}
              </span>
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {labels.readingTime}
              </span>
            </div>
            <h1 className="page-hero-heading max-w-[18ch] md:max-w-none">{post.title[locale]}</h1>
            <p className="page-hero-copy mt-4">{post.description[locale]}</p>
            <div className="text-muted-foreground mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span>
                {labels.authorBy}:{" "}
                <Link
                  href="/about"
                  className="font-medium text-[color:var(--foreground)] underline-offset-4 hover:underline"
                >
                  {labels.authorName}
                </Link>{" "}
                — {labels.authorRole}
              </span>
              <time dateTime={post.publishedAt}>
                {labels.published}: {formatBlogDate(post.publishedAt, locale)}
              </time>
              <time dateTime={post.updatedAt}>
                {labels.updated}: {formatBlogDate(post.updatedAt, locale)}
              </time>
            </div>
          </div>

          <aside className="surface-stat space-y-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent-red)]/10 text-[color:var(--accent-red)]">
              <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[color:var(--foreground)]">
                {labels.verifiedBadge}
              </div>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{labels.verifiedHint}</p>
            </div>
            <div>
              <div className="mb-3 text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                {labels.quickLinks}
              </div>
              <div className="flex flex-col gap-2">
                {post.relatedStoreSlug ? (
                  <Link href={`/store/${post.relatedStoreSlug[locale]}`} className="brand-chip">
                    <StorefrontIcon
                      className="h-4 w-4 text-[color:var(--accent-red)]"
                      aria-hidden="true"
                    />
                    {labels.relatedStore}
                  </Link>
                ) : null}
                {post.relatedBrandSlug ? (
                  <Link href={`/brand/${post.relatedBrandSlug[locale]}`} className="brand-chip">
                    <TagIcon
                      className="h-4 w-4 text-[color:var(--accent-red)]"
                      aria-hidden="true"
                    />
                    {labels.relatedBrand}
                  </Link>
                ) : null}
                <Link
                  href="/promocodes"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[color:var(--accent-red)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {labels.allOffers}
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <article className="content-prose-panel md:p-8">
          {useSteps ? (
            <div>
              <h2 className="text-foreground mb-6 text-lg font-semibold tracking-tight">
                {labels.stepsLabel}
              </h2>
              <ol className="space-y-4">
                {bodyParagraphs.map((paragraph) => {
                  const { step, text } = parseStepParagraph(paragraph);
                  if (!step) {
                    return (
                      <p
                        key={paragraph.slice(0, 48)}
                        className="text-foreground max-w-[65ch] text-base leading-8"
                      >
                        {paragraph}
                      </p>
                    );
                  }
                  return (
                    <li
                      key={paragraph.slice(0, 48)}
                      className="flex gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--secondary)]/40 p-4 md:p-5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-red)] text-sm font-semibold text-white">
                        {step}
                      </span>
                      <p className="text-foreground max-w-[60ch] pt-1 text-base leading-7">
                        {text}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <div className="space-y-5">
              {bodyParagraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="text-foreground max-w-[65ch] text-base leading-8 text-pretty"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-3 border-t border-[color:var(--border)] pt-8">
            <Link
              href="/blog"
              className="brand-chip hover:border-[color:var(--accent-red)]/40 hover:text-[color:var(--accent-red)]"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              {labels.backToBlog}
            </Link>
            <Link
              href="/promocodes"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[color:var(--accent-red)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {labels.allOffers}
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="surface-stat">
              <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                PromoBozor
              </div>
              <p className="text-muted-foreground mt-3 text-sm leading-6">{labels.verifiedHint}</p>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-12 md:mt-16">
          <div className="mb-6">
            <h2 className="text-foreground text-2xl font-semibold tracking-tight">
              {labels.relatedArticles}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-[52ch] text-sm leading-6">
              {labels.relatedArticlesDescription}
            </p>
          </div>
          <ul className="grid gap-5 md:grid-cols-2">
            {related.map((item) => (
              <li key={item.legacySlug}>
                <BlogPostCard
                  post={item}
                  locale={locale}
                  readMoreLabel={labels.readMore}
                  updatedLabel={labels.updated}
                  tagLabels={tagLabels}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
