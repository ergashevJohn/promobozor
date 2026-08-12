"use client";

import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const getSnapshot = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };

  const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") return () => {};

    const media = window.matchMedia(query);

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    } else {
      // Fallback for older browsers
      media.addListener(callback);
      return () => media.removeListener(callback);
    }
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
