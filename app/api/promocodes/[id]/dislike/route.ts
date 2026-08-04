import { NextRequest, NextResponse } from "next/server";
import { db, promocodes, activityLogs } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { extractIpAddress } from "@/lib/validation";
import { randomUUID } from "node:crypto";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get IP and User Agent with validation
    const ipAddress = extractIpAddress(request);
    const userAgent = request.headers.get("user-agent") || null;

    // Increment counter and log activity in parallel
    await Promise.all([
      db
        .update(promocodes)
        .set({
          dislikesCount: sql`dislikes_count + 1`,
        })
        .where(eq(promocodes.id, id)),

      db.insert(activityLogs).values({
        id: randomUUID(),
        promocodeId: id,
        activityType: "dislike",
        ipAddress,
        userAgent,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to increment dislikes" }, { status: 500 });
  }
}
