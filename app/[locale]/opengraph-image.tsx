import { ImageResponse } from "next/og";
import { getBaseUrl } from "@/lib/metadata";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function Image(props: Props) {
  const { locale } = await props.params;

  const descriptions: Record<string, string> = {
    uz: "Tekshirilgan chegirmalar, promokodlar va foydali takliflarni bir joyda toping",
    ru: "Находите проверенные скидки, промокоды и полезные предложения в одном месте",
    en: "Find verified discounts, promo codes, and useful offers in one place",
  };

  const features: Record<string, string[]> = {
    uz: ["50+ promokodlar", "Har kuni tekshiriladi", "Bepul"],
    ru: ["50+ промокодов", "Проверяется ежедневно", "Бесплатно"],
    en: ["50+ promocodes", "Checked daily", "Free"],
  };

  const description = descriptions[locale] || descriptions.uz;
  const featureList = features[locale] || features.uz;

  // Inline the logo to keep the generated image self-contained.
  const logoUrl = `${getBaseUrl()}/promobozor-logo.png`;
  let logoDataUrl = logoUrl;

  try {
    const logoResponse = await fetch(logoUrl);
    const logoBuffer = await logoResponse.arrayBuffer();
    const logoBase64 = Buffer.from(logoBuffer).toString("base64");
    logoDataUrl = `data:image/png;base64,${logoBase64}`;
  } catch (error) {
    // Fallback to original URL if fetch fails
    console.error("Failed to fetch logo:", error);
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
        padding: "80px",
      }}
    >
      {/* Subtle top glow */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "50%",
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse, rgba(255, 90, 79, 0.16) 0%, transparent 70%)",
          transform: "translateX(-50%)",
          display: "flex",
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "48px",
        }}
      >
        <img
          src={logoDataUrl}
          alt="PromoBozor"
          width={420}
          height={105}
          style={{
            objectFit: "contain",
          }}
        />
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "34px",
          fontWeight: 500,
          color: "#111827",
          textAlign: "center",
          maxWidth: "900px",
          lineHeight: 1.5,
          marginBottom: "56px",
          letterSpacing: "-0.5px",
          display: "flex",
        }}
      >
        {description}
      </div>

      {/* Features with separator dots */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "32px",
        }}
      >
        {featureList.map((feature, featureIndex) => (
          <div
            key={feature}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
            }}
          >
            <span
              style={{
                fontSize: "22px",
                fontWeight: 600,
                color: "#111827",
                letterSpacing: "0.5px",
              }}
            >
              {feature}
            </span>
            {featureIndex < featureList.length - 1 && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "rgba(255, 90, 79, 0.45)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Bottom gradient line */}
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
    </div>,
    {
      ...size,
    }
  );
}
