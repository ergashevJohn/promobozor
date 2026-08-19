import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getApprovedImageUrl } from "@/lib/media";
import { ArrowRightIcon, TagIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

interface Category {
  id: string;
  imageUrl: string | null;
  name: string | null;
  slug: string | null;
}

interface BrowseContent {
  categories: {
    title: string;
    description: string;
    labels: string[];
    cardDescriptions: string[];
    cardCta: string;
  };
}

interface Props {
  categories: Category[];
  browse: BrowseContent;
  tCommon: (key: string, params?: Record<string, string | number>) => string;
}

export default function PopularCategories({ categories, browse, tCommon }: Props) {
  if (categories.length === 0) return null;

  return (
    <section>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 className="brand-section-heading text-left">{browse.categories.title}</h2>
          <p className="text-muted-foreground mt-3 text-base leading-7 md:text-lg">
            {browse.categories.description}
          </p>
        </div>
        <Link
          href="/categories"
          className="text-foreground inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[color:var(--accent-red)]"
        >
          <span>{tCommon("viewAll")}</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="stagger-reveal grid gap-6 md:grid-cols-2 xl:grid-cols-[1.15fr_0.95fr_1.05fr_0.9fr]">
        {categories.slice(0, 4).map((cat, index) => {
          const categoryImageUrl = getApprovedImageUrl(cat.imageUrl);

          return (
            <Link key={cat.id} href={`/category/${cat.slug}`}>
              <Card className="group bg-card h-full border-[color:var(--border)] py-0 shadow-[0_24px_60px_-48px_rgba(15,20,25,0.28)] transition-[border-color,box-shadow] duration-200 hover:border-[color:var(--accent-red)]/40 dark:shadow-[0_24px_60px_-48px_rgba(0,0,0,0.55)]">
                <CardContent className="flex h-full flex-col gap-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                        {browse.categories.labels[index] || browse.categories.labels[0]}
                      </div>
                      <h3 className="text-foreground mt-3 text-xl leading-tight font-semibold transition-colors group-hover:text-[color:var(--accent-red)]">
                        {cat.name}
                      </h3>
                    </div>
                    {categoryImageUrl ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--secondary)]">
                        <Image
                          src={categoryImageUrl}
                          alt={
                            cat.name
                              ? `${cat.name} - ${tCommon("altCategoryImage")}`
                              : tCommon("altCategoryImage")
                          }
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--secondary)] text-[color:var(--accent-red)]">
                        <TagIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-6">
                    {browse.categories.cardDescriptions[index] ||
                      browse.categories.cardDescriptions[0]}
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent-red)]">
                    <span>{browse.categories.cardCta}</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
