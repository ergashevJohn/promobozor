// Fully Server Component Promocode List
// Uses GrouponCardServer (server-side) + CardActionsProvider (single client component)
import { CardActionsProvider } from "@/components/public/CardActionsProvider";
import GrouponCardServer from "@/components/public/GrouponCardServer";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Promocode } from "./types";

interface PromocodeListServerProps {
  promocodes: Promocode[];
  maxItems?: number;
  mobileMaxItems?: number;
  translations: {
    noPromocodes: string;
    noPromocodesDescription: string;
    emptyActionLabel?: string;
    emptyActionHref?: string;
    emptyHint?: string;
    card: {
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
      conditionsLabel?: string;
      codeCopied: string;
      copyError: string;
    };
  };
}

/**
 * Server-side promocode list component
 * Renders static HTML with ONE minimal client component for interactions
 * This drastically reduces client-side hydration overhead
 */
export function PromocodeListOptimized({
  promocodes,
  maxItems,
  mobileMaxItems,
  translations,
}: PromocodeListServerProps) {
  if (promocodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="bg-muted mb-6 flex h-24 w-24 items-center justify-center rounded-full">
          <svg
            className="text-muted-foreground h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-foreground mb-2 text-xl font-semibold">{translations.noPromocodes}</h2>
        <p className="text-muted-foreground max-w-md text-center">
          {translations.noPromocodesDescription}
        </p>
        {translations.emptyHint && (
          <p className="text-muted-foreground mt-3 max-w-lg text-center text-sm">
            {translations.emptyHint}
          </p>
        )}
        {translations.emptyActionLabel && translations.emptyActionHref && (
          <div className="mt-6">
            <Button asChild>
              <Link href={translations.emptyActionHref}>{translations.emptyActionLabel}</Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  const visiblePromocodes = maxItems ? promocodes.slice(0, maxItems) : promocodes;

  return (
    <>
      {/* Single global client component for ALL card interactions */}
      <CardActionsProvider
        translations={{
          codeCopied: translations.card.codeCopied,
          copyError: translations.card.copyError,
        }}
      />

      {/* All cards are server components - no hydration per card */}
      <div className="stagger-reveal grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-[1.15fr_0.95fr_1.05fr]">
        {visiblePromocodes.map((promocode, index) => {
          const hiddenOnMobile = mobileMaxItems !== undefined && index >= mobileMaxItems;
          return (
            <div key={promocode.id} className={hiddenOnMobile ? "hidden sm:block" : ""}>
              <GrouponCardServer
                promocode={promocode}
                priority={index < 4}
                translations={translations.card}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
