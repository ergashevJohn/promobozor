import { NextRequest, NextResponse } from "next/server";
import { db, contacts } from "@/lib/db";
import { checkRateLimit, RateLimits } from "@/lib/rate-limit";
import { csrfProtection } from "@/lib/csrf";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_PHONE_LENGTH = 30;

// O'zbekiston telefon raqam validatsiyasi
function validateUzbekPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 13 && cleaned.startsWith("998")) {
    const mobileCode = cleaned.substring(3, 5);
    const validMobileCodes = ["90", "91", "93", "94", "95", "97", "99", "88", "33"];
    return validMobileCodes.includes(mobileCode);
  }

  if (cleaned.length === 12 && cleaned.startsWith("998")) {
    const mobileCode = cleaned.substring(3, 5);
    const validMobileCodes = ["90", "91", "93", "94", "95", "97", "99", "88", "33"];
    return validMobileCodes.includes(mobileCode);
  }

  if (cleaned.length === 9) {
    const mobileCode = cleaned.substring(0, 2);
    const validMobileCodes = ["90", "91", "93", "94", "95", "97", "99", "88", "33"];
    return validMobileCodes.includes(mobileCode);
  }

  return false;
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 9) {
    return `+998${cleaned}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith("998")) {
    return `+${cleaned}`;
  }

  if (cleaned.length === 13 && cleaned.startsWith("998")) {
    return `+${cleaned}`;
  }

  if (phone.startsWith("+998")) {
    return phone;
  }

  return `+998${cleaned}`;
}

function parseContactBody(body: unknown): {
  name: string;
  phone: string;
  message: string;
  recaptchaToken: unknown;
  startedAt: unknown;
} | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const { name, phone, message, recaptchaToken, startedAt } = record;

  if (typeof name !== "string" || typeof phone !== "string" || typeof message !== "string") {
    return null;
  }

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const trimmedMessage = message.trim();

  if (
    !trimmedName ||
    !trimmedPhone ||
    !trimmedMessage ||
    trimmedName.length > MAX_NAME_LENGTH ||
    trimmedPhone.length > MAX_PHONE_LENGTH ||
    trimmedMessage.length > MAX_MESSAGE_LENGTH
  ) {
    return null;
  }

  return {
    name: trimmedName,
    phone: trimmedPhone,
    message: trimmedMessage,
    recaptchaToken,
    startedAt,
  };
}

export async function POST(request: NextRequest) {
  try {
    const csrfResult = await csrfProtection(request);
    if (!csrfResult.success) {
      return NextResponse.json(
        { error: csrfResult.error },
        {
          status: 403,
          headers: {
            "X-CSRF-Error": "Invalid CSRF token",
          },
        }
      );
    }

    const rateLimitResult = await checkRateLimit(request, RateLimits.contact);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many contact form submissions. Please try again later.",
          retryAfter: new Date(rateLimitResult.resetTime).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
            "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = parseContactBody(rawBody);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Name, phone, and message are required and must be within length limits (name ≤ 100, message ≤ 2000).",
        },
        { status: 400 }
      );
    }

    const { name, phone, message, recaptchaToken, startedAt } = parsed;

    // Reject obvious bot submissions that complete unrealistically fast.
    if (typeof startedAt === "number" && Date.now() - startedAt < 2500) {
      return NextResponse.json({ error: "Submission failed bot protection." }, { status: 400 });
    }

    const isValidRecaptcha = await verifyRecaptcha(
      typeof recaptchaToken === "string" ? recaptchaToken : null
    );
    if (!isValidRecaptcha) {
      return NextResponse.json({ error: "Captcha verification failed." }, { status: 400 });
    }

    if (!validateUzbekPhone(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Please use Uzbek phone number format." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    const ipAddress =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = (request.headers.get("user-agent") || "unknown").slice(0, 500);

    await db.insert(contacts).values({
      name,
      phone: normalizedPhone,
      message,
      ipAddress: ipAddress.slice(0, 50),
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Contact form submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return NextResponse.json({ error: "Failed to submit contact form" }, { status: 500 });
  }
}
