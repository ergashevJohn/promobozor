import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { resolvePromokodAliasRedirect } from "./lib/promokod-alias-resolve";
import { getRedirectPath, isGone } from "./lib/redirects";
import {
  ALL_ENTITY_SEGMENTS_PATTERN,
  ALL_LIST_SEGMENTS_PATTERN,
  getListPath,
  resolveLegacyLocalizedPath,
  resolveListTypeFromSegment,
  type Locale,
} from "./lib/routes";

const intlMiddleware = createMiddleware(routing);

const goneSegmentRegex = new RegExp(`^/(uz|ru|en)/(${ALL_ENTITY_SEGMENTS_PATTERN})/([^/]+)$`);
const listSegmentRegex = new RegExp(`^/(uz|ru|en)/(${ALL_LIST_SEGMENTS_PATTERN})/?$`);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware entirely for sitemap routes - let Next.js handle them
  if (
    pathname.startsWith("/sitemap") ||
    pathname === "/robots.txt" ||
    pathname === "/llms.txt" ||
    pathname === "/manifest.webmanifest"
  ) {
    return NextResponse.next();
  }

  // 410 Gone Check for Bots and Users (legacy + localized segments)
  const goneMatch = pathname.match(goneSegmentRegex);
  if (goneMatch) {
    const [, , type, slug] = goneMatch;

    if (isGone(type, slug)) {
      // We return 410 status and rewrite to the same URL so the page component can render the UI
      return new NextResponse(null, {
        status: 410,
        headers: {
          "x-middleware-rewrite": new URL(pathname, request.url).toString(),
        },
      });
    }
  }

  // Home filter query → promocodes listing (keeps /{locale} ISR without searchParams)
  const homeLocaleMatch = pathname.match(/^\/(uz|ru|en)\/?$/);
  if (homeLocaleMatch && request.method === "GET") {
    const filterKeys = ["storeId", "categoryId", "brandId", "search", "sortBy", "featured", "page"];
    const hasHomeFilters = filterKeys.some((key) => {
      const value = request.nextUrl.searchParams.get(key);
      return value !== null && value !== "";
    });
    if (hasHomeFilters) {
      const locale = homeLocaleMatch[1] as Locale;
      const target = new URL(getListPath(locale, "promocodes"), request.url);
      request.nextUrl.searchParams.forEach((value, key) => {
        if (filterKeys.includes(key) && value !== "") {
          target.searchParams.set(key, value);
        }
      });
      return NextResponse.redirect(target, 301);
    }
  }

  // Database Redirect Check (for old slugs after slug unification)
  const redirectPath = await getRedirectPath(pathname);
  if (redirectPath) {
    const redirectUrl = new URL(redirectPath, request.url);
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Legacy English segments → localized public paths (same slug)
  const legacyLocalized = resolveLegacyLocalizedPath(pathname);
  if (legacyLocalized && legacyLocalized !== pathname) {
    const redirectUrl = new URL(legacyLocalized, request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Competitor /promokod/{slug} alias → store/brand hub (proxy-level; avoids RU route clash)
  const aliasTarget = await resolvePromokodAliasRedirect(pathname);
  if (aliasTarget) {
    return NextResponse.redirect(new URL(aliasTarget, request.url), 301);
  }

  // Track request start time for Server-Timing header
  const requestStart = Date.now();

  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === "development";
  const isProd = process.env.NODE_ENV === "production";
  const enforceTrustedTypes = process.env.TRUSTED_TYPES_ENFORCE === "true";
  // Only emit trusted-types when enforcement is on. A names-only directive still
  // blocks browser extensions (vue, duplicate goog#html) and floods the console
  // without adding real protection unless require-trusted-types-for is set.
  const trustedTypesDirectives =
    isProd && enforceTrustedTypes
      ? [
          "trusted-types dompurify goog#html 'allow-duplicates'",
          "require-trusted-types-for 'script'",
        ]
      : [];

  // Do NOT put a per-request nonce in the browser CSP when HTML can be CDN/ISR
  // cached. Cached markup keeps old script nonces while middleware issues a new
  // CSP nonce → inline Next.js scripts are blocked → React never hydrates
  // (theme toggle, language switch, client nav all break).
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : null,
    "https://vercel.live",
    "https://www.googletagmanager.com",
    "https://mc.yandex.ru",
    "https://www.google.com",
    "https://www.gstatic.com",
    "https://va.vercel-scripts.com",
    "https://static.cloudflareinsights.com",
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  const connectSrc = [
    "'self'",
    "https:",
    "ws:",
    "wss:",
    isDev ? "localhost:*" : null,
    isDev ? "127.0.0.1:*" : null,
    isDev ? "http:" : null,
    "https://va.vercel-scripts.com",
    "https://www.google-analytics.com",
    "https://mc.yandex.ru",
    "wss://mc.yandex.ru",
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  const imgSrc = ["'self'", "data:", "https:", "blob:", isDev ? "http:" : null]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src 'self' data: https://vercel.live",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://vercel.live https://www.google.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...trustedTypesDirectives,
  ].join("; ");

  // Pass nonce to the request so dynamic SSR can still stamp scripts when rendered.
  // The response CSP above intentionally does not require that nonce.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-request-start", String(requestStart));

  // Get the response from next-intl middleware with updated request headers
  const response = intlMiddleware(
    new NextRequest(request.url, {
      headers: requestHeaders,
      method: request.method,
    })
  );

  // Also set headers on the response for the browser
  response.headers.set("x-pathname", pathname);
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", csp);

  // Filtered promocodes listing: keep page ISR, but tell crawlers not to index query variants
  const listMatch = pathname.match(listSegmentRegex);
  if (listMatch && request.method === "GET") {
    const listType = resolveListTypeFromSegment(listMatch[2]);
    if (listType === "promocodes") {
      const noindexKeys = ["storeId", "categoryId", "brandId", "search", "sortBy", "featured"];
      const hasFilterQuery = noindexKeys.some((key) => {
        const value = request.nextUrl.searchParams.get(key);
        return value !== null && value !== "";
      });
      if (hasFilterQuery) {
        response.headers.set("X-Robots-Tag", "noindex, follow");
        // Point crawlers at the clean listing URL (optional canonical improvement).
        const locale = listMatch[1] as Locale;
        const cleanPath = getListPath(locale, "promocodes");
        const cleanUrl = new URL(cleanPath, request.url).toString();
        response.headers.set("Link", `<${cleanUrl}>; rel="canonical"`);
      }
    }
  }

  // Add Server-Timing header for TTFB monitoring (Chrome DevTools → Network → Timing)
  const middlewareDuration = Math.max(0, Date.now() - requestStart);
  response.headers.set(
    "Server-Timing",
    `middleware; dur=${middlewareDuration.toFixed(2)}, desc="Middleware processing time"`
  );
  if (request.method === "GET") {
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  }

  return response;
}

export const config = {
  matcher: [
    // Match all pathnames EXCEPT:
    // - API routes (/api/*)
    // - Next.js internals (/_next/*)
    // - Vercel internals (/_vercel/*)
    // - Static files (images, fonts, icons, etc.)
    // - Special files (robots.txt, manifest, etc.)
    "/((?!api|_next|_vercel|_static|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot)|robots\\.txt|llms\\.txt|manifest\\.webmanifest|favicon|apple-icon|android-chrome|browserconfig|site\\.webmanifest).*)",
  ],
};

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
