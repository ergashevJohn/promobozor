/**
 * Reads the CSP nonce from a script Next.js already stamped.
 * Static/ISR HTML cannot bake a per-request nonce via headers().
 */
export function readCspNonce(doc: Document): string | undefined {
  const el = doc.querySelector("script[nonce]");
  if (el instanceof HTMLScriptElement && el.nonce) {
    return el.nonce;
  }
  return el?.getAttribute("nonce") || undefined;
}
