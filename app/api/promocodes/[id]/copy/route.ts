import { NextRequest, NextResponse } from "next/server";
import { db, promocodes, activityLogs } from "@/lib/db";
import { and, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { extractIpAddress } from "@/lib/validation";
import { randomUUID } from "node:crypto";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const now = new Date();

    // Get IP and User Agent with validation
    const ipAddress = extractIpAddress(request);
    const userAgent = request.headers.get("user-agent") || null;

    const updatedPromocodes = await db
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
      return NextResponse.json({ error: "Promocode is inactive or expired" }, { status: 409 });
    }

    await db.insert(activityLogs).values({
      id: randomUUID(),
      promocodeId: id,
      activityType: "copy",
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to increment copy count" }, { status: 500 });
  }
}
