import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export function useRecaptcha() {
  // Check if we are in development mode
  const isDev = process.env.NODE_ENV === "development";

  // In development, return a mock implementation
  // This avoids the "GoogleReCaptcha Context has not yet been implemented" error
  // because we disabled the provider in dev mode.
  if (isDev) {
    return {
      executeRecaptcha: async (action?: string) => {
        console.log(`ℹ️ [Dev] Skipping reCAPTCHA execution for action: ${action}`);
        // Return null or empty string tokens in dev
        // The backend should allow this if configured to skip verification in dev
        return "";
      },
    };
  }

  // In production, use the real hook
  // We must suppress the lint warning because this hook call is conditional based on build-time constant
  // effectively, but React rules are strict. Since proper build tools define NODE_ENV constantly,
  // this branch is stable per-environment.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useGoogleReCaptcha();
}
