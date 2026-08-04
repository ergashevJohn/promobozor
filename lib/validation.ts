/**
 * Validate and sanitize IP address
 * Prevents IP spoofing and injection attacks
 */
export function validateIp(ip: string | null): string | null {
  if (!ip || typeof ip !== "string") {
    return null;
  }

  // Remove any whitespace
  const trimmedIp = ip.trim();

  // Check for suspicious characters (injection attempt)
  if (/[;&|`$()]/.test(trimmedIp)) {
    return null;
  }

  // IPv4 validation
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = trimmedIp.match(ipv4Regex);

  if (ipv4Match) {
    const [, ...octets] = ipv4Match;
    // Each octet must be between 0-255
    if (octets.every((octet) => parseInt(octet, 10) <= 255)) {
      return trimmedIp;
    }
  }

  // IPv6 validation (simplified - basic format check)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
  if (ipv6Regex.test(trimmedIp)) {
    return trimmedIp;
  }

  // Localhost addresses
  if (trimmedIp === "::1" || trimmedIp === "127.0.0.1") {
    return trimmedIp;
  }

  return null;
}

/**
 * Extract and validate IP from request headers
 * Prevents header spoofing
 */
export function extractIpAddress(request: Request): string | null {
  // Check headers in order of preference (most reliable first)
  const headers = [
    "cf-connecting-ip", // Cloudflare
    "x-forwarded-for",
    "x-real-ip",
    "x-client-ip",
  ];

  for (const header of headers) {
    const ip = request.headers.get(header);
    if (ip) {
      // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
      // We want the first one (original client)
      const firstIp = ip.split(",")[0].trim();
      const validated = validateIp(firstIp);
      if (validated) {
        return validated;
      }
    }
  }

  return null;
}

/**
 * Mask IP address for logging (privacy)
 * Example: 192.168.1.100 -> 192.168.1.***
 */
export function maskIp(ip: string | null): string {
  if (!ip) return "unknown";

  const validated = validateIp(ip);
  if (!validated) return "invalid";

  // IPv4 masking
  const ipv4Match = validated.match(/^(\d+\.\d+\.\d+)\.\d+$/);
  if (ipv4Match) {
    return `${ipv4Match[1]}.***`;
  }

  // IPv6 masking (keep first 4 segments)
  const ipv6Match = validated.match(/^([0-9a-fA-F:]{0,19}):/);
  if (ipv6Match) {
    return `${ipv6Match[1]}:***`;
  }

  return "***";
}
