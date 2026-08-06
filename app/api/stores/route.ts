import { NextRequest, NextResponse } from "next/server";
import { db, stores, storeTranslations } from "@/lib/db";
import { isValidLanguage } from "@/lib/i18n";
import { CacheTTL, isCacheEnabled, storesCacheKey, withCache } from "@/lib/cache";
import { checkRateLimit, RateLimits } from "@/lib/rate-limit";
import { eq, and, desc } from "drizzle-orm";

// Force dynamic rendering for API routes (Next.js 15+)
// API routes are always dynamic and cannot be statically rendered
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Explicitly set runtime

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, RateLimits.api);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          },
        }
      );
    }

    const { searchParams } = request.nextUrl;
    const lang = searchParams.get("lang") || "uz";
    const searchQuery = searchParams.get("search");

    if (!isValidLanguage(lang)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    // Only cache stores list (not search results)
    const shouldCache = !searchQuery;

    // Cache key
    const cacheKey = storesCacheKey({ lang, search: searchQuery });

    // Fetch function
    const fetchStores = async () => {
      const storesData = await db
        .select({
          store: stores,
          translation: storeTranslations,
        })
        .from(stores)
        .leftJoin(
          storeTranslations,
          and(
            eq(storeTranslations.storeId, stores.id),
            eq(storeTranslations.language, lang as "uz" | "ru" | "en")
          )
        )
        .where(eq(stores.isActive, true))
        .orderBy(desc(stores.priority), desc(stores.createdAt));

      // Transform the data
      return storesData.map((row) => ({
        ...row.store,
        translations: row.translation ? [row.translation] : [],
      }));
    };

    // Use cache for non-search queries
    if (shouldCache && isCacheEnabled()) {
      const result = await withCache(cacheKey, fetchStores, CacheTTL.OTHER);
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
          "X-Cache": "HIT",
        },
      });
    }

    // Direct fetch for search or when cache is disabled
    const result = await fetchStores();
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-Cache": "MISS",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 });
  }
}
