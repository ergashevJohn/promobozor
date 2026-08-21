import { PromocodeCardVisual } from "./PromocodeCardVisual";
import { getCardInactiveState, type PromocodeCardTranslations } from "./promocode-card-helpers";
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
  const promocodeLink = {
    pathname: "/promocode/[slug]" as const,
    params: { slug: translation?.slug || promocode.id },
  };
  const { isInactive } = getCardInactiveState(promocode);

  return (
    <PromocodeCardVisual
      promocode={promocode}
      priority={priority}
      translations={t}
      detailHref={promocodeLink}
      actions={
        <div data-card-actions>
          <button
            type="button"
            data-action={promocode.type === "link" ? "open-link" : "copy-code"}
            data-promocode-id={promocode.id}
            data-code={promocode.code || ""}
            data-link={promocode.link || ""}
            data-disabled={isInactive ? "true" : "false"}
            className={`flex h-12 min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-[color,background-color,opacity,transform] duration-200 ${
              promocode.type === "link"
                ? "ink-surface hover:opacity-90"
                : "bg-[color:var(--accent-red)] text-[color:var(--accent-foreground-red)] hover:opacity-90"
            } ${isInactive ? "cursor-not-allowed opacity-50" : ""}`}
            disabled={isInactive}
            aria-label={promocode.type === "link" ? t.getDeal : t.copy}
          >
            {promocode.type === "link" ? (
              <span data-button-text>{t.getDeal}</span>
            ) : (
              <span data-button-text>{t.copy}</span>
            )}
          </button>
        </div>
      }
    />
  );
}
