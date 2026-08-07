import { generateCsrfToken } from "@/lib/csrf";
import { enforceRateLimit, RateLimits } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/csrf
 * Returns a short-lived signed CSRF token for mutating public forms.
 */
export async function GET(request: NextRequest) {
  try {
    const limited = await enforceRateLimit(request, RateLimits.csrf);
    if (limited) return limited;

    const token = generateCsrfToken();
    return NextResponse.json(
      { token },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("CSRF token generation failed:", error);
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 });
  }
}
