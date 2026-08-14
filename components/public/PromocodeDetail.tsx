// Removing "use client" to allow Server Component rendering

import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { Language } from "@/lib/i18n";
import { getPromocodeDisplayData } from "@/lib/promocode-utils";
import GrouponCard from "./GrouponCard";
import {
  PromocodeActionButton,
  PromocodeCodeBox,
  PromocodeDiscount,
  PromocodeExpiry,
  PromocodeHeader,
  PromocodeProvider,
  PromocodeStats,
  PromocodeTerms,
} from "./promocode";
import { Promocode } from "./types";

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
      editorVerdict: string;
      lastVerified: string;
      shortDescription: string;
      minOrder: string;
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
  const displayData = getPromocodeDisplayData(promocode, translations);

  return (
    <div className="page-shell py-8">
      {contextualLinks.length > 0 && (
        <nav
          className="mb-8 flex flex-wrap gap-2"
          aria-label={translations.promocode.exploreDescription}
        >
          {contextualLinks.map((item) => (
            <Link
              key={`${item.type}-${item.href}`}
              href={item.href}
              className="focus-visible:ring-ring/50 inline-flex min-h-11 items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--secondary)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)] hover:text-[color:var(--foreground)] focus-visible:ring-[3px] focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      <Card className="brand-panel overflow-hidden py-0">
        <div className="p-4 px-4 py-6 sm:p-6 md:p-8">
          <PromocodeHeader
            promocode={promocode}
            translations={translations}
            displayData={displayData}
          />

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
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

              <PromocodeProvider promocode={promocode} lang={lang} translations={translations}>
                <PromocodeActionButton />
              </PromocodeProvider>
            </div>

            <div className="space-y-6">
              <PromocodeExpiry translations={translations} displayData={displayData} lang={lang} />

              <PromocodeProvider promocode={promocode} lang={lang} translations={translations}>
                <PromocodeStats />
              </PromocodeProvider>
            </div>
          </div>

          <PromocodeTerms
            translations={translations}
            displayData={displayData}
            minOrderAmount={promocode.minOrderAmount}
            currency={promocode.currency}
          />
        </div>
      </Card>

      {relatedPromocodes.length > 0 && (
        <section className="mt-12">
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
