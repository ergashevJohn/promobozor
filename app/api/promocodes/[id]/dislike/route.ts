import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db, promocodes, activityLogs } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { extractIpAddress } from "@/lib/validation";
import { randomUUID } from "node:crypto";
import { enforceRateLimit, RateLimits } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = await enforceRateLimit(request, RateLimits.publicAction);
    if (limited) return limited;

    const { id } = await params;
    const ipAddress = extractIpAddress(request);
    const userAgent = request.headers.get("user-agent") || null;

    await db.transaction(async (tx) => {
      await tx
        .update(promocodes)
        .set({
          dislikesCount: sql`dislikes_count + 1`,
        })
        .where(eq(promocodes.id, id));

      await tx.insert(activityLogs).values({
        id: randomUUID(),
        promocodeId: id,
        activityType: "dislike",
        ipAddress,
        userAgent,
      });
    });

    revalidateTag("promocodes", {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to increment dislikes" }, { status: 500 });
  }
}
