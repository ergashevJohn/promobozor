"use client";

import {
  StoresDirectoryGrid,
  type StoresDirectoryItem,
} from "@/components/public/StoresDirectoryGrid";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { MagnifyingGlass, SmileySad } from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState, type ReactNode } from "react";

type StoresPageClientProps = {
  stores: StoresDirectoryItem[];
  translations: {
    allStores: string;
    allStoresDescription: string;
    findStore: string;
    promocodes: string;
    viewOffers: string;
    noStoresFound: string;
    searchHint: string;
    noStoresDescription: string;
    directoryKicker: string;
    directoryBadge: string;
    curatedRoutesCount: string;
    viewStorePromocodesAria: string;
    altStoreLogo: string;
  };
  /** SSR store grid for the default (unfiltered) view */
  children: ReactNode;
};

export default function StoresPageClient({
  stores,
  translations: t,
  children,
}: StoresPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStores = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return null;
    }
    return stores.filter((store) => store.searchText.includes(query));
  }, [stores, searchQuery]);

  return (
    <div>
      <div className="page-shell py-10">
        <div className="page-hero-surface">
          <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="brand-kicker mb-4">{t.directoryKicker}</div>
              <h1 className="page-hero-heading mb-3">{t.allStores}</h1>
              <p className="page-hero-copy">{t.allStoresDescription}</p>
            </div>
            <div className="surface-stat px-5 py-4">
              <div className="text-muted-foreground text-sm font-medium">{t.directoryBadge}</div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                {t.curatedRoutesCount}
              </div>
            </div>
          </div>

          <div className="relative w-full">
            <label htmlFor="store-search" className="sr-only">
              {t.findStore}
            </label>
            <MagnifyingGlass
              className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              id="store-search"
              name="store-search"
              type="text"
              placeholder={`${t.findStore}…`}
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card h-14 rounded-xl border-[color:var(--border)] pr-4 pl-12 text-base"
            />
          </div>
        </div>
      </div>

      <div className="page-shell pb-12">
        {filteredStores === null ? (
          children
        ) : filteredStores.length > 0 ? (
          <StoresDirectoryGrid
            stores={filteredStores}
            translations={{
              promocodes: t.promocodes,
              viewOffers: t.viewOffers,
              altStoreLogo: t.altStoreLogo,
              viewStorePromocodesAria: t.viewStorePromocodesAria,
            }}
          />
        ) : (
          <div className="empty-state-card">
            <SmileySad
              className="text-muted-foreground mx-auto mb-4 h-12 w-12"
              aria-hidden="true"
            />
            <h2 className="text-foreground mb-2 text-xl font-semibold">{t.noStoresFound}</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {searchQuery ? t.searchHint : t.noStoresDescription}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/promocodes"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[color:var(--accent-red)] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t.viewOffers}
              </Link>
              <Link
                href="/stores"
                className="bg-card inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--border)] px-5 text-sm font-semibold text-[color:var(--foreground)]"
              >
                {t.allStores}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
