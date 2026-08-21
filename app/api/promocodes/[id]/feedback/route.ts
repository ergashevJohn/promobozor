import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db, promocodeFeedback, promocodes } from "@/lib/db";
import { csrfProtection } from "@/lib/csrf";
import { activePromocodeStatusConditions } from "@/lib/promocode-active";
import {
  checkRateLimitKey,
  getHashedRateLimitIdentifier,
  RateLimits,
  type RateLimitResult,
} from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { validateId } from "@/lib/validators";
import { and, eq, sql } from "drizzle-orm";

const FAILURE_REASONS = [
  "invalid_or_expired",
  "new_customer_only",
  "min_order_or_product",
  "region_app_or_payment",
  "other",
] as const;
const SOURCES = ["card", "detail"] as const;

type FeedbackInput = {
  result: "worked" | "failed";
  failureReason: (typeof FAILURE_REASONS)[number] | null;
  source: (typeof SOURCES)[number];
};

function parseFeedbackBody(value: unknown): FeedbackInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { result, failureReason, source } = value as Record<string, unknown>;
  if (
    (result !== "worked" && result !== "failed") ||
    !SOURCES.includes(source as "card" | "detail")
  ) {
    return null;
  }
  if (result === "worked" && (failureReason === null || failureReason === undefined)) {
    return { result, failureReason: null, source: source as FeedbackInput["source"] };
  }
  if (
    result === "failed" &&
    FAILURE_REASONS.includes(failureReason as (typeof FAILURE_REASONS)[number])
  ) {
    return {
      result,
      failureReason: failureReason as Exclude<FeedbackInput["failureReason"], null>,
      source: source as FeedbackInput["source"],
    };
  }
  return null;
}

function recaptchaTokenFromBody(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const token = (value as Record<string, unknown>).recaptchaToken;
  return typeof token === "string" ? token : null;
}

function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: "Feedback limit reached. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000))),
      },
    }
  );
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validateId(id)) {
    return NextResponse.json({ error: "Invalid promocode id" }, { status: 400 });
  }

  const csrf = await csrfProtection(request);
  if (!csrf.success) {
    return NextResponse.json({ error: csrf.error }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const feedback = parseFeedbackBody(body);
  if (!feedback) {
    return NextResponse.json({ error: "Invalid feedback body" }, { status: 400 });
  }

  if (!(await verifyRecaptcha(recaptchaTokenFromBody(body)))) {
    return NextResponse.json({ error: "Captcha verification failed." }, { status: 400 });
  }

  const now = new Date();
  const active = await db
    .select({ id: promocodes.id })
    .from(promocodes)
    .where(and(eq(promocodes.id, id), activePromocodeStatusConditions(now)))
    .limit(1);
  if (active.length === 0) {
    return NextResponse.json({ error: "Promocode is inactive or expired" }, { status: 409 });
  }

  const identifier = getHashedRateLimitIdentifier(request);
  const burst = await checkRateLimitKey(identifier, RateLimits.feedbackBurst);
  if (!burst.success) return rateLimitResponse(burst);
  const daily = await checkRateLimitKey(identifier, RateLimits.feedbackDaily);
  if (!daily.success) return rateLimitResponse(daily);
  const dedup = await checkRateLimitKey(`${identifier}:${id}`, RateLimits.feedbackDedup);
  if (!dedup.success) return rateLimitResponse(dedup);

  try {
    const saved = await db.transaction(async (tx) => {
      const stillActive = await tx
        .select({ id: promocodes.id })
        .from(promocodes)
        .where(and(eq(promocodes.id, id), activePromocodeStatusConditions(new Date())))
        .limit(1);
      if (stillActive.length === 0) return null;

      await tx.insert(promocodeFeedback).values({
        promocodeId: id,
        result: feedback.result,
        failureReason: feedback.failureReason,
        source: feedback.source,
      });

      const updated = await tx
        .update(promocodes)
        .set({
          ...(feedback.result === "worked"
            ? { workedCount: sql`${promocodes.workedCount} + 1` }
            : { failedCount: sql`${promocodes.failedCount} + 1` }),
          needsReview: sql`${promocodes.needsReview} OR (((${promocodes.workedCount} + ${promocodes.failedCount} + 1) >= 3)
            AND ((${promocodes.failedCount} + ${feedback.result === "failed" ? 1 : 0})::numeric /
              (${promocodes.workedCount} + ${promocodes.failedCount} + 1)) >= 0.4)`,
        })
        .where(eq(promocodes.id, id))
        .returning({ needsReview: promocodes.needsReview });
      return updated[0] ?? null;
    });

    if (!saved) {
      return NextResponse.json({ error: "Promocode is inactive or expired" }, { status: 409 });
    }

    revalidateTag("promocodes", {});
    return NextResponse.json({ success: true, needsReview: saved.needsReview }, { status: 201 });
  } catch (error) {
    console.error("Unable to save promocode feedback", error);
    return NextResponse.json({ error: "Unable to save feedback" }, { status: 500 });
  }
}
