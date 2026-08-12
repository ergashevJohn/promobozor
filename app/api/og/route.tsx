import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { checkRateLimit, RateLimits } from "@/lib/rate-limit";
import { fetchApprovedImageAsDataUrl } from "@/lib/safe-url-fetch";

export const runtime = "nodejs";

const OG_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

const accents: Record<string, { glow: string; badge: string }> = {
  default: {
    glow: "rgba(255, 90, 79, 0.16)",
    badge: "linear-gradient(135deg, #ff5a4f, #ff7a70)",
  },
  store: {
    glow: "rgba(17, 24, 39, 0.12)",
    badge: "linear-gradient(135deg, #111827, #1f2937)",
  },
  category: {
    glow: "rgba(245, 158, 11, 0.14)",
    badge: "linear-gradient(135deg, #f59e0b, #fbbf24)",
  },
  brand: {
    glow: "rgba(22, 163, 74, 0.14)",
    badge: "linear-gradient(135deg, #16a34a, #22c55e)",
  },
  promocode: {
    glow: "rgba(255, 90, 79, 0.2)",
    badge: "linear-gradient(135deg, #ff5a4f, #fb7185)",
  },
};

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, RateLimits.og);
    if (!rateLimitResult.success) {
      return new Response("Too many requests. Please try again later.", {
        status: 429,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      });
    }

    const { searchParams } = new URL(request.url);

    // Get parameters - truncate to bound rendering cost
    const title = (searchParams.get("title") || "PromoBozor").slice(0, 120);
    const description = (
      searchParams.get("description") || "Chegirmalar va promokodlar bozori"
    ).slice(0, 300);
    const type = (searchParams.get("type") || "default").slice(0, 32);
    const logo = searchParams.get("logo");
    const discount = searchParams.get("discount")?.slice(0, 40) ?? null;

    // Try to extract promo code from description (e.g. "NDX5231 - some description...")
    let promoCode = "";
    let cleanDescription = description;
    const codeMatch = description.match(/^([A-Z0-9]{3,15})\s*[-–—]\s*(.+)/i);
    if (codeMatch) {
      promoCode = codeMatch[1].toUpperCase();
      cleanDescription = codeMatch[2].trim();
    }

    // Truncate description
    const truncatedDesc =
      cleanDescription.length > 80 ? cleanDescription.substring(0, 77) + "..." : cleanDescription;

    const accent = accents[type] || accents.default;
    const requestOrigin = new URL(request.url).origin;

    // SSRF-safe logo fetch (ImageKit / same-origin only)
    const logoDataUrl = await fetchApprovedImageAsDataUrl(logo, requestOrigin);

    // Fetch PromoBozor brand logo as base64 (same-origin relative path)
    const brandLogoDataUrl =
      (await fetchApprovedImageAsDataUrl("/promobozor-logo.png", requestOrigin)) ||
      new URL("/promobozor-logo.png", request.url).toString();

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #fffaf9 0%, #ffffff 48%, #f8fafc 100%)",
          position: "relative",
          padding: "50px 80px",
        }}
      >
        {/* Top glow */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "50%",
            width: "700px",
            height: "300px",
            background: `radial-gradient(ellipse, ${accent.glow} 0%, transparent 70%)`,
            transform: "translateX(-50%)",
            display: "flex",
          }}
        />

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255, 90, 79, 0.72) 50%, transparent 100%)",
            display: "flex",
          }}
        />

        {/* 1. Store Logo (top center) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "140px",
            height: "140px",
            borderRadius: "28px",
            background: "rgba(255, 255, 255, 0.92)",
            border: "1px solid rgba(229, 231, 235, 0.9)",
            boxShadow: "0 12px 40px rgba(17, 24, 39, 0.16)",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoDataUrl}
              alt="Logo"
              style={{
                width: "140px",
                height: "140px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                fontSize: "70px",
                display: "flex",
              }}
            >
              🎁
            </div>
          )}
        </div>

        {/* 2. Discount badge */}
        {discount && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                background: accent.badge,
                color: "#fff",
                fontSize: "24px",
                fontWeight: 700,
                padding: "10px 36px",
                borderRadius: "50px",
                display: "flex",
                letterSpacing: "0.3px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
              }}
            >
              {discount}
            </div>
          </div>
        )}

        {/* 3. Title */}
        <div
          style={{
            fontSize: title.length > 40 ? "36px" : "44px",
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.3,
            textAlign: "center",
            marginBottom: "16px",
            letterSpacing: "-0.3px",
            display: "flex",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        {/* 4. Description (with promo code if present) */}
        <div
          style={{
            fontSize: "22px",
            fontWeight: 400,
            color: "#6b7280",
            lineHeight: 1.5,
            textAlign: "center",
            display: "flex",
            maxWidth: "800px",
            marginBottom: "auto",
          }}
        >
          {promoCode ? `${promoCode} - ${truncatedDesc}` : truncatedDesc}
        </div>

        {/* 5. PromoBozor brand logo (bottom center) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginTop: "auto",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandLogoDataUrl}
            alt="PromoBozor"
            width={200}
            height={50}
            style={{
              objectFit: "contain",
            }}
          />
          <div
            style={{
              color: "#6b7280",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
            }}
          >
            Chegirmalar va promokodlar bozori
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": OG_CACHE_CONTROL,
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
