import SafeHtmlContent from "@/components/public/SafeHtmlContent";
import { VerifiedBadge } from "@/components/public/VerifiedBadge";
import {
  EntityHeroFrame,
  EntityMetaRow,
  EntityMetricRail,
} from "@/components/public/entity-detail/EntityDetailPrimitives";
import { getApprovedImageUrl } from "@/lib/media";
import { ArrowUpRightIcon, StorefrontIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

interface StoreHeroProps {
  name: string;
  description: string | null | undefined;
  logoUrl: string | null;
  websiteUrl: string | null;
  totalPromocodesCount: number;
  uniqueBrandCount: number;
  uniqueCategoryCount: number;
  featuredPromocodesCount: number;
  totalViews: number;
  totalCopies: number;
  verifiedAt: Date | string | null | undefined;
  translations: {
    heroKicker: string;
    h1Title: string;
    activePromocodes: string;
    connectedBrandsLabel: string;
    activeCategoryPathsLabel: string;
    visitWebsite: string;
    viewOffers: string;
    views: string;
    uses: string;
    altStoreLogo: string;
    altStoreLogoWithSlug: (slug: string) => string;
    featured: string;
    lastReviewed: string;
  };
  slug: string;
  locale: string;
}

export default function StoreHero({
  name,
  description,
  logoUrl,
  websiteUrl,
  totalPromocodesCount,
  uniqueBrandCount,
  uniqueCategoryCount,
  featuredPromocodesCount,
  totalViews,
  totalCopies,
  verifiedAt,
  translations,
  slug,
  locale,
}: StoreHeroProps) {
  const storeLogoUrl = getApprovedImageUrl(logoUrl);

  return (
    <div className="page-shell pb-4 md:pb-5">
      <EntityHeroFrame variant="store">
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end">
          <div>
            <div className="flex items-start gap-4 md:gap-5">
              {storeLogoUrl ? (
                <div className="bg-card border-border relative mt-1 flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border shadow-[0_16px_40px_-28px_rgba(15,20,25,0.35)] md:size-20">
                  <Image
                    src={storeLogoUrl}
                    alt={
                      name
                        ? `${name} - ${translations.altStoreLogo}`
                        : translations.altStoreLogoWithSlug(slug)
                    }
                    fill
                    className="object-contain p-2"
                    sizes="80px"
                    priority
                  />
                </div>
              ) : (
                <div className="bg-muted border-border mt-1 flex size-16 shrink-0 items-center justify-center rounded-[1.25rem] border text-[color:var(--accent-red)] md:size-20">
                  <StorefrontIcon
                    className="size-9 md:size-10"
                    weight="duotone"
                    aria-hidden="true"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="brand-kicker mb-3">{translations.heroKicker}</p>
                <h1 className="page-hero-heading">{translations.h1Title}</h1>
              </div>
            </div>
            {description ? (
              <SafeHtmlContent
                html={description}
                className="text-muted-foreground mt-5 max-w-[65ch] text-base leading-7 md:text-lg md:leading-8"
              />
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {totalPromocodesCount > 0 ? (
                <a
                  href="#offers"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[color:var(--accent-red)] px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)]/50 focus-visible:outline-none active:translate-y-0"
                >
                  {translations.viewOffers}
                </a>
              ) : null}
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  className="border-border text-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors hover:bg-[color:var(--accent)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)]/50 focus-visible:outline-none"
                >
                  {translations.visitWebsite}
                  <ArrowUpRightIcon className="size-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>

          <aside className="relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--secondary)]/75 p-5 md:p-6">
            <p className="text-muted-foreground text-sm leading-6">
              {uniqueBrandCount} {translations.connectedBrandsLabel} · {uniqueCategoryCount}{" "}
              {translations.activeCategoryPathsLabel}
            </p>
            <div className="mt-6">
              <EntityMetaRow>
                <VerifiedBadge
                  verifiedAt={verifiedAt}
                  locale={locale}
                  label={translations.lastReviewed}
                />
              </EntityMetaRow>
            </div>
          </aside>
        </div>

        <div className="relative mt-8">
          <EntityMetricRail
            items={[
              { label: translations.activePromocodes, value: totalPromocodesCount },
              { label: translations.featured, value: featuredPromocodesCount },
              { label: translations.uses, value: totalCopies },
              { label: translations.views, value: totalViews },
            ]}
          />
        </div>
      </EntityHeroFrame>
    </div>
  );
}
