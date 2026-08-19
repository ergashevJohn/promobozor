import { Link } from "@/i18n/navigation";
import { getApprovedImageUrl } from "@/lib/media";
import { ArrowRightIcon, StorefrontIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

interface Store {
  id: string;
  logoUrl: string | null;
  name: string | null;
  slug: string | null;
  count: number;
}

interface BrowseContent {
  stores: {
    title: string;
    description: string;
    featuredLabel: string;
    featuredCta: string;
  };
}

interface Props {
  featuredStore: Store;
  secondaryStores: Store[];
  browse: BrowseContent;
  tCommon: (key: string, params?: Record<string, string | number>) => string;
}

export default function FeaturedStoreSection({
  featuredStore,
  secondaryStores,
  browse,
  tCommon,
}: Props) {
  const featuredStoreImageUrl = getApprovedImageUrl(featuredStore?.logoUrl);

  return (
    <section className="bg-card relative overflow-hidden rounded-[32px] border border-[color:var(--border)] shadow-[0_28px_72px_-52px_rgba(17,24,39,0.4)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,78,66,0.1),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(232,78,66,0.16),transparent_42%)]"
        aria-hidden="true"
      />

      <div className="relative grid lg:grid-cols-2 lg:items-stretch">
        <div className="border-border flex flex-col px-6 py-8 md:px-8 md:py-10 lg:border-r">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            {browse.stores.title}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md text-base leading-7 md:text-lg">
            {browse.stores.description}
          </p>

          <Link
            href={`/store/${featuredStore.slug}`}
            className="group border-border bg-secondary/60 hover:bg-secondary focus-visible:ring-ring mt-8 flex flex-col gap-4 rounded-2xl border p-4 transition-colors hover:border-[color:var(--accent-red)]/35 focus-visible:ring-2 focus-visible:outline-none sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              {featuredStoreImageUrl ? (
                <div className="bg-card relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-[color:var(--border)]">
                  <Image
                    src={featuredStoreImageUrl}
                    alt={
                      featuredStore.name
                        ? `${featuredStore.name} - ${tCommon("altStoreLogo")}`
                        : tCommon("altStoreLogo")
                    }
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="bg-card flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ring-1 ring-[color:var(--border)]">
                  <StorefrontIcon className="text-muted-foreground h-7 w-7" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                  {browse.stores.featuredLabel}
                </p>
                <h3 className="text-foreground mt-1 truncate text-xl font-semibold">
                  {featuredStore.name}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {featuredStore.count} {tCommon("promocodes")}
                </p>
              </div>
            </div>
            <span className="text-foreground inline-flex items-center text-sm font-semibold transition-colors group-hover:text-[color:var(--accent-red)] sm:shrink-0">
              {browse.stores.featuredCta}
              <ArrowRightIcon
                className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>

          <Link
            href="/stores"
            className="text-foreground mt-auto inline-flex min-h-11 items-center gap-2 pt-8 text-sm font-semibold transition-colors hover:text-[color:var(--accent-red)]"
          >
            <span>{tCommon("viewAll")}</span>
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="divide-border flex h-full min-h-0 flex-col divide-y">
          {secondaryStores.slice(0, 6).map((store) => {
            const storeLogoUrl = getApprovedImageUrl(store.logoUrl);

            return (
              <li key={store.id} className="flex min-h-0 flex-1">
                <Link
                  href={`/store/${store.slug}`}
                  className="group hover:bg-accent/60 focus-visible:bg-accent flex h-full min-h-14 w-full items-center gap-4 px-5 py-3 transition-colors focus-visible:outline-none md:px-7"
                >
                  {storeLogoUrl ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[color:var(--secondary)]">
                      <Image
                        src={storeLogoUrl}
                        alt={
                          store.name
                            ? `${store.name} - ${tCommon("altStoreLogo")}`
                            : tCommon("altStoreLogo")
                        }
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--secondary)]">
                      <StorefrontIcon
                        className="h-5 w-5 text-[color:var(--muted-foreground)]"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground truncate text-base font-semibold transition-colors group-hover:text-[color:var(--accent-red)]">
                      {store.name}
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-sm">
                      {store.count} {tCommon("promocodes")}
                    </div>
                  </div>
                  <ArrowRightIcon
                    className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-[opacity,transform,color] group-hover:translate-x-0.5 group-hover:text-[color:var(--accent-red)] group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
