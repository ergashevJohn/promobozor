import { getApprovedImageUrl } from "@/lib/media";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const FETCH_TIMEOUT_MS = 3000;

/**
 * Resolve a logo URL for server-side fetch with SSRF protections:
 * - only approved ImageKit hosts or same-origin relative paths
 * - https only for absolute URLs
 * - timeout, redirect block, content-type and size limits
 */
export function resolveApprovedFetchUrl(
  logo: string | null | undefined,
  requestOrigin: string
): string | null {
  const approved = getApprovedImageUrl(logo);
  if (!approved) {
    return null;
  }

  if (approved.startsWith("/")) {
    try {
      return new URL(approved, requestOrigin).toString();
    } catch {
      return null;
    }
  }

  return approved;
}

/**
 * Fetch an approved image URL as a data URL, or null if unsafe/failed.
 */
export async function fetchApprovedImageAsDataUrl(
  logo: string | null | undefined,
  requestOrigin: string
): Promise<string | null> {
  const absoluteUrl = resolveApprovedFetchUrl(logo, requestOrigin);
  if (!absoluteUrl) {
    return null;
  }

  // Defense in depth: reject non-https absolute fetches (relative already resolved)
  try {
    const parsed = new URL(absoluteUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    // In production only allow https for external hosts; http only for localhost
    if (parsed.protocol === "http:") {
      const isLocal =
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "::1";
      if (process.env.NODE_ENV === "production" || !isLocal) {
        return null;
      }
    }
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(absoluteUrl, {
      signal: controller.signal,
      redirect: "error",
      headers: { Accept: "image/*" },
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return null;
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_IMAGE_BYTES) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
      return null;
    }

    const base64 = Buffer.from(buffer).toString("base64");
    const safeType = contentType.split(";")[0]?.trim() || "image/png";
    return `data:${safeType};base64,${base64}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
