"use client";

import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { getApprovedImageUrl } from "@/lib/media";
import {
  ArrowRight,
  MagnifyingGlass,
  SmileySad,
  Storefront as StoreIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type Store = {
  id: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type StoreTranslation = {
  id: string;
  storeId: string;
  language: string;
  name: string;
  slug: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
} | null;

type StoreData = {
  store: Store;
  translation: StoreTranslation;
  promocodesCount: number;
};

interface StoresPageClientProps {
  storesData: StoreData[];
  translations: {
    allStores: string;
    allStoresDescription: string;
    findStore: string;
    promocodes: string;
    view: string;
    viewOffers: string;
    noStoresFound: string;
    searchHint: string;
    storeTitle: string;
    noStoresDescription: string;
  };
}

export default function StoresPageClient({ storesData, translations: t }: StoresPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const tCommon = useTranslations("common");
  const tStore = useTranslations("store");

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) {
      return storesData;
    }

    const query = searchQuery.toLowerCase();
    return storesData.filter((row) => {
      const storeName = row.translation?.name?.toLowerCase() || "";
      const storeDescription = row.translation?.description?.toLowerCase() || "";
      return storeName.includes(query) || storeDescription.includes(query);
    });
  }, [storesData, searchQuery]);

  return (
    <div>
      <div className="page-shell py-10">
        <div className="page-hero-surface">
          <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="brand-kicker mb-4">{tStore("directoryKicker")}</div>
              <h1 className="page-hero-heading mb-3">{t.allStores}</h1>
              <p className="page-hero-copy">{t.allStoresDescription}</p>
            </div>
            <div className="surface-stat px-5 py-4">
              <div className="text-muted-foreground text-sm font-medium">
                {tStore("directoryBadge")}
              </div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                {tStore("curatedRoutesCount", { count: storesData.length })}
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
        {filteredStores.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStores.map((row, index) => {
              const translation = row.translation;
              const store = row.store;
              const promocodesCount = row.promocodesCount || 0;
              const storeName = translation?.name || t.storeTitle;
              const storeLogoUrl = getApprovedImageUrl(store.logoUrl);
              const href = `/store/${translation?.slug || store.id}`;

              return (
                <Link
                  key={store.id}
                  href={href}
                  className="directory-card group"
                  aria-label={tStore("viewStorePromocodesAria", { name: storeName })}
                >
                  <div className="mb-4 flex items-center gap-4">
                    <div className="bg-muted flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl">
                      {storeLogoUrl ? (
                        <Image
                          src={storeLogoUrl}
                          alt={
                            translation?.name
                              ? `${translation.name} - ${tCommon("altStoreLogo")}`
                              : tCommon("altStoreLogoWithSlug", {
                                  slug: translation?.slug || store.id,
                                })
                          }
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
                      <h2 className="text-foreground truncate text-xl font-semibold">
                        {storeName}
                      </h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        <span className="text-foreground font-semibold">{promocodesCount}</span>{" "}
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
