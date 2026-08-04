import { Link } from "@/i18n/navigation";
import { ChevronRight, Home } from "lucide-react";
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
      <ol className="inline-flex flex-wrap items-center gap-3 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm shadow-[0_18px_40px_-30px_rgba(17,24,39,0.45)] sm:gap-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <li key={item.url} className="flex items-center gap-2">
              {index === 0 ? (
                <Home className="text-muted-foreground h-4 w-4" />
              ) : (
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              )}
              {isLast ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="text-muted-foreground hover:text-foreground transition-colors"
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
