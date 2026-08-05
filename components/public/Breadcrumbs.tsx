import { Link } from "@/i18n/navigation";
import { CaretRight, House } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  homeName?: string;
}

export async function Breadcrumbs({ items, homeName }: BreadcrumbsProps) {
  const tCommon = await getTranslations("common");
  const allItems = [{ name: homeName || tCommon("home"), url: "/" }, ...items];

  return (
    <nav aria-label={tCommon("breadcrumb")} className="mb-4">
      <ol className="bg-card/95 inline-flex flex-wrap items-center gap-1 rounded-full border border-[color:var(--border)] px-2 py-1 text-sm shadow-[0_18px_40px_-30px_rgba(17,24,39,0.45)] sm:gap-2 sm:px-4 sm:py-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <li key={item.url} className="flex items-center gap-1 sm:gap-2">
              {index === 0 ? (
                <House className="text-muted-foreground h-4 w-4" />
              ) : (
                <CaretRight className="text-muted-foreground h-4 w-4" />
              )}
              {isLast ? (
                <span
                  className="text-foreground max-w-[12rem] truncate px-2 py-2 font-medium sm:max-w-none"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center px-2 py-2 transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
