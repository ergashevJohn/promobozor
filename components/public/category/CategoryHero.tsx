import SafeHtmlContent from "@/components/public/SafeHtmlContent";

interface CategoryHeroProps {
  categoryName: string;
  categoryDescription?: string | null;
  totalPromocodes: number;
  uniqueStoreCount: number;
  uniqueBrandCount: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export default function CategoryHero({
  categoryName,
  categoryDescription,
  totalPromocodes,
  uniqueStoreCount,
  uniqueBrandCount,
  t,
}: CategoryHeroProps) {
  return (
    <div className="page-shell pb-10">
      <div className="page-hero-surface">
        <div className="max-w-3xl">
          <div className="brand-kicker mb-4">{t("heroKicker")}</div>
          <h1 className="text-foreground mb-3 text-4xl font-semibold tracking-tight md:text-5xl">
            {t("h1Title", { name: categoryName })}
          </h1>
          {categoryDescription && (
            <SafeHtmlContent
              html={categoryDescription}
              className="text-muted-foreground max-w-[65ch] text-lg leading-8"
            />
          )}
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-[color:var(--border)] pt-6">
            <div>
              <dt className="text-muted-foreground text-sm">{t("activePromocodes")}</dt>
              <dd className="mt-1 text-2xl font-semibold">{totalPromocodes}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">{t("storeRoutesLabel")}</dt>
              <dd className="mt-1 text-2xl font-semibold">{uniqueStoreCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">{t("brandContextsLabel")}</dt>
              <dd className="mt-1 text-2xl font-semibold">{uniqueBrandCount}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
