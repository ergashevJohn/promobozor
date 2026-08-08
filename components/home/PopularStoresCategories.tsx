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
import { getApprovedImageUrl } from "@/lib/media";
import { ArrowRight, Buildings, CreditCard, Storefront, Tag } from "@phosphor-icons/react/dist/ssr";
import { and, desc, eq, sql } from "drizzle-orm";
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
            count: sql<number>`CAST(COUNT(${promocodes.id}) AS INTEGER)`.as("promo_count"),
          })
          .from(stores)
          .leftJoin(
            storeTranslations,
            and(
              eq(storeTranslations.storeId, stores.id),
              eq(storeTranslations.language, locale as "uz" | "ru" | "en")
            )
          )
          .leftJoin(
            promocodes,
            and(
              eq(promocodes.storeId, stores.id),
              eq(promocodes.status, "active"),
              sql`(${promocodes.expiresAt} IS NULL OR ${promocodes.expiresAt} > ${now}::timestamp)`
            )
          )
          .where(eq(stores.isActive, true))
          .groupBy(
            stores.id,
            stores.logoUrl,
            stores.priority,
            storeTranslations.name,
            storeTranslations.slug
          )
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
  const featuredStoreImageUrl = getApprovedImageUrl(featuredStore?.logoUrl);

  return (
    <div className="mb-16 space-y-16">
      {featuredStore && (
        <section className="bg-card relative overflow-hidden rounded-[32px] border border-[color:var(--border)] shadow-[0_28px_72px_-52px_rgba(17,24,39,0.4)]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,78,66,0.1),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(232,78,66,0.16),transparent_42%)]"
            aria-hidden="true"
          />

          <div className="relative grid lg:grid-cols-2 lg:items-stretch">
            <div className="border-border flex flex-col px-6 py-8 md:px-8 md:py-10 lg:border-r">
              <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                {t("popularStores")}
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
                      <Storefront className="text-muted-foreground h-7 w-7" aria-hidden="true" />
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
                  <ArrowRight
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
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
                          <Storefront
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
                      <ArrowRight
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
      )}

      {categoriesData.length > 0 && (
        <section>
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
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

          <div className="stagger-reveal grid gap-6 md:grid-cols-2 xl:grid-cols-[1.15fr_0.95fr_1.05fr_0.9fr]">
            {categoriesData.slice(0, 4).map((cat, index) => {
              const categoryImageUrl = getApprovedImageUrl(cat.imageUrl);

              return (
                <Link key={cat.id} href={`/category/${cat.slug}`}>
                  <Card className="group bg-card h-full border-[color:var(--border)] py-0 shadow-[0_24px_60px_-48px_rgba(15,20,25,0.28)] transition-[border-color,box-shadow] duration-200 hover:border-[color:var(--accent-red)]/40 dark:shadow-[0_24px_60px_-48px_rgba(0,0,0,0.55)]">
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
                        {categoryImageUrl ? (
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--secondary)]">
                            <Image
                              src={categoryImageUrl}
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
              );
            })}
          </div>
        </section>
      )}

      {brandsData.length > 0 && (
        <section className="bg-card rounded-[32px] border border-[color:var(--border)] p-6 shadow-[0_28px_72px_-52px_rgba(17,24,39,0.4)] md:p-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                {t("popularBrands")}
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
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="stagger-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {brandsData.map((brand) => {
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
                          <Buildings className="text-muted-foreground h-5 w-5" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-foreground truncate text-base font-semibold transition-colors group-hover:text-[color:var(--accent-red)]">
                          {brand.name}
                        </div>
                        <div className="text-muted-foreground mt-1 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase">
                          <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
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
      )}
    </div>
  );
}
