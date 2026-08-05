"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { ArrowRight, MagnifyingGlass, SmileySad, Storefront as StoreIcon } from "@phosphor-icons/react";
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

  // Filter stores based on search query
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
            <div className="rounded-[24px] border border-[color:var(--border)] bg-card/95 px-5 py-4 shadow-[0_18px_48px_-40px_rgba(17,24,39,0.28)]">
              <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
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
              className="h-14 rounded-2xl border-[color:var(--border)] bg-card pr-4 pl-12 text-base shadow-[0_20px_50px_-32px_rgba(17,24,39,0.45)]"
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

              return (
                <Card
                  key={store.id}
                  className="group overflow-hidden border-white/80 py-0 shadow-[0_22px_60px_-46px_rgba(17,24,39,0.45)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[color:var(--accent-red)]"
                >
                  <CardContent className="space-y-4 p-4 md:space-y-6 md:p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-muted flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[0_18px_40px_-24px_rgba(17,24,39,0.45)]">
                        {store.logoUrl ? (
                          <Image
                            src={store.logoUrl}
                            alt={
                              translation?.name
                                ? `${translation.name} - ${tCommon("altStoreLogo")}`
                                : tCommon("altStoreLogoWithSlug", {
                                    slug: translation?.slug || store.id,
                                  })
                            }
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                            sizes="64px"
                            priority={index < 3}
                            loading={index < 3 ? undefined : "lazy"}
                          />
                        ) : (
                          <StoreIcon className="text-foreground h-8 w-8" />
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <h2 className="text-foreground text-2xl leading-none font-semibold">
                          {storeName}
                        </h2>

                        <p className="text-muted-foreground text-base">
                          <span className="text-foreground font-semibold">{promocodesCount}</span>{" "}
                          {t.promocodes}
                        </p>
                      </div>
                    </div>

                    {index < 3 && (
                      <div className="inline-flex rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-red)]">
                        {tStore("highActivityBadge")}
                      </div>
                    )}

                    <Button
                      asChild
                      className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                      size="default"
                    >
                      <Link
                        href={`/store/${translation?.slug || store.id}`}
                        aria-label={tStore("viewStorePromocodesAria", { name: storeName })}
                      >
                        {t.viewOffers} {storeName}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="empty-state-card border-none shadow-none">
            <CardContent className="py-4 text-center">
              <SmileySad className="text-muted-foreground mx-auto mb-4 h-12 w-12" aria-hidden="true" />
              <h2 className="text-foreground mb-2 text-xl font-semibold">
                {t.noStoresFound}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {searchQuery ? t.searchHint : t.noStoresDescription}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/promocodes"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--accent-red)] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {t.viewOffers}
                </Link>
                <Link
                  href="/stores"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-card px-5 text-sm font-semibold text-[color:var(--foreground)]"
                >
                  {t.allStores}
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
