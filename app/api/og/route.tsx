import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters
    const title = searchParams.get("title") || "PromoBozor";
    const description = searchParams.get("description") || "Chegirmalar va promokodlar bozori";
    const type = searchParams.get("type") || "default";
    const logo = searchParams.get("logo");
    const discount = searchParams.get("discount");

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

    // Accent colors per type
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

    const accent = accents[type] || accents.default;

    // Fetch store/brand logo as base64
    let logoDataUrl: string | null = null;
    if (logo) {
      try {
        const logoResponse = await fetch(logo);
        const logoBuffer = await logoResponse.arrayBuffer();
        const logoBase64 = Buffer.from(logoBuffer).toString("base64");
        const contentType = logoResponse.headers.get("content-type") || "image/png";
        logoDataUrl = `data:${contentType};base64,${logoBase64}`;
      } catch {
        // Fallback — will show emoji
      }
    }

    // Fetch PromoBozor brand logo as base64
    const brandLogoUrl = new URL("/promobozor-logo.png", request.url).toString();
    let brandLogoDataUrl = brandLogoUrl;
    try {
      const brandLogoResponse = await fetch(brandLogoUrl);
      const brandLogoBuffer = await brandLogoResponse.arrayBuffer();
      const brandLogoBase64 = Buffer.from(brandLogoBuffer).toString("base64");
      brandLogoDataUrl = `data:image/png;base64,${brandLogoBase64}`;
    } catch {
      // Fallback to URL
    }

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
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
