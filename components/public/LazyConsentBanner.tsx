"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ConsentBanner = dynamic(
  () => import("./ConsentBanner").then((module) => ({ default: module.ConsentBanner })),
  { ssr: false }
);

export default function LazyConsentBanner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const win = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      };

    const start = () => setMounted(true);

    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(start, { timeout: 1200 });
      return () => {
        if (typeof win.cancelIdleCallback === "function") {
          win.cancelIdleCallback(id);
        }
      };
    }

    const timeoutId = window.setTimeout(start, 500);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!mounted) {
    return null;
  }

  return <ConsentBanner />;
}
