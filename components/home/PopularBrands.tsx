import { Link } from "@/i18n/navigation";
import { getApprovedImageUrl } from "@/lib/media";
import { ArrowRightIcon, BuildingsIcon, CreditCardIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

interface Brand {
  id: string;
  imageUrl: string | null;
  name: string | null;
  slug: string | null;
}

interface BrowseContent {
  brands: {
    title: string;
    description: string;
    cardLabel: string;
  };
}

interface Props {
  brands: Brand[];
  browse: BrowseContent;
  tCommon: (key: string, params?: Record<string, string | number>) => string;
}

export default function PopularBrands({ brands, browse, tCommon }: Props) {
  if (brands.length === 0) return null;

  return (
    <section className="bg-card rounded-[32px] border border-[color:var(--border)] p-6 shadow-[0_28px_72px_-52px_rgba(17,24,39,0.4)] md:p-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            {browse.brands.title}
          </h2>
          <p className="text-muted-foreground mt-3 text-base leading-7 md:text-lg">
            {browse.brands.description}
          </p>
        </div>
        <Link
          href="/brands"
          className="text-foreground inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[color:var(--accent-red)]"
        >
          <span>{tCommon("viewAll")}</span>
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="stagger-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {brands.map((brand) => {
          const brandImageUrl = getApprovedImageUrl(brand.imageUrl);

          return (
            <Link key={brand.id} href={`/brand/${brand.slug}`}>
              <div className="group border-border bg-secondary/40 hover:bg-secondary rounded-[20px] border p-5 transition-colors hover:border-[color:var(--accent-red)]/35">
                <div className="flex items-center gap-4">
                  {brandImageUrl ? (
                    <div className="bg-card relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-[color:var(--border)]">
                      <Image
                        src={brandImageUrl}
                        alt={
                          brand.name
                            ? `${brand.name} - ${tCommon("altBrandLogo")}`
                            : tCommon("altBrandLogo")
                        }
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                        sizes="56px"
                      />
                    </div>
                  ) : (
                    <div className="bg-card flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-[color:var(--border)]">
                      <BuildingsIcon className="text-muted-foreground h-5 w-5" aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-foreground truncate text-base font-semibold transition-colors group-hover:text-[color:var(--accent-red)]">
                      {brand.name}
                    </div>
                    <div className="text-muted-foreground mt-1 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase">
                      <CreditCardIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{browse.brands.cardLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
