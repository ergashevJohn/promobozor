"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { Clock3, Star, TicketPercent } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Promocode } from "./types";

interface GrouponCardOptimizedProps {
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
  opts: {
    isInactive: boolean;
    isExpiredByDate: boolean;
    t: GrouponCardOptimizedProps["translations"];
  }
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

// Lazy actions component - loaded only when user hovers or interacts
function LazyActions({
  promocodeId,
  type,
  code,
  link,
  detailsHref,
  translations,
  stats,
  disabled = false,
}: {
  promocodeId: string;
  type: "code" | "link" | null;
  code: string | null;
  link: string | null;
  detailsHref: string;
  translations: GrouponCardOptimizedProps["translations"];
  stats: {
    views: number;
    copies: number;
    likes: number;
    dislikes: number;
  };
  disabled?: boolean;
}) {
  const [ActionsComponent, setActionsComponent] = useState<React.ComponentType<{
    promocodeId: string;
    type: "code" | "link" | null;
    code: string | null;
    link: string | null;
    detailsHref: string;
    translations: GrouponCardOptimizedProps["translations"];
    stats: {
      views: number;
      copies: number;
      likes: number;
      dislikes: number;
    };
    disabled?: boolean;
  }> | null>(null);

  useEffect(() => {
    // Lazy load the actions component on mount
    import("./GrouponCardActions").then((mod) => {
      setActionsComponent(
        () =>
          mod.GrouponCardActions as React.ComponentType<{
            promocodeId: string;
            type: "code" | "link" | null;
            code: string | null;
            link: string | null;
            detailsHref: string;
            translations: GrouponCardOptimizedProps["translations"];
            stats: {
              views: number;
              copies: number;
              likes: number;
              dislikes: number;
            };
            disabled?: boolean;
          }>
      );
    });
  }, []);

  if (!ActionsComponent) {
    return (
      <div className="mt-auto flex gap-2">
        <div className="bg-primary/20 h-10 w-full animate-pulse rounded" />
      </div>
    );
  }

  return (
    <ActionsComponent
      promocodeId={promocodeId}
      type={type}
      code={code}
      link={link}
      detailsHref={detailsHref}
      translations={translations}
      stats={stats}
      disabled={disabled}
    />
  );
}

// Client Component with lazy-loaded actions
export default function GrouponCardOptimized({
  promocode,
  priority = false,
  translations: t,
}: GrouponCardOptimizedProps) {
  const translation = promocode.translations?.[0];
  const storeTranslation = promocode.store?.translations?.[0];
  const brandTranslation = promocode.brand?.translations?.[0];
  const displayTranslation = storeTranslation || brandTranslation;
  const timeRemaining = getTimeRemaining(promocode.expiresAt);
  const displayName = displayTranslation?.name || t.unknownStore || t.storeTitle;
  const promocodeTitle = translation?.title || t.promocodeTitle;
  const detailHref = `/promocode/${translation?.slug || promocode.id}`;

  // IMPORTANT: Check promocode status first
  const isDisabledByStatus =
    !promocode.status ||
    promocode.status === "disabled" ||
    promocode.status === "expired" ||
    promocode.status === "draft";

  // Then check expiry date
  const now = new Date().getTime();
  const isExpiredByDate = promocode.expiresAt
    ? new Date(promocode.expiresAt).getTime() < now
    : false;

  const isInactive = isDisabledByStatus || isExpiredByDate;
  const signalLabels = getSignalLabels(promocode, { isInactive, isExpiredByDate, t });

  const sizes = "64px";

  return (
    <Card
      role="article"
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
            {displayTranslation?.slug ? (
              <Link
                href={`/${storeTranslation ? "store" : "brand"}/${displayTranslation.slug}`}
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

        {!isInactive && (
          <Link
            href={detailHref}
            className="absolute inset-0 z-10"
            aria-label={`${t.details} - ${displayName} ${promocodeTitle}`}
          />
        )}

        {/* Interactive actions - lazy loaded on mount */}
        <div className="relative z-20">
          <LazyActions
            promocodeId={promocode.id}
            type={promocode.type || "code"}
            code={promocode.code}
            link={promocode.link ?? null}
            detailsHref={detailHref}
            translations={t}
            disabled={isInactive}
            stats={{
              views: promocode.viewsCount,
              copies: promocode.copyCount,
              likes: promocode.likesCount,
              dislikes: promocode.dislikesCount,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
