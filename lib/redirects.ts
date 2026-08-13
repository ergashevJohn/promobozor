/**
 * SEO Redirects and 410 Gone Handling
 */

import { db, redirects } from "@/lib/db";
import { and, eq } from "drizzle-orm";

const MAX_REDIRECT_HOPS = 5;
const REDIRECT_CACHE_TTL_MS = 60_000;

type RedirectLookup = (fromPath: string) => Promise<string | null>;

type RedirectCacheEntry = {
  value: string | null;
  expiresAt: number;
};

const redirectPathCache = new Map<string, RedirectCacheEntry>();

function getCachedRedirect(fullPath: string): string | null | undefined {
  const hit = redirectPathCache.get(fullPath);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    redirectPathCache.delete(fullPath);
    return undefined;
  }
  return hit.value;
}

function setCachedRedirect(fullPath: string, value: string | null) {
  redirectPathCache.set(fullPath, {
    value,
    expiresAt: Date.now() + REDIRECT_CACHE_TTL_MS,
  });
}

/**
 * Resolve redirect chains to a single final target.
 * Returns null when no redirect exists or when an invalid/looping chain is detected.
 */
export async function resolveRedirectChain(
  startPath: string,
  lookup: RedirectLookup,
  maxHops: number = MAX_REDIRECT_HOPS
): Promise<string | null> {
  const normalizedStart = startPath.trim();
  if (!normalizedStart) {
    return null;
  }

  let currentPath = normalizedStart;
  let hasRedirect = false;
  const visitedPaths = new Set<string>([normalizedStart]);

  for (let hop = 0; hop < maxHops; hop += 1) {
    const nextPath = await lookup(currentPath);
    if (!nextPath) {
      return hasRedirect ? currentPath : null;
    }

    const normalizedNextPath = nextPath.trim();
    if (!normalizedNextPath || normalizedNextPath === currentPath) {
      return null;
    }

    if (visitedPaths.has(normalizedNextPath)) {
      return null;
    }

    visitedPaths.add(normalizedNextPath);
    currentPath = normalizedNextPath;
    hasRedirect = true;
  }

  // Chain exceeded maxHops. If another redirect exists, treat as invalid.
  const overflowPath = await lookup(currentPath);
  if (overflowPath && overflowPath.trim() && overflowPath.trim() !== currentPath) {
    return null;
  }

  return hasRedirect ? currentPath : null;
}

/**
 * Check database for redirects (for old slugs after slug unification)
 * @param fullPath - Full path including locale, e.g., "/en/brand/uzum-bank-en"
 * @returns The path to redirect to, or null if no redirect found
 */
export async function getRedirectPath(fullPath: string): Promise<string | null> {
  const cached = getCachedRedirect(fullPath);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const resolved = await resolveRedirectChain(fullPath, async (fromPath) => {
      const [redirect] = await db
        .select({ toPath: redirects.toPath })
        .from(redirects)
        .where(and(eq(redirects.fromPath, fromPath), eq(redirects.isActive, true)))
        .limit(1);

      return redirect?.toPath || null;
    });
    setCachedRedirect(fullPath, resolved);
    return resolved;
  } catch {
    setCachedRedirect(fullPath, null);
    return null;
  }
}

/**
 * List of slugs that are permanently removed (410 Gone)
 * Format: "type:slug" or Just "slug"
 */
export const GONE_SLUGS = new Set<string>([
  // Example: "promo:old-expired-promocode",
]);

function getGoneTypeAliases(type: string): string[] {
  const normalizedType = type.trim().toLowerCase();

  // Keep backwards compatibility between legacy "promo" and current "promocode",
  // plus localized URL segments (chegirma, promokod, deal, do-kon, …).
  if (
    normalizedType === "promo" ||
    normalizedType === "promocode" ||
    normalizedType === "chegirma" ||
    normalizedType === "promokod" ||
    normalizedType === "deal"
  ) {
    return ["promo", "promocode", "chegirma", "promokod", "deal"];
  }

  if (
    normalizedType === "store" ||
    normalizedType === "do-kon" ||
    normalizedType === "dokon" ||
    normalizedType === "magazin"
  ) {
    return ["store", "do-kon", "dokon", "magazin"];
  }

  if (normalizedType === "category" || normalizedType === "kategoriya") {
    return ["category", "kategoriya"];
  }

  if (normalizedType === "brand" || normalizedType === "brend") {
    return ["brand", "brend"];
  }

  return [normalizedType];
}

/**
 * Check if a slug is permanently gone
 */
export function isGone(type: string, slug: string): boolean {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return false;
  }

  for (const alias of getGoneTypeAliases(type)) {
    if (GONE_SLUGS.has(`${alias}:${normalizedSlug}`)) {
      return true;
    }
  }

  return GONE_SLUGS.has(normalizedSlug);
}
