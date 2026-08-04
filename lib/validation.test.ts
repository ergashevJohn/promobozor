import { describe, expect, it } from "vitest";
import { maskIp, validateIp } from "./validation";

describe("validateIp", () => {
  it("should validate correct IPv4 addresses", () => {
    expect(validateIp("192.168.1.1")).toBe("192.168.1.1");
    expect(validateIp("8.8.8.8")).toBe("8.8.8.8");
  });

  it("should validate localhost", () => {
    expect(validateIp("127.0.0.1")).toBe("127.0.0.1");
    expect(validateIp("::1")).toBe("::1");
  });

  it("should reject invalid IPv4 addresses", () => {
    expect(validateIp("256.256.256.256")).toBe(null); // Out of range
    expect(validateIp("1.2.3")).toBe(null); // Incomplete
    expect(validateIp("abc.def.ghi.jkl")).toBe(null); // Non-numeric
  });

  it("should reject potential injection attacks", () => {
    expect(validateIp("127.0.0.1; rm -rf /")).toBe(null);
    expect(validateIp("127.0.0.1 && echo hack")).toBe(null);
  });

  it("should handle null or undefined", () => {
    expect(validateIp(null)).toBe(null);
    // @ts-expect-error Testing invalid input
    expect(validateIp(undefined)).toBe(null);
  });
});

describe("maskIp", () => {
  it("should mask IPv4 address", () => {
    expect(maskIp("192.168.1.100")).toBe("192.168.1.***");
  });

  it("should mask IPv6 address", () => {
    expect(maskIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe("2001:0db8:85a3:0000:***");
  });

  it("should handle invalid IPs", () => {
    expect(maskIp("invalid-ip")).toBe("invalid");
    expect(maskIp(null)).toBe("unknown");
  });
});
