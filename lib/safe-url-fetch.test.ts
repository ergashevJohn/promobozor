import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveApprovedFetchUrl } from "./safe-url-fetch";

describe("resolveApprovedFetchUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("allows ImageKit https URLs", () => {
    expect(
      resolveApprovedFetchUrl(
        "https://ik.imagekit.io/promobozor/store.png",
        "https://promobozor.uz"
      )
    ).toBe("https://ik.imagekit.io/promobozor/store.png");
  });

  it("resolves same-origin relative paths", () => {
    expect(resolveApprovedFetchUrl("/promobozor-logo.png", "https://promobozor.uz")).toBe(
      "https://promobozor.uz/promobozor-logo.png"
    );
  });

  it("rejects SSRF targets and unapproved hosts", () => {
    expect(
      resolveApprovedFetchUrl("http://169.254.169.254/latest/meta-data/", "https://promobozor.uz")
    ).toBeNull();
    expect(
      resolveApprovedFetchUrl("https://evil.example.com/logo.png", "https://promobozor.uz")
    ).toBeNull();
    expect(
      resolveApprovedFetchUrl("http://ik.imagekit.io/promobozor/store.png", "https://promobozor.uz")
    ).toBeNull();
  });
});
