import { usePathname, useRouter } from "@/i18n/navigation";
import { getInternalEntityHref, resolveEntityTypeFromSegment } from "@/lib/routes";
import type { EntityType } from "@/lib/routes";
import { useCallback, useState } from "react";

/**
 * Parse pathname (internal or localized segment) into entity type + slug.
 */
function parseDetailPath(pathname: string): { entityType: EntityType; slug: string } | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length !== 2) {
    return null;
  }

  const [segment, slug] = segments;
  const entityType = resolveEntityTypeFromSegment(segment);

  if (!entityType || !slug) {
    return null;
  }

  return { entityType, slug };
}

/**
 * Custom hook for handling locale switching with correct slugs for detail pages
 * On detail pages (promocode, store, brand, category), it fetches the correct slug
 * for the target language before navigating.
 */
export function useLocaleSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchLocale = useCallback(
    async (targetLocale: string, currentLocale: string) => {
      setIsLoading(true);
      setError(null);

      // Same locale - no action needed
      if (targetLocale === currentLocale) {
        setIsLoading(false);
        return;
      }

      // Check if current path is a detail page
      const detailInfo = parseDetailPath(pathname);

      if (!detailInfo) {
        // Not a detail page - use standard navigation
        router.replace(pathname, { locale: targetLocale });
        setIsLoading(false);
        return;
      }

      // Detail page - fetch correct slug for target language
      try {
        const { entityType, slug } = detailInfo;

        const params = new URLSearchParams({
          entityType,
          currentSlug: slug,
          currentLanguage: currentLocale,
          targetLanguage: targetLocale,
        });

        const response = await fetch(`/api/translations/slug?${params.toString()}`);

        if (!response.ok) {
          if (response.status === 404) {
            // Entity not found - redirect to home
            router.replace("/", { locale: targetLocale });
            return;
          }
          throw new Error("Failed to fetch translation");
        }

        const data = await response.json();

        if (data.slug) {
          const newPathname = getInternalEntityHref(entityType, data.slug);
          router.replace(newPathname, { locale: targetLocale });
        } else {
          // No translation in target language - redirect to home
          router.replace("/", { locale: targetLocale });
        }
      } catch (err) {
        console.error("Error switching locale:", err);
        setError("Failed to switch language");
        // Fallback to standard navigation on error
        router.replace(pathname, { locale: targetLocale });
      } finally {
        setIsLoading(false);
      }
    },
    [pathname, router]
  );

  return { switchLocale, isLoading, error };
}
