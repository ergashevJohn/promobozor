import { NextRequest, NextResponse } from "next/server";
import { db, partnerInquiries } from "@/lib/db";
import { csrfProtection } from "@/lib/csrf";
import { checkRateLimitKey, getHashedRateLimitIdentifier, RateLimits } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { validateEmail, validateUrl } from "@/lib/validators";

const FORMATS = ["listing", "exclusive", "homepage", "collection", "telegram"] as const;
const TYPES = ["direct_brand", "cpa_network"] as const;

function parse(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const string = (key: string, limit: number, required = false) => {
    const item = data[key];
    if (item === undefined || item === null) return required ? null : "";
    return typeof item === "string" && item.trim().length <= limit ? item.trim() : null;
  };
  const company = string("company", 255, true),
    contactPerson = string("contactPerson", 255, true),
    workEmail = string("workEmail", 255, true),
    campaignDescription = string("campaignDescription", 4000, true);
  const phone = string("phone", 50),
    telegram = string("telegram", 100),
    website = string("website", 500),
    trackingDetails = string("trackingDetails", 2000),
    validUntil = string("validUntil", 50);
  const formats = data.requestedFormats;
  if (
    !company ||
    !contactPerson ||
    !workEmail ||
    !campaignDescription ||
    !validateEmail(workEmail) ||
    (website && !validateUrl(website)) ||
    !TYPES.includes(data.partnerType as (typeof TYPES)[number]) ||
    !Array.isArray(formats) ||
    formats.length === 0 ||
    formats.some((item) => !FORMATS.includes(item as (typeof FORMATS)[number])) ||
    data.privacyAccepted !== true
  )
    return null;
  const parsedDate = validUntil ? new Date(validUntil) : null;
  if (validUntil && (!parsedDate || Number.isNaN(parsedDate.getTime()))) return null;
  return {
    company,
    contactPerson,
    workEmail: workEmail.toLowerCase(),
    phone: phone || null,
    telegram: telegram || null,
    website: website || null,
    partnerType: data.partnerType as "direct_brand" | "cpa_network",
    requestedFormats: formats as string[],
    campaignDescription,
    validUntil: parsedDate,
    trackingDetails: trackingDetails || null,
    recaptchaToken: data.recaptchaToken,
    startedAt: data.startedAt,
    honeypot: data.websiteHoneypot,
  };
}

export async function POST(request: NextRequest) {
  const csrf = await csrfProtection(request);
  if (!csrf.success) return NextResponse.json({ error: csrf.error }, { status: 403 });
  const limit = await checkRateLimitKey(
    getHashedRateLimitIdentifier(request),
    RateLimits.partnerInquiry
  );
  if (!limit.success)
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((limit.resetTime - Date.now()) / 1000))),
        },
      }
    );
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = parse(raw);
  if (
    !body ||
    body.honeypot ||
    (typeof body.startedAt === "number" && Date.now() - body.startedAt < 2500)
  )
    return NextResponse.json({ error: "Invalid partner inquiry" }, { status: 400 });
  if (
    !(await verifyRecaptcha(typeof body.recaptchaToken === "string" ? body.recaptchaToken : null))
  )
    return NextResponse.json({ error: "Captcha verification failed." }, { status: 400 });
  try {
    await db.insert(partnerInquiries).values({ ...body, privacyAcceptedAt: new Date() });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Unable to save partner inquiry", error);
    return NextResponse.json({ error: "Unable to submit inquiry" }, { status: 500 });
  }
}
