import { describe, expect, it } from "vitest";
import { readCspNonce } from "./csp-nonce";

describe("readCspNonce", () => {
  it("returns the nonce from a stamped script element", () => {
    const doc = document.implementation.createHTMLDocument();
    const script = doc.createElement("script");
    script.setAttribute("nonce", "abc123");
    doc.body.appendChild(script);

    expect(readCspNonce(doc)).toBe("abc123");
  });

  it("returns undefined when no nonce is present", () => {
    const doc = document.implementation.createHTMLDocument();
    expect(readCspNonce(doc)).toBeUndefined();
  });
});
