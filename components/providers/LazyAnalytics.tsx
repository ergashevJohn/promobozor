"use client";

import { readCspNonce } from "@/lib/csp-nonce";
import { hasAnalyticsConsent } from "@/lib/consent";
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
  const [clientNonce, setClientNonce] = useState(nonce);

  useEffect(() => {
    const win = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      };

    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const start = () => {
      if (!hasAnalyticsConsent()) return;
      setClientNonce(nonce ?? readCspNonce(document));
      setEnabled(true);
    };

    const schedule = () => {
      if (!hasAnalyticsConsent()) return;
      if (typeof win.requestIdleCallback === "function") {
        idleId = win.requestIdleCallback(start, { timeout: 1500 });
      } else {
        timeoutId = window.setTimeout(start, 600);
      }
    };

    schedule();
    window.addEventListener("consent-updated", schedule);
    return () => {
      window.removeEventListener("consent-updated", schedule);
      if (idleId !== undefined && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [nonce]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <AnalyticsClient nonce={clientNonce} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
