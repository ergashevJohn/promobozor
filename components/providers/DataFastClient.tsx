"use client";

import { CONSENT_STORAGE_KEY } from "@/lib/consent";
import { getDataFast } from "@/lib/datafast";
import { useEffect } from "react";

function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      preferences?: { analytics?: boolean; marketing?: boolean };
    };
    return Boolean(parsed?.preferences?.analytics || parsed?.preferences?.marketing);
  } catch {
    return false;
  }
}

export function DataFastClient() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    let started = false;

    const start = () => {
      if (started || !hasAnalyticsConsent()) return;
      started = true;
      void getDataFast();
    };

    const schedule = () => {
      if (started || !hasAnalyticsConsent()) return;
      if (typeof window.requestIdleCallback === "function") {
        idleId = requestIdleCallback(start, { timeout: 1500 });
      } else {
        timeoutId = window.setTimeout(start, 500);
      }
    };

    schedule();
    window.addEventListener("consent-updated", schedule);

    return () => {
      window.removeEventListener("consent-updated", schedule);
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
