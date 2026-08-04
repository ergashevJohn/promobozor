import { NextRequest, NextResponse } from "next/server";

/**
 * Performance analytics endpoint
 * Receives performance metrics from the client and sends to monitoring service
 *
 * POST /api/analytics/performance
 */
export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // Validate required fields
    if (!metric.name || typeof metric.duration !== "number") {
      return NextResponse.json({ error: "Invalid metric" }, { status: 400 });
    }

    // Send to your monitoring service here
    // Examples: Vercel Analytics, Datadog, New Relic, etc.

    // Store for analysis (optional - implement your own storage)
    // await db.insert(performanceMetrics).values(metric);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
