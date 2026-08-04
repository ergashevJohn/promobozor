import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ServerPaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
  translations: {
    ariaLabel: string;
    previous: string;
    next: string;
    page: string;
  };
}

function buildPageUrl(
  baseUrl: string,
  page: number,
  searchParams?: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") {
        params.set(key, value);
      }
    }
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);
  return pages;
}

const navBtnClass =
  "text-muted-foreground hover:text-foreground inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-transparent bg-card/80 px-3 py-2 text-sm font-medium shadow-[0_16px_40px_-34px_rgba(17,24,39,0.3)] transition-all hover:border-[color:var(--accent-red)]/30 hover:bg-card sm:px-4";
const navBtnDisabledClass =
  "text-muted-foreground/40 inline-flex min-h-11 min-w-11 cursor-not-allowed items-center justify-center gap-1 rounded-full border border-transparent bg-card/50 px-3 py-2 text-sm font-medium sm:px-4";

export default function ServerPagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
  translations,
}: ServerPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav
      aria-label={translations.ariaLabel}
      className="mt-10 flex items-center justify-center gap-1.5 sm:gap-2"
    >
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(baseUrl, currentPage - 1, searchParams)}
          className={navBtnClass}
          aria-label={translations.previous}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">{translations.previous}</span>
        </Link>
      ) : (
        <span className={navBtnDisabledClass}>
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">{translations.previous}</span>
        </span>
      )}

      {/* Mobile: compact page indicator */}
      <div className="min-w-[5.5rem] rounded-full border border-[color:var(--border)] bg-card/90 px-3 py-2 text-center text-sm font-medium sm:hidden">
        {translations.page} {currentPage}/{totalPages}
      </div>

      {/* Desktop/tablet: full page list */}
      <div className="hidden items-center gap-2 sm:flex">
        {pages.map((page, i) => {
          if (page === "ellipsis") {
            const ellipsisKey = `ellipsis-${i < pages.length / 2 ? "start" : "end"}`;
            return (
              <span key={ellipsisKey} className="text-muted-foreground px-2 py-2 text-sm">
                ...
              </span>
            );
          }

          const isActive = page === currentPage;

          return isActive ? (
            <span
              key={page}
              className="min-w-[42px] rounded-full bg-[color:var(--accent-red)] px-3 py-2 text-center text-sm font-semibold text-[color:var(--accent-foreground-red)] shadow-[0_18px_40px_-26px_rgba(255,90,79,0.8)]"
              aria-current="page"
            >
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={buildPageUrl(baseUrl, page, searchParams)}
              className="text-muted-foreground hover:text-foreground min-w-[42px] rounded-full border border-transparent bg-card/80 px-3 py-2 text-center text-sm font-medium shadow-[0_16px_40px_-34px_rgba(17,24,39,0.3)] transition-all hover:border-[color:var(--accent-red)]/30 hover:bg-card"
              aria-label={`${translations.page} ${page}`}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(baseUrl, currentPage + 1, searchParams)}
          className={navBtnClass}
          aria-label={translations.next}
        >
          <span className="hidden sm:inline">{translations.next}</span>
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className={navBtnDisabledClass}>
          <span className="hidden sm:inline">{translations.next}</span>
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}
