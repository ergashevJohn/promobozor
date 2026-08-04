import { NextRequest, NextResponse } from "next/server";
import { db, contacts } from "@/lib/db";
import { checkRateLimit, RateLimits } from "@/lib/rate-limit";
import { csrfProtection } from "@/lib/csrf";
import { verifyRecaptcha } from "@/lib/recaptcha";

// Force dynamic rendering for API routes
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// O'zbekiston telefon raqam validatsiyasi
function validateUzbekPhone(phone: string): boolean {
  // Faqat raqamlarni olib tashlash
  const cleaned = phone.replace(/\D/g, "");

  // O'zbekiston telefon raqam formatlari:
  // +998XXXXXXXXX (13 ta raqam)
  // 998XXXXXXXXX (12 ta raqam)
  // 90XXXXXXX (9 ta raqam - mobil)
  // 33XXXXXXX (9 ta raqam - mobil)
  // 88XXXXXXX (9 ta raqam - mobil)
  // 93XXXXXXX (9 ta raqam - mobil)
  // 94XXXXXXX (9 ta raqam - mobil)
  // 95XXXXXXX (9 ta raqam - mobil)
  // 97XXXXXXX (9 ta raqam - mobil)
  // 99XXXXXXX (9 ta raqam - mobil)

  if (cleaned.length === 13 && cleaned.startsWith("998")) {
    // +998XXXXXXXXX format
    const mobileCode = cleaned.substring(3, 5);
    const validMobileCodes = ["90", "91", "93", "94", "95", "97", "99", "88", "33"];
    return validMobileCodes.includes(mobileCode);
  }

  if (cleaned.length === 12 && cleaned.startsWith("998")) {
    // 998XXXXXXXXX format
    const mobileCode = cleaned.substring(3, 5);
    const validMobileCodes = ["90", "91", "93", "94", "95", "97", "99", "88", "33"];
    return validMobileCodes.includes(mobileCode);
  }

  if (cleaned.length === 9) {
    // 90XXXXXXX format (faqat raqamlar)
    const mobileCode = cleaned.substring(0, 2);
    const validMobileCodes = ["90", "91", "93", "94", "95", "97", "99", "88", "33"];
    return validMobileCodes.includes(mobileCode);
  }

  return false;
}

// Telefon raqamni tozalash va standartlashtirish
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 9) {
    // 90XXXXXXX -> +99890XXXXXXX
    return `+998${cleaned}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith("998")) {
    // 998XXXXXXXXX -> +998XXXXXXXXX
    return `+${cleaned}`;
  }

  if (cleaned.length === 13 && cleaned.startsWith("998")) {
    // 998XXXXXXXXX (agar + bo'lmasa)
    return `+${cleaned}`;
  }

  // Agar allaqachon +998 bilan boshlansa
  if (phone.startsWith("+998")) {
    return phone;
  }

  return `+998${cleaned}`;
}

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
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

    // Rate limiting: 3 requests per hour
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

    const body = await request.json();
    const { name, phone, message, recaptchaToken, startedAt } = body;

    // Validatsiya
    if (!name || !phone || !message) {
      return NextResponse.json({ error: "Name, phone, and message are required" }, { status: 400 });
    }

    // Reject obvious bot submissions that complete unrealistically fast.
    if (typeof startedAt === "number" && Date.now() - startedAt < 2500) {
      return NextResponse.json({ error: "Submission failed bot protection." }, { status: 400 });
    }

    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
    if (!isValidRecaptcha) {
      return NextResponse.json({ error: "Captcha verification failed." }, { status: 400 });
    }

    // Telefon raqam validatsiyasi
    if (!validateUzbekPhone(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Please use Uzbek phone number format." },
        { status: 400 }
      );
    }

    // Telefon raqamni normalizatsiya qilish
    const normalizedPhone = normalizePhone(phone);

    // IP va User Agent olish
    const ipAddress =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Database'ga saqlash
    const [contact] = await db
      .insert(contacts)
      .values({
        name: name.trim(),
        phone: normalizedPhone,
        message: message.trim(),
        ipAddress,
        userAgent,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Contact form submitted successfully",
        id: contact.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting contact form:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to submit contact form", details: errorMessage },
      { status: 500 }
    );
  }
}
