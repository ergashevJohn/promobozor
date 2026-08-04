/**
 * Verify reCAPTCHA token server-side
 */
export async function verifyRecaptcha(token: string | null | undefined): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Skip verification in development or if no secret key configured
  if (process.env.NODE_ENV !== "production") {
    console.log("ℹ️ reCAPTCHA verification skipped in development mode");
    return true;
  }

  if (!secretKey) {
    console.error("❌ RECAPTCHA_SECRET_KEY not configured in production");
    return false;
  }

  if (!token) {
    console.error("❌ reCAPTCHA token missing");
    return false;
  }

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!data.success) {
      console.error("❌ reCAPTCHA verification failed:", data["error-codes"]);
      return false;
    }

    console.debug("✅ reCAPTCHA verified, score:", data.score);
    return data.score > 0.5;
  } catch (error) {
    console.error("❌ reCAPTCHA verification error:", error);
    return false;
  }
}
