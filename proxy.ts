import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { getRedirectPath, isGone } from "./lib/redirects";

const intlMiddleware = createMiddleware(routing);

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

  // 410 Gone Check for Bots and Users
  // Match segments: /[locale]/store/[slug], /[locale]/promocode/[slug], etc.
  const goneMatch = pathname.match(/^\/([a-z]{2})\/(store|promocode|category|brand)\/([^\/]+)$/);
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

  // Database Redirect Check (for old slugs after slug unification)
  const redirectPath = await getRedirectPath(pathname);
  if (redirectPath) {
    const redirectUrl = new URL(redirectPath, request.url);
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Track request start time for Server-Timing header
  const requestStart = Date.now();

  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === "development";
  const isProd = process.env.NODE_ENV === "production";
  const enforceTrustedTypes = process.env.TRUSTED_TYPES_ENFORCE === "true";
  const trustedTypesDirectives = isProd
    ? [
        "trusted-types dompurify",
        ...(enforceTrustedTypes ? ["require-trusted-types-for 'script'"] : []),
      ]
    : [];

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    isDev ? "'unsafe-eval'" : null,
    isDev ? "'unsafe-inline'" : null,
    "https://vercel.live",
    "https://www.googletagmanager.com",
    "https://mc.yandex.ru",
    "https://www.google.com",
    "https://www.gstatic.com",
    "https://va.vercel-scripts.com",
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
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://vercel.live https://www.google.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...trustedTypesDirectives,
  ].join("; ");

  // Set CSP on request headers so Next.js can extract the nonce
  // and auto-propagate it to all internal inline scripts during rendering
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

  // Add Server-Timing header for TTFB monitoring (Chrome DevTools → Network → Timing)
  const middlewareDuration = Date.now() - requestStart;
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
