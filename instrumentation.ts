/**
 * Next.js instrumentation - runs once at server startup
 * Validates production environment variables
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateProductionEnv } = await import("@/lib/env-validation");
    validateProductionEnv();
  }
}
