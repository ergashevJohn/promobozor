import { NextRequest, NextResponse } from "next/server";
import { db, categories, categoryTranslations } from "@/lib/db";
import { isValidLanguage } from "@/lib/i18n";
import { CacheTTL, isCacheEnabled, categoriesCacheKey, withCache } from "@/lib/cache";
import { checkRateLimit, RateLimits } from "@/lib/rate-limit";
import { eq, and } from "drizzle-orm";

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

    if (!isValidLanguage(lang)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    // Cache key
    const cacheKey = categoriesCacheKey({ lang });

    // Fetch function
    const fetchCategories = async () => {
      const categoriesData = await db
        .select({
          category: categories,
          translation: categoryTranslations,
        })
        .from(categories)
        .leftJoin(
          categoryTranslations,
          and(
            eq(categoryTranslations.categoryId, categories.id),
            eq(categoryTranslations.language, lang as "uz" | "ru" | "en")
          )
        )
        .where(eq(categories.isActive, true));

      // Transform the data
      return categoriesData.map((row) => ({
        ...row.category,
        translations: row.translation ? [row.translation] : [],
      }));
    };

    // Use cache
    if (isCacheEnabled()) {
      const result = await withCache(cacheKey, fetchCategories, CacheTTL.OTHER);
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
          "X-Cache": "HIT",
        },
      });
    }

    // Direct fetch when cache is disabled
    const result = await fetchCategories();
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-Cache": "MISS",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
