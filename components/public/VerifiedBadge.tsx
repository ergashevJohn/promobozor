import { formatVerifiedDate } from "@/lib/content-seo";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

interface VerifiedBadgeProps {
  verifiedAt: Date | string | null | undefined;
  locale: string;
  label: string;
  className?: string;
}

/**
 * Freshness / trust badge for entity and promocode pages.
 */
export function VerifiedBadge({ verifiedAt, locale, label, className }: VerifiedBadgeProps) {
  const formatted = formatVerifiedDate(verifiedAt, locale);
  if (!formatted || !verifiedAt) return null;
  const iso =
    typeof verifiedAt === "string"
      ? verifiedAt
      : verifiedAt instanceof Date
        ? verifiedAt.toISOString()
        : undefined;

  return (
    <p
      className={
        className ??
        "text-muted-foreground inline-flex items-center gap-2 text-sm leading-6 font-medium"
      }
    >
      <CheckCircle
        className="size-4 shrink-0 text-[color:var(--accent-red)]"
        weight="fill"
        aria-hidden
      />
      <span>
        {label}: <time dateTime={iso}>{formatted}</time>
      </span>
    </p>
  );
}
