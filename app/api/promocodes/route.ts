import {
  brands,
  brandTranslations,
  db,
  promocodes,
  promocodeTranslations,
  stores,
  storeTranslations,
} from "@/lib/db";
import { fullTextSearchCondition, toTsQuery } from "@/lib/full-text-search";
import { isValidLanguage } from "@/lib/i18n";
import {
  mapPromocodeListRow,
  promocodeListSelect,
  type PromocodeListRow,
} from "@/lib/queries/promocode-list";
import { checkRateLimit, RateLimits } from "@/lib/rate-limit";
import { sanitizeSearchQuery } from "@/lib/search";
import { CacheTTL, isCacheEnabled, promocodesCacheKey, withCache } from "@/lib/cache";
import { and, asc, desc, eq, gt, ilike, isNull, lte, or, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for API routes (Next.js 15+)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const searchQuery = searchParams.get("search");

    // Apply rate limiting — stricter for search, baseline for list
    const rateLimitResult = await checkRateLimit(
      request,
      searchQuery ? RateLimits.search : RateLimits.api
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many search requests. Please try again later." },
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

    const lang = searchParams.get("lang") || "uz";
    const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Number.isNaN(rawLimit) || rawLimit <= 0 ? 20 : Math.min(rawLimit, 100);
    const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
    const offset = Number.isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;
    const storeId = searchParams.get("storeId");
    const categoryId = searchParams.get("categoryId");
    const brandId = searchParams.get("brandId");
    const featured = searchParams.get("featured") === "true";
    const excludeFeatured = searchParams.get("excludeFeatured") === "true";
    const sortBy = searchParams.get("sortBy") || "newest";

    // Validate language
    if (!isValidLanguage(lang)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    // Sanitize search query
    const sanitizedSearchQuery = sanitizeSearchQuery(searchQuery);

    if (searchQuery && searchQuery.trim().length > 0 && !sanitizedSearchQuery) {
      return NextResponse.json(
        { error: "Invalid search query. Please use letters, numbers, and basic punctuation only." },
        { status: 400 }
      );
    }

    // Only cache non-search queries (search results are too dynamic)
    const shouldCache = !searchQuery && !sanitizedSearchQuery && offset === 0;

    // Cache key for this query
    const cacheKey = promocodesCacheKey({
      lang,
      storeId,
      categoryId,
      brandId,
      featured,
      excludeFeatured,
      sortBy,
    });

    // Fetch function (will be cached)
    const fetchPromocodes = async (): Promise<{
      promocodes: unknown[];
      hasMore: boolean;
      total: number;
    }> => {
      const now = new Date();

      // Build where conditions
      const whereConditions = [
        eq(promocodes.status, "active"),
        or(isNull(promocodes.storeId), eq(stores.isActive, true)),
        or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now)),
        or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
      ];

      if (storeId) {
        whereConditions.push(eq(promocodes.storeId, storeId));
      }

      if (categoryId) {
        whereConditions.push(eq(promocodes.categoryId, categoryId));
      }

      if (brandId) {
        whereConditions.push(eq(promocodes.brandId, brandId));
      }

      if (featured) {
        whereConditions.push(eq(promocodes.isFeatured, true));
      } else if (excludeFeatured) {
        whereConditions.push(eq(promocodes.isFeatured, false));
      }

      // Use full-text search for better results
      if (sanitizedSearchQuery) {
        const tsQuery = toTsQuery(sanitizedSearchQuery);

        if (tsQuery && sanitizedSearchQuery.length >= 2) {
          const ftsCondition = fullTextSearchCondition(
            sanitizedSearchQuery,
            "promocode_translations"
          );

          if (ftsCondition) {
            whereConditions.push(
              or(ftsCondition, ilike(promocodes.code, `%${sanitizedSearchQuery}%`))
            );
          } else {
            whereConditions.push(
              or(
                ilike(promocodeTranslations.title, `%${sanitizedSearchQuery}%`),
                ilike(promocodes.code, `%${sanitizedSearchQuery}%`)
              )
            );
          }
        } else {
          whereConditions.push(
            or(
              ilike(promocodeTranslations.title, `${sanitizedSearchQuery}%`),
              ilike(promocodes.code, `${sanitizedSearchQuery}%`)
            )
          );
        }
      }

      // Determine sort order
      const orderByClause = (() => {
        switch (sortBy) {
          case "popular":
            return [desc(promocodes.isFeatured), desc(promocodes.copyCount), asc(promocodes.order)];
          case "ending":
            return [desc(promocodes.isFeatured), asc(promocodes.expiresAt), asc(promocodes.order)];
          case "discount":
            return [
              desc(promocodes.isFeatured),
              desc(promocodes.discountValue),
              asc(promocodes.order),
            ];
          case "newest":
          default:
            return [desc(promocodes.isFeatured), asc(promocodes.order)];
        }
      })();

      // Fetch total count
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)::int`.as("count") })
        .from(promocodes)
        .leftJoin(stores, eq(promocodes.storeId, stores.id))
        .leftJoin(brands, eq(promocodes.brandId, brands.id))
        .leftJoin(
          promocodeTranslations,
          and(
            eq(promocodeTranslations.promocodeId, promocodes.id),
            eq(promocodeTranslations.language, lang as "uz" | "ru" | "en")
          )
        )
        .where(and(...whereConditions));

      const totalCount = countResult[0]?.count || 0;

      // Fetch promocodes with translations
      const promocodesData = (await db
        .select(promocodeListSelect)
        .from(promocodes)
        .leftJoin(stores, eq(promocodes.storeId, stores.id))
        .leftJoin(brands, eq(promocodes.brandId, brands.id))
        .leftJoin(
          promocodeTranslations,
          and(
            eq(promocodeTranslations.promocodeId, promocodes.id),
            eq(promocodeTranslations.language, lang as "uz" | "ru" | "en")
          )
        )
        .leftJoin(
          storeTranslations,
          and(
            eq(storeTranslations.storeId, stores.id),
            eq(storeTranslations.language, lang as "uz" | "ru" | "en")
          )
        )
        .leftJoin(
          brandTranslations,
          and(
            eq(brandTranslations.brandId, brands.id),
            eq(brandTranslations.language, lang as "uz" | "ru" | "en")
          )
        )
        .where(and(...whereConditions))
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(offset)) as PromocodeListRow[];

      // Transform data
      const promocodesList = promocodesData.map((row) =>
        mapPromocodeListRow(row, { includeStartsAt: false, includeConditions: false })
      );
      const hasMore = offset + promocodesList.length < totalCount;

      return {
        promocodes: promocodesList,
        hasMore,
        total: totalCount,
      };
    };

    // Use cache for non-search queries
    if (shouldCache && isCacheEnabled()) {
      const result = await withCache(cacheKey, fetchPromocodes, CacheTTL.PROMOCODE);
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600",
          "X-Cache": "HIT",
        },
      });
    }

    // Direct fetch for search or when cache is disabled
    const result = await fetchPromocodes();
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        "X-Cache": "MISS",
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching promocodes:", error);
    return NextResponse.json({ error: "Failed to fetch promocodes" }, { status: 500 });
  }
}
