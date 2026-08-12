import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useBrowserSearchParams } from "./use-browser-search-params";

describe("useBrowserSearchParams", () => {
  const originalSearch = window.location.search;

  afterEach(() => {
    // Patched history.replaceState notifies subscribers — must run inside act().
    act(() => {
      window.history.replaceState({}, "", `${window.location.pathname}${originalSearch}`);
    });
  });

  it("reads the current query string after subscription", () => {
    act(() => {
      window.history.replaceState({}, "", "/promocodes?storeId=abc");
    });

    const { result } = renderHook(() => useBrowserSearchParams());

    // useSyncExternalStore may schedule a sync from getServerSnapshot ("") → client URL.
    act(() => {
      // flush passive/store updates
    });

    expect(result.current.get("storeId")).toBe("abc");
  });

  it("updates when history.pushState changes the query string", () => {
    act(() => {
      window.history.replaceState({}, "", "/promocodes");
    });

    const { result } = renderHook(() => useBrowserSearchParams());

    act(() => {
      // flush initial server→client snapshot reconciliation
    });

    act(() => {
      window.history.pushState({}, "", "/promocodes?search=yandex&page=2");
    });

    expect(result.current.get("search")).toBe("yandex");
    expect(result.current.get("page")).toBe("2");
  });
});
