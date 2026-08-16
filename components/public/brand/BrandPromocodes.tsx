import PromocodeListWithPagination from "@/components/public/PromocodeListWithPagination";
import { PromocodeListOptimized } from "@/components/public/PromocodeListServer";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import type { Promocode } from "@/components/public/types";

interface BrandPromocodesProps {
  allPromocodes: Promocode[];
  totalPromocodesCount: number;
  brandId: string;
  brandName: string;
  listKicker: string;
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
  t: (key: string, params?: Record<string, string | number>) => string;
}

export default function BrandPromocodes({
  allPromocodes,
  totalPromocodesCount,
  brandId,
  brandName,
  listKicker,
  translations,
  t,
}: BrandPromocodesProps) {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-foreground text-3xl font-semibold">{t("allPromocodes")}</h2>
        <p className="text-muted-foreground mt-2">
          {t("allPromocodesDescription", { name: brandName })}
        </p>
      </div>
      {totalPromocodesCount > 0 ? (
        <PromocodeListWithPagination
          initialCount={allPromocodes.length}
          initialIds={allPromocodes.map((p) => p.id)}
          totalCount={totalPromocodesCount}
          limit={20}
          filters={{
            brandId: brandId,
          }}
          translations={translations}
          listKicker={listKicker}
        >
          <PromocodeListOptimized promocodes={allPromocodes} translations={translations} />
        </PromocodeListWithPagination>
      ) : totalPromocodesCount === 0 ? (
        <div className="empty-state-card">
          <MagnifyingGlass
            className="text-muted-foreground mx-auto mb-4 h-12 w-12"
            aria-hidden="true"
          />
          <h2 className="text-foreground mb-2 text-xl font-semibold">{t("noPromocodes")}</h2>
          <p className="text-muted-foreground">{t("checkBackLater")}</p>
        </div>
      ) : null}
    </section>
  );
}
