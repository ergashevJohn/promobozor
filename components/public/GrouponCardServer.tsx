import { Link } from "@/i18n/navigation";
import { Eye, Star } from "lucide-react";
import { PromocodeCardVisual } from "./PromocodeCardVisual";
import {
  getCardInactiveState,
  type PromocodeCardTranslations,
} from "./promocode-card-helpers";
import type { Promocode } from "./types";

interface GrouponCardServerProps {
  promocode: Promocode;
  priority?: boolean;
  translations: PromocodeCardTranslations;
}

export default function GrouponCardServer({
  promocode,
  priority = false,
  translations: t,
}: GrouponCardServerProps) {
  const translation = promocode.translations?.[0];
  const promocodeLink = `/promocode/${translation?.slug || promocode.id}`;
  const { isInactive } = getCardInactiveState(promocode);

  return (
    <PromocodeCardVisual
      promocode={promocode}
      priority={priority}
      translations={t}
      detailHref={promocodeLink}
      actions={
        <div data-card-actions className="flex flex-col gap-2">
          <button
            type="button"
            data-action={promocode.type === "link" ? "open-link" : "copy-code"}
            data-promocode-id={promocode.id}
            data-code={promocode.code || ""}
            data-link={promocode.link || ""}
            data-disabled={isInactive ? "true" : "false"}
            className={`flex h-12 min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              promocode.type === "link"
                ? "ink-surface hover:opacity-90"
                : "bg-[color:var(--accent-red)] text-white hover:bg-[#b83a33]"
            } ${isInactive ? "cursor-not-allowed opacity-50" : ""}`}
            disabled={isInactive}
            aria-label={promocode.type === "link" ? t.getDeal : t.copy}
          >
            {promocode.type === "link" ? (
              <>
                <Star size={16} aria-hidden="true" />
                {t.getDeal}
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span data-button-text>{t.copy}</span>
              </>
            )}
          </button>
          <Link
            href={promocodeLink}
            className="inline-flex h-10 min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[color:var(--border)] bg-card/95 px-4 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)] hover:text-[color:var(--accent-red)]"
          >
            <Eye size={16} aria-hidden="true" />
            {t.viewDetails}
          </Link>
        </div>
      }
    />
  );
}
