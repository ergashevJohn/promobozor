import { Link } from "@/i18n/navigation";
import { getApprovedImageUrl } from "@/lib/media";
import { SealCheck, Clock } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  getCardInactiveState,
  getTimeRemaining,
  summarizeConditions,
  type PromocodeCardTranslations,
} from "./promocode-card-helpers";
import type { Promocode } from "./types";

interface PromocodeCardVisualProps {
  promocode: Promocode;
  priority?: boolean;
  translations: PromocodeCardTranslations;
  detailHref: string;
  actions: ReactNode;
  footer?: ReactNode;
}

export function PromocodeCardVisual({
  promocode,
  priority = false,
  translations: t,
  detailHref,
  actions,
  footer,
}: PromocodeCardVisualProps) {
  const translation = promocode.translations?.[0];
  const storeTranslation = promocode.store?.translations?.[0];
  const brandTranslation = promocode.brand?.translations?.[0];
  const displayTranslation = storeTranslation || brandTranslation;
  const timeRemaining = getTimeRemaining(promocode.expiresAt);
  const displayName = displayTranslation?.name || t.unknownStore || t.storeTitle;
  const displayImageUrl = getApprovedImageUrl(
    promocode.store?.logoUrl || promocode.brand?.imageUrl
  );
  const promocodeTitle = translation?.title || t.promocodeTitle;
  const conditionsText = summarizeConditions(translation?.conditions);
  const { isInactive, isExpiredByDate } = getCardInactiveState(promocode);

  const discountLabel =
    promocode.discountType === "percent"
      ? `-${promocode.discountValue}%`
      : `-${promocode.discountValue} ${promocode.currency || "UZS"}`;

  return (
    <article className={`deal-card group ${isInactive ? "grayscale" : ""}`}>
      <div className={`flex flex-1 flex-col gap-3 p-4 sm:p-5 ${isInactive ? "opacity-80" : ""}`}>
        <div className="flex items-start gap-3">
          {displayImageUrl ? (
            <div
              className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--secondary)] sm:h-12 sm:w-12 ${isInactive ? "opacity-50" : ""}`}
            >
              <Image
                src={displayImageUrl}
                alt={displayName}
                fill
                className="object-contain"
                priority={priority}
                sizes="48px"
              />
            </div>
          ) : (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--secondary)] text-lg font-semibold text-[color:var(--foreground)] sm:h-12 sm:w-12 ${isInactive ? "opacity-50" : ""}`}
            >
              {displayTranslation?.name?.charAt(0) || t.storeTitle.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              {!isInactive ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--accent)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--foreground)]">
                  <SealCheck
                    className="h-3.5 w-3.5 text-[color:var(--accent-red)]"
                    aria-hidden="true"
                  />
                  {t.verified}
                </span>
              ) : (
                <span className="rounded-md bg-[color:var(--secondary)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--foreground)]">
                  {isExpiredByDate ? t.expired : t.disabled}
                </span>
              )}
              {promocode.isFeatured && !isInactive && (
                <span className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--foreground)]">
                  {t.featured}
                </span>
              )}
            </div>

            {displayTranslation?.slug ? (
              <Link
                href={`/${storeTranslation ? "store" : "brand"}/${displayTranslation.slug}`}
                className="focus-visible:ring-ring/50 relative z-20 block truncate text-sm font-medium text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)] focus-visible:ring-[3px] focus-visible:outline-none"
              >
                {displayName}
              </Link>
            ) : (
              <p className="truncate text-sm font-medium text-[color:var(--muted-foreground)]">
                {displayName}
              </p>
            )}
          </div>

          <div className="ink-surface shrink-0 rounded-xl px-2.5 py-1.5 text-center sm:px-3 sm:py-2">
            <div className="text-base font-bold tracking-tight sm:text-lg">{discountLabel}</div>
          </div>
        </div>

        {!isInactive ? (
          <Link
            href={detailHref}
            className="focus-visible:ring-ring/50 relative z-20 block rounded-md focus-visible:ring-[3px] focus-visible:outline-none"
            aria-label={`${t.details} - ${displayName} ${promocodeTitle}`}
          >
            <h3 className="line-clamp-2 text-base leading-snug font-semibold text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--foreground)] sm:text-[1.05rem]">
              {promocodeTitle}
            </h3>
          </Link>
        ) : (
          <h3 className="line-clamp-2 text-base leading-snug font-semibold text-[color:var(--foreground)] sm:text-[1.05rem]">
            {promocodeTitle}
          </h3>
        )}

        {(timeRemaining || conditionsText) && (
          <div className="flex items-center gap-1 text-xs font-medium text-[color:var(--muted-foreground)]">
            {timeRemaining ? (
              <>
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="shrink-0">{timeRemaining}</span>
              </>
            ) : null}
            {conditionsText ? <span className="line-clamp-1 min-w-0">{conditionsText}</span> : null}
          </div>
        )}

        <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--secondary)]/60 px-3 py-2.5">
          {promocode.type === "code" ? (
            <div className="font-mono text-lg font-bold tracking-wide break-all text-[color:var(--foreground)] sm:text-xl">
              {promocode.code}
            </div>
          ) : (
            <div className="text-sm font-semibold text-[color:var(--foreground)] sm:text-base">
              {t.activateLink}
            </div>
          )}
        </div>

        <div className="relative z-20 mt-auto pt-1">{actions}</div>
        {footer ? <div className="relative z-20">{footer}</div> : null}
      </div>
    </article>
  );
}
