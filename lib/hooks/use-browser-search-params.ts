"use client";

import { useMemo, useSyncExternalStore } from "react";

type Listener = () => void;

const listeners = new Set<Listener>();
let historyPatched = false;
let originalPushState: History["pushState"] | null = null;
let originalReplaceState: History["replaceState"] | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

function ensureHistoryPatched() {
  if (historyPatched || typeof window === "undefined") {
    return;
  }

  historyPatched = true;
  originalPushState = history.pushState.bind(history);
  originalReplaceState = history.replaceState.bind(history);

  history.pushState = ((...args: Parameters<History["pushState"]>) => {
    const result = originalPushState!(...args);
    notify();
    return result;
  }) as History["pushState"];

  history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
    const result = originalReplaceState!(...args);
    notify();
    return result;
  }) as History["replaceState"];

  window.addEventListener("popstate", notify);
}

function subscribe(listener: Listener): () => void {
  ensureHistoryPatched();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getClientSearch(): string {
  return window.location.search;
}

function getServerSearch(): string {
  // Keep SSR and hydration identical so Next.js does not bail out to CSR.
  return "";
}

/**
 * Read the current URL query string without `useSearchParams()`.
 * Avoids Next.js `BAILOUT_TO_CLIENT_SIDE_RENDERING` so the page can SSR.
 */
export function useBrowserSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, getClientSearch, getServerSearch);

  return useMemo(() => {
    const normalized = search.startsWith("?") ? search.slice(1) : search;
    return new URLSearchParams(normalized);
  }, [search]);
}
