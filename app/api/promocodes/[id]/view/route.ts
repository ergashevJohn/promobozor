import { NextRequest, NextResponse } from "next/server";
import { db, promocodes, activityLogs } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { extractIpAddress } from "@/lib/validation";
import { randomUUID } from "node:crypto";
import {
  checkRateLimitKey,
  enforceRateLimit,
  RateLimits,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = await enforceRateLimit(request, RateLimits.publicView);
    if (limited) return limited;

    const { id } = await params;
    const ipAddress = extractIpAddress(request);
    const userAgent = request.headers.get("user-agent") || null;

    // Dedup: one counted view per IP + promocode within window
    const dedup = await checkRateLimitKey(
      `view:${ipAddress}:${id}`,
      RateLimits.viewDedup
    );
    if (!dedup.success) {
      return NextResponse.json({ success: true, deduped: true });
    }

    await db.transaction(async (tx) => {
      await tx
        .update(promocodes)
        .set({
          viewsCount: sql`views_count + 1`,
        })
        .where(eq(promocodes.id, id));

      await tx.insert(activityLogs).values({
        id: randomUUID(),
        promocodeId: id,
        activityType: "view",
        ipAddress,
        userAgent,
      });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to increment views" }, { status: 500 });
  }
}
