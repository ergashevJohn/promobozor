/**
 * Secret: CSRF_SECRET only in production. NEXTAUTH_SECRET is accepted as a
 * temporary fallback in non-production environments only.
 */
import crypto from "crypto";

const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

const DEFAULT_SECRET = "default-secret-change-in-production";

function getSecret(): string {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.CSRF_SECRET;
    if (!secret || secret === DEFAULT_SECRET || secret.length < 32) {
      throw new Error(
        "CSRF_SECRET must be set and at least 32 characters in production for CSRF protection"
      );
    }
    return secret;
  }

  return process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || DEFAULT_SECRET;
}

/**
 * Generate a signed CSRF token for the client to send back on mutating requests
 */
export function generateCsrfToken(): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString("hex");
  const data = `${timestamp}.${random}`;
  const signature = crypto.createHmac("sha256", getSecret()).update(data).digest("hex");

  return Buffer.from(`${data}.${signature}`).toString("base64");
}

/**
 * Verify CSRF token from request headers
 * Validates signature and expiration
 */
async function verifyCsrfToken(request: Request): Promise<boolean> {
  // In development, you can still skip for easier testing
  // But it's better to test with CSRF enabled
  if (process.env.NODE_ENV !== "production" && process.env.DISABLE_CSRF === "true") {
    return true;
  }

  const csrfToken = request.headers.get("x-csrf-token");

  if (!csrfToken) {
    return false;
  }

  try {
    // Decode base64
    const decoded = Buffer.from(csrfToken, "base64").toString("utf-8");

    // Parse: timestamp.random.signature
    const parts = decoded.split(".");
    if (parts.length !== 3) {
      return false;
    }

    const [timestampStr, random, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // Validate timestamp is a number
    if (isNaN(timestamp)) {
      return false;
    }

    // Check token expiration (1 hour)
    const now = Date.now();
    if (now - timestamp > TOKEN_EXPIRY) {
      return false;
    }

    // Re-create and verify HMAC signature
    const data = `${timestampStr}.${random}`;
    const expectedSignature = crypto.createHmac("sha256", getSecret()).update(data).digest("hex");

    // Constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }
    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("CSRF token verification error:", error);
    return false;
  }
}

/**
 * Middleware to protect API routes from CSRF attacks
 */
export async function csrfProtection(request: Request): Promise<{
  success: boolean;
  error?: string;
}> {
  // Skip for GET, HEAD, OPTIONS requests (they don't modify state)
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { success: true };
  }

  // Verify CSRF token for state-changing operations
  const isValid = await verifyCsrfToken(request);

  if (!isValid) {
    return {
      success: false,
      error: "Invalid CSRF token. Please refresh the page and try again.",
    };
  }

  return { success: true };
}
