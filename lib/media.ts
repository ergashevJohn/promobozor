const APPROVED_EXTERNAL_IMAGE_HOSTS = new Set(["ik.imagekit.io"]);

/**
 * Next Image configuration only permits local assets and ImageKit uploads in
 * production. Treat any other stored value as missing so catalogue cards can
 * render their existing icon fallback instead of a broken image.
 */
export function getApprovedImageUrl(value: string | null | undefined): string | null {
  const url = value?.trim();

  if (!url) {
    return null;
  }

  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "https:" || !APPROVED_EXTERNAL_IMAGE_HOSTS.has(parsedUrl.hostname)) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}
