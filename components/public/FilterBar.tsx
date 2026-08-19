import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CaretDownIcon, FunnelSimpleIcon } from "@phosphor-icons/react/dist/ssr";

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
    filters: string;
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

type SharedProps = {
  stores: Store[];
  categories: Category[];
  brands: Brand[];
  translations: FilterBarProps["translations"];
  storeId: string;
  categoryId: string;
  brandId: string;
  sortBy: string;
  sortOptions: Record<string, string>;
  otherParams: [string, string][];
  hasFilters: boolean;
  activeFiltersCount: number;
  clearUrl: string;
  pathname: string;
  idPrefix: string;
};

function HiddenParams({ otherParams }: { otherParams: [string, string][] }) {
  return (
    <>
      {otherParams.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
    </>
  );
}

function StoreOptions({ stores, allLabel }: { stores: Store[]; allLabel: string }) {
  return (
    <>
      <option value="">{allLabel}</option>
      {stores.map((store) => {
        const translation = store.translations[0];
        return (
          <option key={store.id} value={store.id}>
            {translation?.name || store.id}
          </option>
        );
      })}
    </>
  );
}

function CategoryOptions({ categories, allLabel }: { categories: Category[]; allLabel: string }) {
  return (
    <>
      <option value="">{allLabel}</option>
      {categories.map((category) => {
        const translation = category.translations[0];
        return (
          <option key={category.id} value={category.id}>
            {translation?.name || category.id}
          </option>
        );
      })}
    </>
  );
}

function BrandOptions({ brands, allLabel }: { brands: Brand[]; allLabel: string }) {
  return (
    <>
      <option value="">{allLabel}</option>
      {brands.map((brand) => {
        const translation = brand.translations[0];
        return (
          <option key={brand.id} value={brand.id}>
            {translation?.name || brand.id}
          </option>
        );
      })}
    </>
  );
}

function MobileFilterForm({
  stores,
  categories,
  brands,
  translations,
  storeId,
  categoryId,
  brandId,
  sortBy,
  sortOptions,
  otherParams,
  hasFilters,
  activeFiltersCount,
  clearUrl,
  pathname,
  idPrefix,
}: SharedProps) {
  return (
    <form action={pathname} method="get" className="space-y-3 md:hidden">
      <HiddenParams otherParams={otherParams} />

      <div>
        <label
          htmlFor={`${idPrefix}-sortBy`}
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          {translations.sortBy}
        </label>
        <Select
          id={`${idPrefix}-sortBy`}
          name="sortBy"
          defaultValue={sortBy}
          className="bg-card min-h-12 px-3"
        >
          <option value="newest">{sortOptions.newest}</option>
          <option value="popular">{sortOptions.popular}</option>
          <option value="ending">{sortOptions.ending}</option>
          <option value="discount">{sortOptions.discount}</option>
        </Select>
      </div>

      <details
        className="border-border bg-card group overflow-hidden rounded-2xl border"
        open={hasFilters || undefined}
      >
        <summary className="text-foreground flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="bg-secondary text-muted-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-xl">
            <FunnelSimpleIcon size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-left">{translations.filters}</span>
          {activeFiltersCount > 0 && (
            <span
              className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-lg bg-[color:var(--accent-red)] px-2 text-xs font-semibold text-white"
              aria-live="polite"
            >
              {activeFiltersCount}
            </span>
          )}
          <CaretDownIcon
            className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>

        <div className="border-border grid grid-cols-1 gap-3 border-t px-4 pt-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${idPrefix}-storeId`} className="text-foreground text-sm font-medium">
              {translations.store}
            </label>
            <Select
              id={`${idPrefix}-storeId`}
              name="storeId"
              defaultValue={storeId}
              className="bg-background min-h-12 px-3"
            >
              <StoreOptions stores={stores} allLabel={translations.allStores} />
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${idPrefix}-categoryId`}
              className="text-foreground text-sm font-medium"
            >
              {translations.category}
            </label>
            <Select
              id={`${idPrefix}-categoryId`}
              name="categoryId"
              defaultValue={categoryId}
              className="bg-background min-h-12 px-3"
            >
              <CategoryOptions categories={categories} allLabel={translations.allCategories} />
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${idPrefix}-brandId`} className="text-foreground text-sm font-medium">
              {translations.brand}
            </label>
            <Select
              id={`${idPrefix}-brandId`}
              name="brandId"
              defaultValue={brandId}
              className="bg-background min-h-12 px-3"
            >
              <BrandOptions brands={brands} allLabel={translations.allBrands} />
            </Select>
          </div>
        </div>
      </details>

      <div className="flex gap-2">
        {hasFilters && (
          <Button asChild variant="outline" className="min-h-12 flex-1">
            <a href={clearUrl}>{translations.clear}</a>
          </Button>
        )}
        <Button type="submit" className="min-h-12 flex-1">
          {translations.apply}
        </Button>
      </div>
    </form>
  );
}

function DesktopFilterForm({
  stores,
  categories,
  brands,
  translations,
  storeId,
  categoryId,
  brandId,
  sortBy,
  sortOptions,
  otherParams,
  hasFilters,
  activeFiltersCount,
  clearUrl,
  pathname,
  idPrefix,
}: SharedProps) {
  return (
    <form
      action={pathname}
      method="get"
      className="border-border bg-card hidden rounded-[1.25rem] border p-6 shadow-[0_18px_48px_-40px_rgba(15,20,25,0.28)] md:block"
    >
      <HiddenParams otherParams={otherParams} />

      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-foreground text-lg font-semibold tracking-tight">
            {translations.title}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-[52ch] text-sm leading-6">
            {translations.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="text-muted-foreground bg-secondary inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-semibold"
            aria-live="polite"
          >
            {activeFiltersCount} {translations.activeFilters}
          </span>
          {hasFilters && (
            <Button asChild variant="outline" size="sm" className="min-h-10">
              <a href={clearUrl}>{translations.clear}</a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-storeId`} className="text-foreground text-sm font-medium">
            {translations.store}
          </label>
          <Select
            id={`${idPrefix}-storeId`}
            name="storeId"
            defaultValue={storeId}
            className="bg-background min-h-11 px-3"
          >
            <StoreOptions stores={stores} allLabel={translations.allStores} />
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-categoryId`} className="text-foreground text-sm font-medium">
            {translations.category}
          </label>
          <Select
            id={`${idPrefix}-categoryId`}
            name="categoryId"
            defaultValue={categoryId}
            className="bg-background min-h-11 px-3"
          >
            <CategoryOptions categories={categories} allLabel={translations.allCategories} />
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-brandId`} className="text-foreground text-sm font-medium">
            {translations.brand}
          </label>
          <Select
            id={`${idPrefix}-brandId`}
            name="brandId"
            defaultValue={brandId}
            className="bg-background min-h-11 px-3"
          >
            <BrandOptions brands={brands} allLabel={translations.allBrands} />
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-sortBy`} className="text-foreground text-sm font-medium">
            {translations.sortBy}
          </label>
          <Select
            id={`${idPrefix}-sortBy`}
            name="sortBy"
            defaultValue={sortBy}
            className="bg-background min-h-11 px-3"
          >
            <option value="newest">{sortOptions.newest}</option>
            <option value="popular">{sortOptions.popular}</option>
            <option value="ending">{sortOptions.ending}</option>
            <option value="discount">{sortOptions.discount}</option>
          </Select>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="submit" className="min-h-11 px-6">
          {translations.apply}
        </Button>
      </div>
    </form>
  );
}

/**
 * Mobile: accordion filters. Desktop: open 4-column control panel.
 * Separate forms avoid duplicate name collisions while keeping GET semantics.
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

  const buildClearUrl = () => {
    const params = new URLSearchParams();
    if (sortBy && sortBy !== "newest") {
      params.set("sortBy", sortBy);
    }
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
  const clearUrl = buildClearUrl();

  const sortOptions = {
    newest: translations.newest,
    popular: translations.popular,
    ending: translations.ending,
    discount: translations.discount,
  };

  const otherParams = Object.entries(currentParams).filter(
    ([key]) => !["storeId", "categoryId", "brandId", "sortBy"].includes(key)
  );

  const shared = {
    stores,
    categories,
    brands,
    translations,
    storeId,
    categoryId,
    brandId,
    sortBy,
    sortOptions,
    otherParams,
    hasFilters,
    activeFiltersCount,
    clearUrl,
    pathname,
  };

  return (
    <div className="mb-5 md:mb-6">
      <MobileFilterForm {...shared} idPrefix="mobile" />
      <DesktopFilterForm {...shared} idPrefix="desktop" />
    </div>
  );
}
