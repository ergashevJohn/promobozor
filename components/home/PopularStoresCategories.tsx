import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  brands,
  brandTranslations,
  categories,
  categoryTranslations,
  db,
  promocodes,
  stores,
  storeTranslations,
} from "@/lib/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { ArrowRight, Building2, CreditCard, Sparkles, Store, Tag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";
import Image from "next/image";

interface Props {
  locale: string;
}

const getHomepageData = (locale: string) =>
  unstable_cache(
    async () => {
      const now = new Date().toISOString();

      const [storesData, categoriesData, brandsData] = await Promise.all([
        db
          .select({
            id: stores.id,
            logoUrl: stores.logoUrl,
            name: storeTranslations.name,
            slug: storeTranslations.slug,
            count: sql<number>`(
              SELECT CAST(COUNT(*) AS INTEGER)
              FROM ${promocodes}
              WHERE ${promocodes.storeId} = ${stores.id}
              AND ${promocodes.status} = 'active'
              AND (${promocodes.expiresAt} IS NULL OR ${promocodes.expiresAt} > ${now}::timestamp)
            )`.as("promo_count"),
          })
          .from(stores)
          .leftJoin(
            storeTranslations,
            and(
              eq(storeTranslations.storeId, stores.id),
              eq(storeTranslations.language, locale as "uz" | "ru" | "en")
            )
          )
          .where(eq(stores.isActive, true))
          .orderBy(desc(stores.priority))
          .limit(8),

        db
          .select({
            id: categories.id,
            imageUrl: categories.imageUrl,
            name: categoryTranslations.name,
            slug: categoryTranslations.slug,
          })
          .from(categories)
          .leftJoin(
            categoryTranslations,
            and(
              eq(categoryTranslations.categoryId, categories.id),
              eq(categoryTranslations.language, locale as "uz" | "ru" | "en")
            )
          )
          .where(eq(categories.isActive, true))
          .orderBy(categories.sortOrder)
          .limit(8),

        db
          .select({
            id: brands.id,
            imageUrl: brands.imageUrl,
            name: brandTranslations.name,
            slug: brandTranslations.slug,
          })
          .from(brands)
          .leftJoin(
            brandTranslations,
            and(
              eq(brandTranslations.brandId, brands.id),
              eq(brandTranslations.language, locale as "uz" | "ru" | "en")
            )
          )
          .where(eq(brands.isActive, true))
          .orderBy(desc(brands.createdAt))
          .limit(8),
      ]);

      return { storesData, categoriesData, brandsData };
    },
    ["homepage-data", locale],
    {
      revalidate: 600,
      tags: ["homepage-data", `homepage-data-${locale}`, "stores", "categories", "brands"],
    }
  )();

export default async function PopularStoresCategories({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const browse = await t.raw("overhaul.browse");

  let storesData: {
    id: string;
    logoUrl: string | null;
    name: string | null;
    slug: string | null;
    count: number;
  }[] = [];
  let categoriesData: {
    id: string;
    imageUrl: string | null;
    name: string | null;
    slug: string | null;
  }[] = [];
  let brandsData: {
    id: string;
    imageUrl: string | null;
    name: string | null;
    slug: string | null;
  }[] = [];

  try {
    const data = await getHomepageData(locale);
    storesData = data.storesData.filter((s) => s.slug);
    categoriesData = data.categoriesData.filter((c) => c.slug);
    brandsData = data.brandsData.filter((b) => b.slug);
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return null;
  }

  if (storesData.length === 0 && categoriesData.length === 0) return null;

  const [featuredStore, ...secondaryStores] = storesData;

  return (
    <div className="mb-16 space-y-16">
      {featuredStore && (
        <section className="grid gap-5 lg:grid-cols-[0.96fr_1.04fr] lg:items-stretch">
          <div className="rounded-[32px] bg-[#111827] p-6 text-white shadow-[0_30px_80px_-46px_rgba(17,24,39,0.72)] md:p-8">
            <div className="brand-kicker border-white/10 bg-white/5 text-white">
              {browse.stores.eyebrow}
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {t("popularStores")}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/72 md:text-lg">
              {browse.stores.description}
            </p>

            <Link
              href={`/store/${featuredStore.slug}`}
              className="mt-8 block rounded-[28px] border border-white/10 bg-white/6 p-5 transition-colors hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/72 uppercase">
                    <Sparkles className="h-3.5 w-3.5" />
                    {browse.stores.featuredLabel}
                  </div>
                  <h3 className="text-2xl font-semibold">{featuredStore.name}</h3>
                  <p className="text-sm text-white/70">
                    {featuredStore.count} {tCommon("promocodes")}
                  </p>
                </div>
                {featuredStore.logoUrl ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/10">
                    <Image
                      src={featuredStore.logoUrl}
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                    <Store className="h-7 w-7 text-white/72" />
                  </div>
                )}
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                <span>{browse.stores.featuredCta}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>

            <Link
              href="/stores"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/82 transition-colors hover:text-white"
            >
              <span>{tCommon("viewAll")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {secondaryStores.slice(0, 6).map((store) => (
              <Link key={store.id} href={`/store/${store.slug}`}>
                <Card className="group h-full border-[color:var(--border)] bg-white py-0 shadow-[0_24px_60px_-48px_rgba(17,24,39,0.42)] transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--accent-red)]/40">
                  <CardContent className="flex h-full items-center gap-4 p-5">
                    {store.logoUrl ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--secondary)]">
                        <Image
                          src={store.logoUrl}
                          alt={
                            store.name
                              ? `${store.name} - ${tCommon("altStoreLogo")}`
                              : tCommon("altStoreLogo")
                          }
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                          sizes="56px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--secondary)]">
                        <Store className="h-5 w-5 text-[color:var(--muted-foreground)]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-foreground truncate text-base font-semibold transition-colors group-hover:text-[color:var(--accent-red)]">
                        {store.name}
                      </div>
                      <div className="text-muted-foreground mt-1 text-sm">
                        {store.count} {tCommon("promocodes")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {categoriesData.length > 0 && (
        <section>
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="brand-kicker mb-3">{browse.categories.eyebrow}</div>
              <h2 className="brand-section-heading text-left">{t("popularCategories")}</h2>
              <p className="text-muted-foreground mt-3 text-base leading-7 md:text-lg">
                {browse.categories.description}
              </p>
            </div>
            <Link
              href="/categories"
              className="text-foreground inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[color:var(--accent-red)]"
            >
              <span>{tCommon("viewAll")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categoriesData.slice(0, 4).map((cat, index) => (
              <Link key={cat.id} href={`/category/${cat.slug}`}>
                <Card className="group h-full border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] py-0 shadow-[0_24px_60px_-48px_rgba(17,24,39,0.42)] transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--accent-red)]/40">
                  <CardContent className="flex h-full flex-col gap-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                          {browse.categories.labels[index] || browse.categories.labels[0]}
                        </div>
                        <h3 className="text-foreground mt-3 text-xl leading-tight font-semibold transition-colors group-hover:text-[color:var(--accent-red)]">
                          {cat.name}
                        </h3>
                      </div>
                      {cat.imageUrl ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--secondary)]">
                          <Image
                            src={cat.imageUrl}
                            alt={
                              cat.name
                                ? `${cat.name} - ${tCommon("altCategoryImage")}`
                                : tCommon("altCategoryImage")
                            }
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--secondary)] text-[color:var(--accent-red)]">
                          <Tag className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-6">
                      {browse.categories.cardDescriptions[index] ||
                        browse.categories.cardDescriptions[0]}
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent-red)]">
                      <span>{browse.categories.cardCta}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {brandsData.length > 0 && (
        <section className="rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(17,24,39,0.92))] p-6 text-white shadow-[0_30px_80px_-46px_rgba(17,24,39,0.72)] md:p-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="brand-kicker border-white/10 bg-white/5 text-white">
                {browse.brands.eyebrow}
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                {t("popularBrands")}
              </h2>
              <p className="mt-3 text-base leading-7 text-white/72 md:text-lg">
                {browse.brands.description}
              </p>
            </div>
            <Link
              href="/brands"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/82 transition-colors hover:text-white"
            >
              <span>{tCommon("viewAll")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {brandsData.map((brand) => (
              <Link key={brand.id} href={`/brand/${brand.slug}`}>
                <div className="group rounded-[24px] border border-white/10 bg-white/6 p-5 transition-all duration-200 hover:-translate-y-1 hover:bg-white/9">
                  <div className="flex items-center gap-4">
                    {brand.imageUrl ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white/10">
                        <Image
                          src={brand.imageUrl}
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
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                        <Building2 className="h-5 w-5 text-white/72" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold transition-colors group-hover:text-white">
                        {brand.name}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-white/48 uppercase">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>{browse.brands.cardLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
