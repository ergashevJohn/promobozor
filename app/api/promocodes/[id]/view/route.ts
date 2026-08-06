import { NextRequest, NextResponse } from "next/server";
import { db, promocodes, activityLogs } from "@/lib/db";
import { and, eq, sql } from "drizzle-orm";
import { extractIpAddress } from "@/lib/validation";
import { randomUUID } from "node:crypto";
import { checkRateLimitKey, enforceRateLimit, RateLimits } from "@/lib/rate-limit";
import { activePromocodeStatusConditions } from "@/lib/promocode-active";
import { validateId } from "@/lib/validators";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = await enforceRateLimit(request, RateLimits.publicView);
    if (limited) return limited;

    const { id } = await params;
    if (!validateId(id)) {
      return NextResponse.json({ error: "Invalid promocode id" }, { status: 400 });
    }

    const ipAddress = extractIpAddress(request);
    const userAgent = request.headers.get("user-agent") || null;

    // Dedup: one counted view per IP + promocode within window
    const dedup = await checkRateLimitKey(
      `view:${ipAddress ?? "unknown"}:${id}`,
      RateLimits.viewDedup
    );
    if (!dedup.success) {
      return NextResponse.json({ success: true, deduped: true });
    }

    const now = new Date();
    const updated = await db.transaction(async (tx) => {
      const updatedPromocodes = await tx
        .update(promocodes)
        .set({
          viewsCount: sql`views_count + 1`,
        })
        .where(and(eq(promocodes.id, id), activePromocodeStatusConditions(now)))
        .returning({ id: promocodes.id });

      if (updatedPromocodes.length === 0) {
        return null;
      }

      await tx.insert(activityLogs).values({
        id: randomUUID(),
        promocodeId: id,
        activityType: "view",
        ipAddress,
        userAgent,
      });

      return updatedPromocodes[0];
    });

    if (!updated) {
      return NextResponse.json({ error: "Promocode is inactive or expired" }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to increment views" }, { status: 500 });
  }
}
