import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, RateLimits } from "@/lib/rate-limit";

/**
 * Performance analytics endpoint
 * Receives performance metrics from the client and sends to monitoring service
 *
 * POST /api/analytics/performance
 */

const MAX_NAME_LENGTH = 100;
const MAX_BODY_KEYS = 20;
const ALLOWED_METRIC_NAMES = new Set([
  "TTFB",
  "FCP",
  "LCP",
  "FID",
  "INP",
  "CLS",
  "navigation",
  "resource",
  "paint",
  "custom",
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    // Same-origin / non-browser clients often omit Origin
    return true;
  }

  const allowed = new Set<string>();

  try {
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      allowed.add(new URL(process.env.NEXT_PUBLIC_BASE_URL).origin);
    }
  } catch {
    // ignore invalid base URL
  }

  if (process.env.VERCEL_URL) {
    allowed.add(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }

  return allowed.has(origin);
}

function corsHeaders(origin: string | null): HeadersInit {
  if (!origin || !isAllowedOrigin(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function isValidMetric(body: unknown): body is { name: string; duration: number } {
  if (!body || typeof body !== "object") {
    return false;
  }

  const record = body as Record<string, unknown>;
  if (Object.keys(record).length > MAX_BODY_KEYS) {
    return false;
  }

  const { name, duration } = record;
  if (typeof name !== "string" || name.length === 0 || name.length > MAX_NAME_LENGTH) {
    return false;
  }

  if (
    typeof duration !== "number" ||
    !Number.isFinite(duration) ||
    duration < 0 ||
    duration > 600_000
  ) {
    return false;
  }

  // Allow known names or prefixed custom metrics
  if (!ALLOWED_METRIC_NAMES.has(name) && !name.startsWith("custom:")) {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (!isAllowedOrigin(origin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limited = await enforceRateLimit(request, RateLimits.analytics);
    if (limited) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            ...corsHeaders(origin),
            "X-RateLimit-Limit": limited.headers.get("X-RateLimit-Limit") || "",
            "X-RateLimit-Remaining": limited.headers.get("X-RateLimit-Remaining") || "",
            "X-RateLimit-Reset": limited.headers.get("X-RateLimit-Reset") || "",
            "Retry-After": limited.headers.get("Retry-After") || "",
          },
        }
      );
    }

    let metric: unknown;
    try {
      metric = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (!isValidMetric(metric)) {
      return NextResponse.json(
        { error: "Invalid metric" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Send to your monitoring service here
    // Examples: Vercel Analytics, Datadog, New Relic, etc.

    return NextResponse.json({ success: true }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * OPTIONS handler for CORS (restricted origins only)
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin) || !origin) {
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
