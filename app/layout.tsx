import LazyAnalytics from "@/components/providers/LazyAnalytics";
import { getBaseUrl } from "@/lib/metadata";
import { ThemeProvider } from "@/lib/theme-provider";
import { Agentation } from "agentation";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { headers } from "next/headers";
import type React from "react";
import "./globals.css";

const brandSans = Manrope({
  subsets: ["latin", "cyrillic", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-brand-sans",
});

const brandMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-brand-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  // Search engine verification (use environment variables for production)
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    }),
    ...(process.env.YANDEX_SITE_VERIFICATION && {
      yandex: process.env.YANDEX_SITE_VERIFICATION,
    }),
  },
  // Preconnect to external image CDN for performance
  // Note: Using links instead of other meta to avoid "meta tags in body" issue
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1220" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  interactiveWidget: "resizes-visual",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;
  // Get locale from pathname for server-side lang attribute (SEO critical)
  const pathname = headersList.get("x-pathname") || "";
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : "uz"; // Default to Uzbek

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${brandSans.variable} ${brandMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          {children}
          {process.env.NODE_ENV === "development" && <Agentation />}
          <LazyAnalytics nonce={nonce} />
        </ThemeProvider>
      </body>
    </html>
  );
}
