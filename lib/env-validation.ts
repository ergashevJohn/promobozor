/**
 * Production environment validation
 * Validates critical env vars when NODE_ENV=production
 * Called from instrumentation.ts at server startup
 */
export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // CSRF_SECRET - required for CSRF token signing (CRITICAL)
  // NEXTAUTH_SECRET is accepted temporarily for migration compatibility
  const csrfSecret = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET;
  if (!csrfSecret || csrfSecret.length < 32) {
    errors.push(
      "CSRF_SECRET must be set and at least 32 characters (required for CSRF protection)"
    );
  } else if (!process.env.CSRF_SECRET && process.env.NEXTAUTH_SECRET) {
    warnings.push(
      "Using legacy NEXTAUTH_SECRET for CSRF. Rename it to CSRF_SECRET when convenient."
    );
  }

  // NEXT_PUBLIC_BASE_URL - recommended for SEO (Vercel sets VERCEL_URL as fallback)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const vercelUrl = process.env.VERCEL_URL;
  if (!baseUrl && !vercelUrl) {
    warnings.push(
      "NEXT_PUBLIC_BASE_URL not set - using fallback. Set for correct canonical URLs and sitemap."
    );
  } else if (baseUrl && !baseUrl.startsWith("https://")) {
    warnings.push("NEXT_PUBLIC_BASE_URL should use https:// for production");
  }

  // Cache revalidation secret — endpoint fails closed without it, but ops should set one
  const revalidateSecret = process.env.REVALIDATE_SECRET || process.env.CRON_SECRET;
  if (!revalidateSecret || revalidateSecret.length < 32) {
    warnings.push(
      "REVALIDATE_SECRET (or CRON_SECRET) should be set (≥32 chars) for POST /api/cache/revalidate"
    );
  }

  if (process.env.RATE_LIMIT_DISABLED === "true") {
    warnings.push(
      "RATE_LIMIT_DISABLED=true is ignored in production; remove it from production env"
    );
  }

  if (warnings.length > 0) {
    console.warn("⚠️  Production environment warnings:");
    warnings.forEach((w) => console.warn("   -", w));
  }

  if (errors.length > 0) {
    console.error("❌ Production environment validation failed:");
    errors.forEach((e) => console.error("   -", e));
    throw new Error(`Production env validation failed: ${errors.join("; ")}`);
  }

  if (warnings.length === 0) {
    console.log("✅ Production environment validated");
  }
}
