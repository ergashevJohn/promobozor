"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AnalyticsClient = dynamic(() => import("./AnalyticsClient"), {
  ssr: false,
});

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((module) => ({ default: module.Analytics })),
  { ssr: false }
);

const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((module) => ({ default: module.SpeedInsights })),
  { ssr: false }
);

export default function LazyAnalytics({ nonce }: { nonce?: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const win = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      };

    const start = () => setEnabled(true);

    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(start, { timeout: 1500 });
      return () => {
        if (typeof win.cancelIdleCallback === "function") {
          win.cancelIdleCallback(id);
        }
      };
    }

    const timeoutId = window.setTimeout(start, 600);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <AnalyticsClient nonce={nonce} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
