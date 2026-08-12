import { getBaseUrl } from "@/lib/metadata";
import type { Metadata, Viewport } from "next";
import type React from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    }),
    ...(process.env.YANDEX_SITE_VERIFICATION && {
      yandex: process.env.YANDEX_SITE_VERIFICATION,
    }),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f3f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  interactiveWidget: "resizes-visual",
};

/**
 * Passthrough root layout so locale pages can own <html lang>.
 * Calling headers() here forced DYNAMIC_SERVER_USAGE on ISR entity routes.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
