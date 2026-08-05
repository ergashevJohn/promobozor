import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db, promocodes, activityLogs } from "@/lib/db";
import { and, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { extractIpAddress } from "@/lib/validation";
import { randomUUID } from "node:crypto";
import { enforceRateLimit, RateLimits } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = await enforceRateLimit(request, RateLimits.publicAction);
    if (limited) return limited;

    const { id } = await params;
    const now = new Date();
    const ipAddress = extractIpAddress(request);
    const userAgent = request.headers.get("user-agent") || null;

    const updated = await db.transaction(async (tx) => {
      const updatedPromocodes = await tx
        .update(promocodes)
        .set({
          copyCount: sql`copy_count + 1`,
        })
        .where(
          and(
            eq(promocodes.id, id),
            eq(promocodes.status, "active"),
            or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
            or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now))
          )
        )
        .returning({ id: promocodes.id });

      if (updatedPromocodes.length === 0) {
        return null;
      }

      await tx.insert(activityLogs).values({
        id: randomUUID(),
        promocodeId: id,
        activityType: "copy",
        ipAddress,
        userAgent,
      });

      return updatedPromocodes[0];
    });

    if (!updated) {
      return NextResponse.json({ error: "Promocode is inactive or expired" }, { status: 409 });
    }

    revalidateTag("promocodes", {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to increment copy count" }, { status: 500 });
  }
}
