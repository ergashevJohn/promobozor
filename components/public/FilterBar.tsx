import { Button } from "@/components/ui/button";

const EMPTY_PARAMS: Record<string, string> = {};

type Store = {
  id: string;
  translations: Array<{
    language: string;
    name: string;
    slug: string;
  }>;
};

type Category = {
  id: string;
  translations: Array<{
    language: string;
    name: string;
    slug: string;
  }>;
};

type Brand = {
  id: string;
  translations: Array<{
    language: string;
    name: string;
    slug: string;
  }>;
};

interface FilterBarProps {
  stores: Store[];
  categories: Category[];
  brands: Brand[];
  translations: {
    store: string;
    category: string;
    brand: string;
    sortBy: string;
    kicker: string;
    title: string;
    description: string;
    activeFilters: string;
    allStores: string;
    allCategories: string;
    allBrands: string;
    newest: string;
    popular: string;
    ending: string;
    discount: string;
    clear: string;
    apply: string;
  };
  currentParams?: Record<string, string>;
  pathname: string;
}

/**
 * Server component for filtering promocodes
 * Uses native HTML forms - works without JavaScript
 * Accessibility: All selects have proper labels and aria-labels
 */
export default function FilterBar({
  stores,
  categories,
  brands,
  translations,
  currentParams = EMPTY_PARAMS,
  pathname,
}: FilterBarProps) {
  const storeId = currentParams.storeId || "";
  const categoryId = currentParams.categoryId || "";
  const brandId = currentParams.brandId || "";
  const sortBy = currentParams.sortBy || "newest";

  // Build URL params for clearing filters (preserve sortBy and other params)
  const buildClearUrl = () => {
    const params = new URLSearchParams();
    // Preserve sortBy
    if (sortBy && sortBy !== "newest") {
      params.set("sortBy", sortBy);
    }
    // Preserve search and other non-filter params
    Object.entries(currentParams).forEach(([key, value]) => {
      if (!["storeId", "categoryId", "brandId"].includes(key) && value) {
        params.set(key, value);
      }
    });
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  const hasFilters = !!(storeId || categoryId || brandId);
  const activeFiltersCount = [storeId, categoryId, brandId].filter(Boolean).length;

  const sortOptions = {
    newest: translations.newest,
    popular: translations.popular,
    ending: translations.ending,
    discount: translations.discount,
  };

  // Get other params to preserve in form
  const otherParams = Object.entries(currentParams).filter(
    ([key]) => !["storeId", "categoryId", "brandId", "sortBy"].includes(key)
  );

  return (
    <div className="filter-shell mb-8 rounded-[28px] border border-[color:var(--border)] bg-white p-5 shadow-[0_24px_60px_-48px_rgba(17,24,39,0.35)] md:p-6">
      <form action={pathname} method="get">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="brand-kicker mb-3">{translations.kicker}</div>
            <h2 className="text-foreground text-xl font-semibold">{translations.title}</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {translations.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full bg-[color:var(--secondary)] px-3 py-2 text-xs font-semibold text-[color:var(--muted-foreground)]">
              {activeFiltersCount} {translations.activeFilters}
            </div>
            {hasFilters && (
              <Button asChild variant="outline" size="sm" className="rounded-full text-sm">
                <a href={buildClearUrl()}>{translations.clear}</a>
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Store Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="storeId" className="text-sm font-medium">
              {translations.store}
            </label>
            <select
              id="storeId"
              name="storeId"
              defaultValue={storeId}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-12 w-full rounded-2xl border px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{translations.allStores}</option>
              {stores.map((store) => {
                const translation = store.translations[0];
                return (
                  <option key={store.id} value={store.id}>
                    {translation?.name || store.id}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="categoryId" className="text-sm font-medium">
              {translations.category}
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={categoryId}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-12 w-full rounded-2xl border px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{translations.allCategories}</option>
              {categories.map((category) => {
                const translation = category.translations[0];
                return (
                  <option key={category.id} value={category.id}>
                    {translation?.name || category.id}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="brandId" className="text-sm font-medium">
              {translations.brand}
            </label>
            <select
              id="brandId"
              name="brandId"
              defaultValue={brandId}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-12 w-full rounded-2xl border px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{translations.allBrands}</option>
              {brands.map((brand) => {
                const translation = brand.translations[0];
                return (
                  <option key={brand.id} value={brand.id}>
                    {translation?.name || brand.id}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sortBy" className="text-sm font-medium">
              {translations.sortBy}
            </label>
            <select
              id="sortBy"
              name="sortBy"
              defaultValue={sortBy}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-12 w-full rounded-2xl border px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="newest">{sortOptions.newest}</option>
              <option value="popular">{sortOptions.popular}</option>
              <option value="ending">{sortOptions.ending}</option>
              <option value="discount">{sortOptions.discount}</option>
            </select>
          </div>
        </div>

        {/* Preserve other params (like search) */}
        {otherParams.map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <div className="mt-5 flex justify-end">
          <Button type="submit" className="rounded-full px-5">
            {translations.apply}
          </Button>
        </div>
      </form>
    </div>
  );
}
