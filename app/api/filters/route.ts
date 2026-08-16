import { getFiltersData } from "@/lib/filters";
import { isValidLanguage } from "@/lib/i18n";
import { checkRateLimit, RateLimits } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, RateLimits.api);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const lang = request.nextUrl.searchParams.get("lang") || "uz";
    if (!isValidLanguage(lang)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    const data = await getFiltersData(lang);
    return NextResponse.json(
      {
        stores: data.storesList,
        categories: data.categoriesList,
        brands: data.brandsList,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
