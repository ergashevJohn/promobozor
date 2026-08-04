/**
 * Redis caching layer for frequently accessed data
 * Uses Upstash Redis for distributed caching
 *
 * Cache keys follow this pattern:
 * - promocodes:list:{lang}:{storeId}:{categoryId}:{brandId}:{search}:{sortBy}
 * - stores:list:{lang}
 * - categories:list:{lang}
 * - brands:list:{lang}
 */

import { unstable_cache } from "next/cache";

// Cache TTL (time to live) in seconds
export const CacheTTL = {
  /** 30 minutes for Promocodes */
  PROMOCODE: 1800,
  /** 1 day for semi-static metadata like Stores, Categories, Brands */
  OTHER: 86400,
} as const;

/**
 * Generate cache key from parameters
 */
function generateCacheKey(
  prefix: string,
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}:${value}`)
    .join(":");
  return parts ? `${cachePrefix(prefix)}:${parts}` : cachePrefix(prefix);
}

/**
 * Add cache key prefix to avoid collisions
 */
function cachePrefix(key: string): string {
  return `promokod:${key}`;
}

/**
 * Cache wrapper - fetches data from Vercel Next Data Cache or runs the provided function
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = CacheTTL.OTHER
): Promise<T> {
  // Extract tag from key pattern (e.g. "promokod:promocodes:list..." -> "promocodes")
  const tag = key.split(":")[1] || "all";

  const cachedFn = unstable_cache(fn, [key], {
    revalidate: ttl,
    tags: [tag],
  });

  return cachedFn();
}

/**
 * Generate cache key for promocodes list
 */
export function promocodesCacheKey(params: {
  lang: string;
  storeId?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  search?: string | null;
  sortBy?: string | null;
  featured?: boolean | null;
  excludeFeatured?: boolean | null;
}): string {
  return generateCacheKey("promocodes:list", params);
}

/**
 * Generate cache key for stores list
 */
export function storesCacheKey(params: { lang: string; search?: string | null }): string {
  return generateCacheKey("stores:list", params);
}

/**
 * Generate cache key for categories list
 */
export function categoriesCacheKey(params: { lang: string }): string {
  return generateCacheKey("categories:list", params);
}

/**
 * Check if cache is enabled
 */
export function isCacheEnabled(): boolean {
  return true;
}
