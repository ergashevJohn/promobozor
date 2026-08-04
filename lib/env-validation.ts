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

  // NEXTAUTH_SECRET - required for auth and CSRF (CRITICAL)
  const authSecret = process.env.NEXTAUTH_SECRET;
  if (!authSecret || authSecret.length < 32) {
    errors.push(
      "NEXTAUTH_SECRET must be set and at least 32 characters (required for auth and CSRF)"
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

  // Redis - rate-limit.ts throws when used; we warn early for visibility
  const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === "true";
  if (!hasRedis && !rateLimitDisabled) {
    warnings.push(
      "Redis not configured - rate limiting will fail at runtime. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
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
