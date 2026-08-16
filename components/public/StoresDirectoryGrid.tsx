import { Link } from "@/i18n/navigation";
import { getApprovedImageUrl } from "@/lib/media";
import { ArrowRight, Storefront as StoreIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

export type StoresDirectoryItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  promocodesCount: number;
};

/** Lightweight client search index (no long descriptions serialized beyond searchText). */
export type StoreSearchIndexItem = {
  id: string;
  name: string;
  slug: string;
  searchText: string;
  logoUrl: string | null;
  promocodesCount: number;
};

type StoresDirectoryGridProps = {
  stores: StoresDirectoryItem[];
  translations: {
    promocodes: string;
    viewOffers: string;
    altStoreLogo: string;
    viewStorePromocodesAria: string;
  };
};

function formatNamedMessage(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export function StoresDirectoryGrid({ stores, translations: t }: StoresDirectoryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stores.map((store, index) => {
        const storeLogoUrl = getApprovedImageUrl(store.logoUrl);
        const href = `/store/${store.slug}`;

        return (
          <Link
            key={store.id}
            href={href}
            className="directory-card group"
            aria-label={formatNamedMessage(t.viewStorePromocodesAria, { name: store.name })}
          >
            <div className="mb-4 flex items-center gap-4">
              <div className="bg-muted flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl">
                {storeLogoUrl ? (
                  <Image
                    src={storeLogoUrl}
                    alt={`${store.name} - ${t.altStoreLogo}`}
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                    sizes="56px"
                    priority={index < 3}
                    loading={index < 3 ? undefined : "lazy"}
                  />
                ) : (
                  <StoreIcon className="text-foreground h-7 w-7" />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="text-foreground truncate text-xl font-semibold">{store.name}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  <span className="text-foreground font-semibold">{store.promocodesCount}</span>{" "}
                  {t.promocodes}
                </p>
              </div>
            </div>

            <div className="text-foreground inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--secondary)]/60 px-4 text-sm font-medium transition-colors group-hover:border-[color:var(--accent-red)] group-hover:bg-[color:var(--accent)]">
              <span>{t.viewOffers}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
