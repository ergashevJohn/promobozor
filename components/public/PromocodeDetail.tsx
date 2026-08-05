// Removing "use client" to allow Server Component rendering

import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { Language } from "@/lib/i18n";
import GrouponCard from "./GrouponCard";
import {
  PromocodeProvider,
  PromocodeHeader,
  PromocodeCodeBox,
  PromocodeDiscount,
  PromocodeActionButton,
  PromocodeExpiry,
  PromocodeStats,
  PromocodeTerms,
} from "./promocode";
import { Promocode } from "./types";
import { getPromocodeDisplayData } from "@/lib/promocode-utils";

const EMPTY_RELATED: Promocode[] = [];

interface PromocodeDetailProps {
  promocode: Promocode;
  relatedPromocodes?: Promocode[];
  contextualLinks?: Array<{
    label: string;
    href: string;
    type: string;
  }>;
  lang?: Language;
  translations: {
    promocode: {
      title: string;
      activateLink: string;
      codeCopied: string;
      copied: string;
      copies: string;
      copyCode: string;
      copyError: string;
      discount: string;
      expiresOn: string;
      linkActivated: string;
      promoCode: string;
      promoLink: string;
      redirecting: string;
      relatedOffers: string;
      views: string;
      daysRemaining: string;
      expiryDate: string;
      expired: string;
      share: string;
      terms: string;
      amount: string;
      percentage: string;
      proofKicker: string;
      proofDescription: string;
      discountLabel: string;
      exploreKicker: string;
      exploreDescription: string;
      relatedDealsKicker: string;
    };
    common: {
      featured: string;
    };
    card: {
      activateLink: string;
      copied: string;
      copy: string;
      details: string;
      dislike: string;
      endingSoon: string;
      featured: string;
      fresh: string;
      getDeal: string;
      like: string;
      popular: string;
      unknownStore: string;
      storeTitle: string;
      promocodeTitle: string;
      unlimited: string;
      verified: string;
      viewDetails: string;
      storeOffer: string;
      brandOffer: string;
      directDeal: string;
      codeReady: string;
      dealRoute: string;
      promoCodeLabel: string;
      codeCopied: string;
      copyError: string;
      expired: string;
      disabled: string;
    };
  };
}

export default function PromocodeDetail({
  promocode,
  relatedPromocodes = EMPTY_RELATED,
  contextualLinks = [],
  lang,
  translations,
}: PromocodeDetailProps) {
  // Compute display data once on the server and pass to children
  const displayData = getPromocodeDisplayData(promocode, translations);
  const signalLabels = [
    promocode.isFeatured && !displayData.isInactive ? translations.card.featured : null,
    !displayData.isInactive ? translations.card.verified : null,
    displayData.daysUntilExpiry !== null &&
    displayData.daysUntilExpiry >= 0 &&
    displayData.daysUntilExpiry <= 3 &&
    !displayData.isInactive
      ? translations.card.endingSoon
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="page-shell py-8">
      <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
        <div className="surface-card p-6">
          <div className="brand-kicker mb-4">{translations.promocode.proofKicker}</div>
          <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">
            {displayData.displayName}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-7 sm:text-base">
            {translations.promocode.proofDescription}
          </p>
          {signalLabels.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {signalLabels.map((label) => (
                <span
                  key={label}
                  className="bg-card rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-[color:var(--foreground)] uppercase"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="surface-stat">
            <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
              {translations.promocode.discountLabel}
            </div>
            <div className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
              {displayData.discountDisplay}
            </div>
          </div>
          <div className="surface-stat">
            <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
              {translations.promocode.views}
            </div>
            <div className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
              {promocode.viewsCount}
            </div>
          </div>
          <div className="surface-stat">
            <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
              {translations.promocode.copies}
            </div>
            <div className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
              {promocode.copyCount}
            </div>
          </div>
        </div>
      </div>

      {contextualLinks.length > 0 && (
        <div className="surface-card mb-8 p-5">
          <div className="brand-kicker mb-3">{translations.promocode.exploreKicker}</div>
          <p className="text-muted-foreground mb-4 text-sm leading-6">
            {translations.promocode.exploreDescription}
          </p>
          <div className="flex flex-wrap gap-3">
            {contextualLinks.map((item) => (
              <Link
                key={`${item.type}-${item.href}`}
                href={item.href}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--secondary)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)] hover:text-[color:var(--accent-red)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Promocode Card */}
      <Card className="brand-panel overflow-hidden py-0">
        <div className="p-4 px-4 py-6 sm:p-6 md:p-8">
          {/* Header */}
          <PromocodeHeader
            promocode={promocode}
            translations={translations}
            displayData={displayData}
          />

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            {/* Left Side - Promo Details */}
            <div className="space-y-6">
              <PromocodeCodeBox
                promocode={promocode}
                translations={translations}
                displayData={displayData}
              />
              <PromocodeDiscount
                promocode={promocode}
                translations={translations}
                displayData={displayData}
              />

              {/* Action Button needs Context for interaction (Click/Copy) */}
              <PromocodeProvider promocode={promocode} lang={lang} translations={translations}>
                <PromocodeActionButton />
              </PromocodeProvider>
            </div>

            {/* Right Side - Stats & Info */}
            <div className="space-y-6">
              <PromocodeExpiry translations={translations} displayData={displayData} lang={lang} />

              {/* Stats needs Context for interaction (Like/Dislike/Share) */}
              <PromocodeProvider promocode={promocode} lang={lang} translations={translations}>
                <PromocodeStats />
              </PromocodeProvider>
            </div>
          </div>

          {/* Terms & Conditions */}
          <PromocodeTerms translations={translations} displayData={displayData} />
        </div>
      </Card>

      {/* Related Promocodes */}
      {relatedPromocodes.length > 0 && (
        <section className="mt-12">
          <div className="brand-kicker mb-3">{translations.promocode.relatedDealsKicker}</div>
          <h2 className="text-foreground mb-6 text-2xl font-semibold sm:text-3xl">
            {translations.promocode.relatedOffers}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPromocodes.map((promo) => (
              <GrouponCard
                key={promo.id}
                promocode={promo}
                translations={{
                  featured: translations.card.featured,
                  verified: translations.card.verified,
                  fresh: translations.card.fresh,
                  popular: translations.card.popular,
                  endingSoon: translations.card.endingSoon,
                  unlimited: translations.card.unlimited,
                  unknownStore: translations.card.unknownStore,
                  activateLink: translations.card.activateLink,
                  details: translations.card.details,
                  viewDetails: translations.card.viewDetails,
                  storeOffer: translations.card.storeOffer,
                  brandOffer: translations.card.brandOffer,
                  directDeal: translations.card.directDeal,
                  codeReady: translations.card.codeReady,
                  dealRoute: translations.card.dealRoute,
                  promoCodeLabel: translations.card.promoCodeLabel,
                  copy: translations.card.copy,
                  copied: translations.card.copied,
                  getDeal: translations.card.getDeal,
                  like: translations.card.like,
                  dislike: translations.card.dislike,
                  storeTitle: translations.card.storeTitle,
                  promocodeTitle: translations.card.promocodeTitle,
                  codeCopied: translations.promocode.codeCopied,
                  copyError: translations.promocode.copyError,
                  expired: translations.card.expired,
                  disabled: translations.card.disabled,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
