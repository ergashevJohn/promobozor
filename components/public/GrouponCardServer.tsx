// Fully Server Component Card - No Client-Side Hydration
// Uses progressive enhancement for interactivity
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { Clock3, Star, TicketPercent } from "lucide-react";
import Image from "next/image";
import { Promocode } from "./types";

interface GrouponCardServerProps {
  promocode: Promocode;
  priority?: boolean;
  translations: {
    featured: string;
    verified: string;
    fresh: string;
    popular: string;
    endingSoon: string;
    unlimited: string;
    unknownStore: string;
    storeTitle: string;
    promocodeTitle: string;
    activateLink: string;
    details: string;
    viewDetails: string;
    storeOffer: string;
    brandOffer: string;
    directDeal: string;
    codeReady: string;
    dealRoute: string;
    promoCodeLabel: string;
    copy: string;
    copied: string;
    getDeal: string;
    like: string;
    dislike: string;
    expired: string;
    disabled: string;
    codeCopied: string;
    copyError: string;
  };
}

function getTimeRemaining(expiresAt: string | null) {
  if (!expiresAt) return null;
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getSignalLabels(
  promocode: Promocode,
  opts: { isInactive: boolean; isExpiredByDate: boolean; t: GrouponCardServerProps["translations"] }
) {
  const labels: string[] = [];
  if (opts.isInactive || opts.isExpiredByDate) {
    return labels;
  }

  const now = Date.now();
  const startsAt = promocode.startsAt ? new Date(promocode.startsAt).getTime() : null;
  const expiresAt = promocode.expiresAt ? new Date(promocode.expiresAt).getTime() : null;
  const isFresh = startsAt ? now - startsAt <= 7 * 24 * 60 * 60 * 1000 : false;
  const isPopular = promocode.copyCount >= 15 || promocode.viewsCount >= 200;
  const isEndingSoon = expiresAt ? expiresAt - now <= 3 * 24 * 60 * 60 * 1000 : false;

  if (isFresh) labels.push(opts.t.fresh);
  if (isPopular) labels.push(opts.t.popular);
  if (isEndingSoon) labels.push(opts.t.endingSoon);

  return labels.slice(0, 2);
}

/**
 * Server-side promocode card - renders static HTML with minimal JS
 * Actions are handled by a single global client component (CardActionsProvider)
 * This drastically reduces client-side hydration overhead
 */
export default function GrouponCardServer({
  promocode,
  priority = false,
  translations: t,
}: GrouponCardServerProps) {
  const translation = promocode.translations?.[0];
  const storeTranslation = promocode.store?.translations?.[0];
  const brandTranslation = promocode.brand?.translations?.[0];
  const displayTranslation = storeTranslation || brandTranslation;
  const timeRemaining = getTimeRemaining(promocode.expiresAt);
  const displayName = displayTranslation?.name || t.unknownStore || t.storeTitle;
  const promocodeTitle = translation?.title || t.promocodeTitle;

  const isDisabledByStatus =
    !promocode.status ||
    promocode.status === "disabled" ||
    promocode.status === "expired" ||
    promocode.status === "draft";

  const now = new Date().getTime();
  const isExpiredByDate = promocode.expiresAt
    ? new Date(promocode.expiresAt).getTime() < now
    : false;

  const isInactive = isDisabledByStatus || isExpiredByDate;
  const signalLabels = getSignalLabels(promocode, { isInactive, isExpiredByDate, t });

  const sizes = "64px";

  // Store/Brand slug for links
  const entitySlug = displayTranslation?.slug;
  const entityType = storeTranslation ? "store" : "brand";
  const entityLink = entitySlug ? `/${entityType}/${entitySlug}` : null;
  const promocodeLink = `/promocode/${translation?.slug || promocode.id}`;

  return (
    <Card
      role="article"
      data-card-id={promocode.id}
      data-card-code={promocode.code || ""}
      data-card-link={promocode.link || ""}
      data-card-type={promocode.type || "code"}
      data-card-disabled={isInactive ? "true" : "false"}
      className={`group bg-card relative flex h-full flex-col overflow-hidden border-white/80 py-0 transition-all duration-300 ${
        isInactive
          ? "opacity-60 grayscale"
          : "hover:-translate-y-1 hover:border-[color:var(--accent-red)]"
      }`}
    >
      <div className="absolute top-4 right-4 left-4 z-20 flex items-start justify-between gap-2">
        {promocode.isFeatured && (
          <div className="flex items-center gap-1.5 rounded-full bg-[color:var(--accent)] px-3 py-1.5 text-xs font-bold text-[color:var(--accent-red)]">
            <Star size={12} className="fill-current" />
            <span>{t.featured}</span>
          </div>
        )}

        <div
          className={`ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
            isInactive ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {isInactive ? (
            <span>{isExpiredByDate ? t.expired : t.disabled}</span>
          ) : (
            <span>{t.verified}</span>
          )}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col justify-between gap-4 p-5 pt-16">
        <div className="flex items-start gap-3">
          {promocode.store?.logoUrl || promocode.brand?.imageUrl ? (
            <div className="bg-muted border-border relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border">
              <Image
                src={promocode.store?.logoUrl || promocode.brand?.imageUrl || ""}
                alt={`Promokod ${displayName} - ${promocode.discountType === "percent" ? `${promocode.discountValue}%` : `${promocode.discountValue} ${promocode.currency || "UZS"}`} ${promocodeTitle}`}
                fill
                className="object-cover"
                priority={priority}
                sizes={sizes}
              />
            </div>
          ) : (
            <div className="bg-muted flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl text-2xl font-bold">
              {displayTranslation?.name?.charAt(0) ||
                t.unknownStore?.charAt(0) ||
                t.storeTitle.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {entityLink ? (
              <Link
                href={entityLink}
                className="text-foreground relative z-20 block truncate text-lg font-semibold transition-colors hover:text-[color:var(--accent-red)]"
              >
                {displayName}
              </Link>
            ) : (
              <p className="text-foreground truncate text-lg font-semibold">{displayName}</p>
            )}
            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
              {promocodeTitle}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
              <span className="rounded-full bg-[color:var(--secondary)] px-2.5 py-1">
                {storeTranslation ? t.storeOffer : t.brandOffer}
              </span>
              <span className="rounded-full bg-[color:var(--secondary)] px-2.5 py-1">
                {promocode.type === "link" ? t.directDeal : t.codeReady}
              </span>
            </div>
            {signalLabels.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {signalLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--secondary)] px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-[color:var(--foreground)] uppercase"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative my-2 overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,1))] px-5 py-5 sm:px-6 sm:py-6">
          <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[color:var(--accent-red)] shadow-[0_14px_30px_-24px_rgba(17,24,39,0.7)]">
            <TicketPercent size={18} />
          </div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="rounded-full bg-[color:var(--secondary)] px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted-foreground)] uppercase">
              {promocode.type === "link" ? t.dealRoute : t.promoCodeLabel}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] px-4 py-2 text-xl font-bold text-white sm:text-2xl">
              {promocode.discountType === "percent" ? (
                <span>{promocode.discountValue}%</span>
              ) : (
                <span>
                  {promocode.discountValue} {promocode.currency || "UZS"}
                </span>
              )}
            </div>
          </div>

          <div className="mb-3 rounded-[20px] border border-dashed border-[color:var(--border)] bg-white/75 px-4 py-4 text-center">
            {promocode.type === "code" ? (
              <div className="text-2xl font-bold tracking-[0.2em] text-[color:var(--accent-red)] sm:text-3xl">
                {promocode.code}
              </div>
            ) : (
              <div className="text-base font-semibold text-[color:var(--accent-red)] sm:text-lg">
                {t.activateLink}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
            <div className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
              {t.verified}
            </div>
            {timeRemaining && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
                <Clock3 size={14} />
                <span>{timeRemaining}</span>
              </div>
            )}
          </div>
        </div>

        {/* Link wrapper for card details */}
        {!isInactive && (
          <Link
            href={promocodeLink}
            className="absolute inset-0 z-10"
            aria-label={`${t.details} - ${displayName} ${promocodeTitle}`}
          />
        )}

        {/* Action buttons - data attributes for global handler */}
        <div className="relative z-20" data-card-actions>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <button
              type="button"
              data-action={promocode.type === "link" ? "open-link" : "copy-code"}
              data-promocode-id={promocode.id}
              data-code={promocode.code || ""}
              data-link={promocode.link || ""}
              data-disabled={isInactive ? "true" : "false"}
              className={`h-12 w-full transition-all duration-200 ${
                promocode.type === "link"
                  ? "bg-[color:var(--foreground)] text-white hover:bg-[#1f2937]"
                  : "bg-[color:var(--accent-red)] text-white hover:bg-[#ef4f44]"
              } ${isInactive ? "cursor-not-allowed opacity-50" : ""} flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold`}
              disabled={isInactive}
              aria-label={promocode.type === "link" ? t.getDeal : t.copy}
            >
              {promocode.type === "link" ? (
                <>
                  <Star size={16} />
                  {t.getDeal}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="inline-flex h-12 items-center justify-center rounded-xl border border-[color:var(--border)] bg-white/90 px-4 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)] hover:text-[color:var(--accent-red)]"
            >
              <span className="mr-1.5 inline-flex">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z"
                  />
                  <circle cx="12" cy="12" r="3" strokeWidth="2" />
                </svg>
              </span>
              {t.viewDetails}
            </Link>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--secondary)] px-3 py-1.5 text-xs text-[color:var(--muted-foreground)]">
            <span className="font-semibold text-[color:var(--foreground)]">{t.verified}</span>
            <span className="h-1 w-1 rounded-full bg-[color:var(--border)]" />
            <span>{promocode.type === "link" ? t.getDeal : t.copy}</span>
          </div>
        </div>

        {/* Stats footer */}
        <div className="border-t border-[color:var(--border)] px-5 pt-3">
          <div className="flex items-center justify-between text-xs">
            <div className="text-muted-foreground flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="font-medium">{promocode.viewsCount.toLocaleString()}</span>
              </div>
              <div className="bg-muted-foreground h-3 w-px"></div>
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">{promocode.copyCount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-action="like"
                data-promocode-id={promocode.id}
                data-count={promocode.likesCount}
                data-disabled={isInactive ? "true" : "false"}
                className={`bg-muted text-muted-foreground flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-green-100 hover:text-green-700 ${isInactive ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
                aria-label={`${t.like} ${promocode.likesCount.toLocaleString()}`}
                disabled={isInactive}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                <span className="font-semibold">{promocode.likesCount.toLocaleString()}</span>
              </button>

              <button
                type="button"
                data-action="dislike"
                data-promocode-id={promocode.id}
                data-count={promocode.dislikesCount}
                data-disabled={isInactive ? "true" : "false"}
                className={`bg-muted text-muted-foreground flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-red-100 hover:text-red-700 ${isInactive ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
                aria-label={`${t.dislike} ${promocode.dislikesCount.toLocaleString()}`}
                disabled={isInactive}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                  />
                </svg>
                <span className="font-semibold">{promocode.dislikesCount.toLocaleString()}</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
