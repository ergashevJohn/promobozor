import { Link } from "@/i18n/navigation";
import type { BlogLocale, BlogPost } from "@/lib/blog";
import { ArrowRight, BookOpen, Storefront, Tag } from "@phosphor-icons/react/dist/ssr";

type BlogPostCardProps = {
  post: BlogPost;
  locale: BlogLocale;
  readMoreLabel: string;
  updatedLabel: string;
  tagLabels: {
    guide: string;
    store: string;
    brand: string;
  };
  featured?: boolean;
};

function getPostTag(post: BlogPost, labels: BlogPostCardProps["tagLabels"]) {
  if (post.relatedStoreSlug) {
    return { label: labels.store, icon: Storefront };
  }
  if (post.relatedBrandSlug) {
    return { label: labels.brand, icon: Tag };
  }
  return { label: labels.guide, icon: BookOpen };
}

function formatBlogDate(date: string, locale: BlogLocale) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function BlogPostCard({
  post,
  locale,
  readMoreLabel,
  updatedLabel,
  tagLabels,
  featured = false,
}: BlogPostCardProps) {
  const tag = getPostTag(post, tagLabels);
  const TagIcon = tag.icon;

  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-[var(--radius-hero)] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-surface)] transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[color:var(--accent-red)]/40 hover:shadow-[var(--shadow-surface-hover)]">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-between p-6 md:p-8 lg:p-10">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--accent-red)]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--accent-red)] uppercase">
                  <TagIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {tag.label}
                </span>
                <time
                  dateTime={post.updatedAt}
                  className="text-xs font-medium tracking-wide text-[color:var(--muted-foreground)] uppercase"
                >
                  {updatedLabel}: {formatBlogDate(post.updatedAt, locale)}
                </time>
              </div>
              <h2 className="text-foreground text-2xl font-semibold tracking-tight text-balance md:text-3xl lg:text-4xl">
                <Link
                  href={`/blog/${post.slug}`}
                  className="transition-colors hover:text-[color:var(--accent-red)]"
                >
                  {post.title[locale]}
                </Link>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-[58ch] text-base leading-7 md:text-lg">
                {post.description[locale]}
              </p>
            </div>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-8 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[color:var(--accent-red)] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {readMoreLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="relative hidden min-h-[16rem] overflow-hidden lg:block">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,var(--ink)_0%,#1a222c_55%,rgba(232,78,66,0.35)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(232,78,66,0.28),transparent_45%)]" />
            <div className="relative flex h-full flex-col justify-end p-8 text-[color:var(--ink-foreground)]">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm">
                <TagIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-sm leading-6 text-white/75">{post.description[locale]}</p>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="directory-card group flex h-full flex-col p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--secondary)] px-3 py-1 text-xs font-semibold text-[color:var(--foreground)]">
          <TagIcon className="h-3.5 w-3.5 text-[color:var(--accent-red)]" aria-hidden="true" />
          {tag.label}
        </span>
        <time
          dateTime={post.updatedAt}
          className="text-xs font-medium tracking-wide text-[color:var(--muted-foreground)] uppercase"
        >
          {formatBlogDate(post.updatedAt, locale)}
        </time>
      </div>
      <h2 className="text-foreground text-xl font-semibold tracking-tight text-balance">
        <Link
          href={`/blog/${post.slug}`}
          className="transition-colors group-hover:text-[color:var(--accent-red)]"
        >
          {post.title[locale]}
        </Link>
      </h2>
      <p className="text-muted-foreground mt-3 line-clamp-3 flex-1 text-sm leading-7">
        {post.description[locale]}
      </p>
      <Link
        href={`/blog/${post.slug}`}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--accent-red)] transition-[gap] group-hover:gap-2.5"
      >
        {readMoreLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}
