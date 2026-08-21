export const ROUTE_LOCALES = ["uz", "ru", "en"] as const;
export type Locale = (typeof ROUTE_LOCALES)[number];

export type EntityType = "promocode" | "store" | "category" | "brand";
export type ListType = "promocodes" | "stores" | "categories" | "brands";

/** Internal (App Router) path keys used by next-intl Link hrefs */
export const INTERNAL_ENTITY_PATH = {
  promocode: "/promocode",
  store: "/store",
  category: "/category",
  brand: "/brand",
} as const satisfies Record<EntityType, `/${string}`>;

export const INTERNAL_LIST_PATH = {
  promocodes: "/promocodes",
  stores: "/stores",
  categories: "/categories",
  brands: "/brands",
} as const satisfies Record<ListType, `/${string}`>;

/** Localized public URL segments per locale */
export const LOCALIZED_ENTITY_SEGMENT: Record<EntityType, Record<Locale, string>> = {
  promocode: { uz: "chegirma", ru: "promokod", en: "deal" },
  store: { uz: "do-kon", ru: "magazin", en: "store" },
  category: { uz: "kategoriya", ru: "kategoriya", en: "category" },
  brand: { uz: "brend", ru: "brend", en: "brand" },
};

export const LOCALIZED_LIST_SEGMENT: Record<ListType, Record<Locale, string>> = {
  promocodes: { uz: "chegirmalar", ru: "promokody", en: "deals" },
  stores: { uz: "do-konlar", ru: "magaziny", en: "stores" },
  categories: { uz: "kategoriyalar", ru: "kategorii", en: "categories" },
  brands: { uz: "brendlar", ru: "brendy", en: "brands" },
};

/** Legacy English segments (pre-localization) */
export const LEGACY_ENTITY_SEGMENT: Record<EntityType, string> = {
  promocode: "promocode",
  store: "store",
  category: "category",
  brand: "brand",
};

export const LEGACY_LIST_SEGMENT: Record<ListType, string> = {
  promocodes: "promocodes",
  stores: "stores",
  categories: "categories",
  brands: "brands",
};

const ENTITY_BY_ANY_SEGMENT = new Map<string, EntityType>();
const LIST_BY_ANY_SEGMENT = new Map<string, ListType>();

/** Historical type tokens accepted by 410 gone checks (not public URL segments). */
const EXTRA_GONE_ALIASES: Partial<Record<EntityType, readonly string[]>> = {
  promocode: ["promo"],
  store: ["dokon"],
};

for (const [entity, locales] of Object.entries(LOCALIZED_ENTITY_SEGMENT) as Array<
  [EntityType, Record<Locale, string>]
>) {
  for (const segment of Object.values(locales)) {
    ENTITY_BY_ANY_SEGMENT.set(segment, entity);
  }
  ENTITY_BY_ANY_SEGMENT.set(LEGACY_ENTITY_SEGMENT[entity], entity);
  for (const alias of EXTRA_GONE_ALIASES[entity] ?? []) {
    ENTITY_BY_ANY_SEGMENT.set(alias, entity);
  }
}

for (const [list, locales] of Object.entries(LOCALIZED_LIST_SEGMENT) as Array<
  [ListType, Record<Locale, string>]
>) {
  for (const segment of Object.values(locales)) {
    LIST_BY_ANY_SEGMENT.set(segment, list);
  }
  LIST_BY_ANY_SEGMENT.set(LEGACY_LIST_SEGMENT[list], list);
}

export function getEntitySegment(locale: Locale, entityType: EntityType): string {
  return LOCALIZED_ENTITY_SEGMENT[entityType][locale];
}

export function getListSegment(locale: Locale, listType: ListType): string {
  return LOCALIZED_LIST_SEGMENT[listType][locale];
}

/**
 * Public absolute path including locale: /uz/chegirma/my-slug
 */
export function getEntityPath(locale: Locale, entityType: EntityType, slug: string): string {
  return `/${locale}/${getEntitySegment(locale, entityType)}/${slug}`;
}

/**
 * Public absolute list path including locale: /uz/chegirmalar
 */
export function getListPath(locale: Locale, listType: ListType): string {
  return `/${locale}/${getListSegment(locale, listType)}`;
}

/** Per-locale hreflang paths for a list page (for metadata alternates). */
export function getListLanguageAlternates(listType: ListType): Record<Locale, string> {
  return {
    uz: getListPath("uz", listType),
    ru: getListPath("ru", listType),
    en: getListPath("en", listType),
  };
}

const INTERNAL_LIST_BY_PATH = new Map<string, ListType>(
  Object.entries(INTERNAL_LIST_PATH).map(([listType, path]) => [path, listType as ListType])
);

const INTERNAL_ENTITY_BY_PATH = new Map<string, EntityType>(
  Object.entries(INTERNAL_ENTITY_PATH).map(([entityType, path]) => [path, entityType as EntityType])
);

/**
 * Convert next-intl internal href to localized public path (with locale prefix).
 * Examples: /promocodes → /uz/chegirmalar, /store/uzum → /uz/do-kon/uzum
 */
export function resolveInternalHrefToPublicPath(locale: Locale, internalHref: string): string {
  if (internalHref === "/" || internalHref === "") {
    return `/${locale}`;
  }

  const normalized = internalHref.startsWith("/") ? internalHref : `/${internalHref}`;
  const parts = normalized.split("/").filter(Boolean);

  if (parts.length === 1) {
    const listType = INTERNAL_LIST_BY_PATH.get(normalized);
    if (listType) {
      return getListPath(locale, listType);
    }
  }

  if (parts.length === 2) {
    const entityType = INTERNAL_ENTITY_BY_PATH.get(`/${parts[0]}`);
    if (entityType) {
      return getEntityPath(locale, entityType, parts[1]);
    }
  }

  if (parts.length === 1) {
    const staticPath = normalized as keyof typeof STATIC_LOCALIZED_PATHNAMES;
    if (staticPath in STATIC_LOCALIZED_PATHNAMES) {
      const localized = STATIC_LOCALIZED_PATHNAMES[staticPath];
      if (typeof localized !== "string") {
        return `/${locale}${localized[locale]}`;
      }
    }
  }

  if (parts.length === 2 && parts[0] === "collections") {
    return getCollectionPath(locale, parts[1]);
  }

  return `/${locale}${normalized}`;
}

/**
 * Internal pathname for next-intl Link (without locale): /promocode/my-slug
 */
export function getInternalEntityHref(entityType: EntityType, slug: string): string {
  return `${INTERNAL_ENTITY_PATH[entityType]}/${slug}`;
}

/**
 * Legacy English path (pre-localization): /uz/promocode/my-slug
 */
export function getLegacyEntityPath(locale: Locale, entityType: EntityType, slug: string): string {
  return `/${locale}/${LEGACY_ENTITY_SEGMENT[entityType]}/${slug}`;
}

export function resolveEntityTypeFromSegment(segment: string): EntityType | null {
  return ENTITY_BY_ANY_SEGMENT.get(segment) ?? null;
}

export function resolveListTypeFromSegment(segment: string): ListType | null {
  return LIST_BY_ANY_SEGMENT.get(segment) ?? null;
}

const LOCALE_SET = new Set<string>(ROUTE_LOCALES);

/**
 * If pathname still uses legacy English segments, return the localized equivalent
 * (same slug). Returns null when already localized or not a known entity/list path.
 */
export function resolveLegacyLocalizedPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const [localePart, segment, ...rest] = parts;
  if (!LOCALE_SET.has(localePart)) return null;
  const locale = localePart as Locale;

  const entityType = (Object.entries(LEGACY_ENTITY_SEGMENT) as Array<[EntityType, string]>).find(
    ([, legacy]) => legacy === segment
  )?.[0];

  if (entityType && rest.length === 1) {
    const localized = getEntitySegment(locale, entityType);
    if (localized === segment) return null;
    return getEntityPath(locale, entityType, rest[0]);
  }

  const listType = (Object.entries(LEGACY_LIST_SEGMENT) as Array<[ListType, string]>).find(
    ([, legacy]) => legacy === segment
  )?.[0];

  if (listType && rest.length === 0) {
    const localized = getListSegment(locale, listType);
    if (localized === segment) return null;
    return getListPath(locale, listType);
  }

  return null;
}

/**
 * Competitor-style /{locale}/promokod/{slug} that is NOT the RU promocode detail route.
 * UZ/EN still accept /promokod/ as an alias hub path.
 */
export function isCompetitorPromokodAliasPath(
  locale: string,
  segment: string,
  slug: string
): boolean {
  if (segment !== "promokod") return false;
  const hasCompetitorSuffix = /-(promokod|promocode)$/i.test(slug);
  // RU /promokod/ is the real deal detail route — only alias when suffix present
  if (locale === "ru") return hasCompetitorSuffix;
  // UZ/EN: any /promokod/{slug} is competitor alias (deal paths are chegirma/deal)
  return true;
}

/**
 * RU deal slugs must not end with -promokod/-promocode or proxy will 301 them to a hub.
 */
export function isUnsafeRuPromokodDealSlug(slug: string): boolean {
  return /-(promokod|promocode)$/i.test(slug.trim());
}

/** All detail URL segments that should participate in 410 checks */
export const ALL_ENTITY_SEGMENTS_PATTERN = Array.from(
  new Set([
    ...Object.values(LEGACY_ENTITY_SEGMENT),
    ...Object.values(LOCALIZED_ENTITY_SEGMENT).flatMap((m) => Object.values(m)),
  ])
).join("|");

/** All list URL segments (localized + legacy) */
export const ALL_LIST_SEGMENTS_PATTERN = Array.from(
  new Set([
    ...Object.values(LEGACY_LIST_SEGMENT),
    ...Object.values(LOCALIZED_LIST_SEGMENT).flatMap((m) => Object.values(m)),
  ])
).join("|");

function localePathMap(build: (locale: Locale) => string): Record<Locale, string> {
  return {
    uz: build("uz"),
    ru: build("ru"),
    en: build("en"),
  };
}

const STATIC_LOCALIZED_PATHNAMES = {
  "/": "/",
  "/about": localePathMap(() => "/about"),
  "/contact": localePathMap(() => "/contact"),
  "/faq": localePathMap(() => "/faq"),
  "/privacy": localePathMap(() => "/privacy"),
  "/terms": localePathMap(() => "/terms"),
  "/blog": localePathMap(() => "/blog"),
  "/blog/[slug]": localePathMap(() => "/blog/[slug]"),
  "/how-we-verify-promocodes": localePathMap(() => "/how-we-verify-promocodes"),
  "/new": { uz: "/yangi", ru: "/novye", en: "/new" },
  "/collections": { uz: "/tanlovlar", ru: "/podborki", en: "/collections" },
  "/collections/[slug]": {
    uz: "/tanlovlar/[slug]",
    ru: "/podborki/[slug]",
    en: "/collections/[slug]",
  },
  "/partners": { uz: "/hamkorlar", ru: "/partneram", en: "/partners" },
} as const;

export function getNewPromocodesPath(locale: Locale): string {
  return `/${locale}${STATIC_LOCALIZED_PATHNAMES["/new"][locale]}`;
}

export function getCollectionsPath(locale: Locale): string {
  return `/${locale}${STATIC_LOCALIZED_PATHNAMES["/collections"][locale]}`;
}

export function getCollectionPath(locale: Locale, key: string): string {
  return `${getCollectionsPath(locale)}/${key}`;
}

export function getPartnersPath(locale: Locale): string {
  return `/${locale}${STATIC_LOCALIZED_PATHNAMES["/partners"][locale]}`;
}

export function getStaticLanguageAlternates(
  path: "/new" | "/collections" | "/partners"
): Record<Locale, string> {
  return {
    uz: `/uz${STATIC_LOCALIZED_PATHNAMES[path].uz}`,
    ru: `/ru${STATIC_LOCALIZED_PATHNAMES[path].ru}`,
    en: `/en${STATIC_LOCALIZED_PATHNAMES[path].en}`,
  };
}

type EntityListPathnames = {
  readonly [K in ListType as (typeof INTERNAL_LIST_PATH)[K]]: Record<Locale, string>;
} & {
  readonly [K in EntityType as `${(typeof INTERNAL_ENTITY_PATH)[K]}/[slug]`]: Record<
    Locale,
    string
  >;
};

function buildEntityListPathnames(): EntityListPathnames {
  const listEntries = (Object.keys(INTERNAL_LIST_PATH) as ListType[]).map((listType) => {
    const internalPath = INTERNAL_LIST_PATH[listType];
    return [
      internalPath,
      localePathMap((locale) => `/${LOCALIZED_LIST_SEGMENT[listType][locale]}`),
    ] as const;
  });

  const entityEntries = (Object.keys(INTERNAL_ENTITY_PATH) as EntityType[]).map((entityType) => {
    const internalPath = `${INTERNAL_ENTITY_PATH[entityType]}/[slug]` as const;
    return [
      internalPath,
      localePathMap((locale) => `/${LOCALIZED_ENTITY_SEGMENT[entityType][locale]}/[slug]`),
    ] as const;
  });

  return Object.fromEntries([...listEntries, ...entityEntries]) as EntityListPathnames;
}

/**
 * Build next-intl pathnames config for localized public URLs.
 * Internal keys stay English; middleware rewrites to localized segments.
 * Entity/list entries are derived from LOCALIZED_* maps (single source of truth).
 */
export const localizedPathnames: typeof STATIC_LOCALIZED_PATHNAMES & EntityListPathnames = {
  ...STATIC_LOCALIZED_PATHNAMES,
  ...buildEntityListPathnames(),
};

/**
 * Type tokens (legacy name, localized segment, or historical alias) that match a
 * gone entry of the form `type:slug`.
 */
export function getGoneTypeAliases(type: string): string[] {
  const normalizedType = type.trim().toLowerCase();
  if (!normalizedType) {
    return [];
  }

  const entityType =
    (Object.keys(LEGACY_ENTITY_SEGMENT) as EntityType[]).find(
      (entity) => entity === normalizedType
    ) ?? resolveEntityTypeFromSegment(normalizedType);

  if (!entityType) {
    return [normalizedType];
  }

  return Array.from(
    new Set([
      LEGACY_ENTITY_SEGMENT[entityType],
      ...Object.values(LOCALIZED_ENTITY_SEGMENT[entityType]),
      ...(EXTRA_GONE_ALIASES[entityType] ?? []),
    ])
  );
}
