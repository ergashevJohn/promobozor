/**
 * Shared helpers for slug migration scripts (localized paths + redirects).
 */
import type { EntityType, Locale } from "../../lib/routes";
import { getEntityPath, getLegacyEntityPath } from "../../lib/routes";

export type RedirectCandidate = {
  fromPath: string;
  toPath: string;
};

/**
 * Build redirect set covering:
 * 1) legacy English path + old slug → localized path + new slug
 * 2) localized path + old slug → localized path + new slug (if segments already localized)
 * 3) legacy English path + new slug → localized path + new slug (path-only for already-migrated slugs)
 */
export function buildEntityRedirects(options: {
  entityType: EntityType;
  locale: Locale;
  oldSlugs: string[];
  newSlug: string;
}): RedirectCandidate[] {
  const { entityType, locale, oldSlugs, newSlug } = options;
  const target = getEntityPath(locale, entityType, newSlug);
  const results: RedirectCandidate[] = [];
  const seen = new Set<string>();

  const push = (fromPath: string, toPath: string) => {
    if (fromPath === toPath) return;
    if (seen.has(fromPath)) return;
    seen.add(fromPath);
    results.push({ fromPath, toPath });
  };

  for (const oldSlug of oldSlugs) {
    push(getLegacyEntityPath(locale, entityType, oldSlug), target);
    push(getEntityPath(locale, entityType, oldSlug), target);
  }

  // Path-only: new slug still served under legacy English segment
  push(getLegacyEntityPath(locale, entityType, newSlug), target);

  return results;
}
