import SafeHtmlContent from "@/components/public/SafeHtmlContent";
import { VerifiedBadge } from "@/components/public/VerifiedBadge";
import {
  EntityHeroFrame,
  EntityMetaRow,
  EntityMetricRail,
} from "@/components/public/entity-detail/EntityDetailPrimitives";
import { getApprovedImageUrl } from "@/lib/media";
import { TagIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

interface CategoryHeroProps {
  categoryName: string;
  categoryDescription?: string | null;
  categoryImageUrl?: string | null;
  totalPromocodes: number;
  uniqueStoreCount: number;
  uniqueBrandCount: number;
  verifiedAt: Date | string | null | undefined;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export default function CategoryHero({
  categoryName,
  categoryDescription,
  categoryImageUrl,
  totalPromocodes,
  uniqueStoreCount,
  uniqueBrandCount,
  verifiedAt,
  locale,
  t,
}: CategoryHeroProps) {
  const imageUrl = getApprovedImageUrl(categoryImageUrl);

  return (
    <div className="page-shell pb-4 md:pb-5">
      <EntityHeroFrame variant="category">
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] lg:items-end">
          <div>
            <div className="flex items-start gap-4 md:gap-5">
              <div className="bg-muted border-border relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border md:size-20">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={categoryName}
                    fill
                    className="object-cover"
                    sizes="80px"
                    priority
                  />
                ) : (
                  <TagIcon
                    className="size-9 text-[color:var(--accent-red)] md:size-10"
                    weight="duotone"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="brand-kicker mb-3">{t("heroKicker")}</p>
                <h1 className="page-hero-heading">{t("h1Title", { name: categoryName })}</h1>
              </div>
            </div>
            {categoryDescription ? (
              <SafeHtmlContent
                html={categoryDescription}
                className="text-muted-foreground mt-5 max-w-[65ch] text-base leading-7 md:text-lg md:leading-8"
              />
            ) : null}
            {totalPromocodes > 0 ? (
              <a
                href="#offers"
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[color:var(--accent-red)] px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)]/50 focus-visible:outline-none active:translate-y-0 sm:w-auto"
              >
                {t("viewOffers")}
              </a>
            ) : null}
          </div>
          <aside className="relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--secondary)]/75 p-5 md:p-6">
            <p className="text-foreground text-lg font-semibold tracking-[-0.025em]">
              {t("snapshotTitle")}
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {t("snapshotDescription")}
            </p>
            <div className="mt-6">
              <EntityMetaRow>
                <VerifiedBadge verifiedAt={verifiedAt} locale={locale} label={t("lastReviewed")} />
              </EntityMetaRow>
            </div>
          </aside>
        </div>
        <div className="relative mt-8">
          <EntityMetricRail
            items={[
              { label: t("activePromocodes"), value: totalPromocodes },
              { label: t("storeRoutesLabel"), value: uniqueStoreCount },
              { label: t("brandContextsLabel"), value: uniqueBrandCount },
            ]}
          />
        </div>
      </EntityHeroFrame>
    </div>
  );
}
