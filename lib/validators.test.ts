/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import {
  hasDistinctLanguageSlugs,
  validateEmail,
  validateId,
  validateNumber,
  validatePromocodeTranslations,
  validateUrl,
} from "./validators";

describe("Data Validators", () => {
  describe("validateEmail", () => {
    it("validates correct emails", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("firstname.lastname@example.co.uk")).toBe(true);
    });

    it("rejects invalid emails", () => {
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("")).toBe(false);
    });
  });

  describe("validateUrl", () => {
    it("validates correct URLs", () => {
      expect(validateUrl("https://google.com")).toBe(true);
      expect(validateUrl("http://localhost:3000")).toBe(true);
    });

    it("allows null/undefined (optional)", () => {
      expect(validateUrl(null)).toBe(true);
      expect(validateUrl(undefined)).toBe(true);
    });

    it("rejects invalid URLs", () => {
      expect(validateUrl("not-a-url")).toBe(false);
      expect(validateUrl("google.com")).toBe(false); // Needs protocol
    });
  });

  describe("validateId (UUID)", () => {
    it("validates correct UUID", () => {
      expect(validateId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("rejects malformed UUID", () => {
      expect(validateId("12345")).toBe(false);
      expect(validateId("550e8400-e29b-41d4-a716-44665544000Z")).toBe(false); // Z is invalid hex
    });
  });

  describe("validateNumber", () => {
    it("validates number ranges", () => {
      expect(validateNumber(10, 0, 100)).toBe(true);
      expect(validateNumber("10", 0, 100)).toBe(true); // String number
    });

    it("rejects out of range", () => {
      expect(validateNumber(-1, 0, 100)).toBe(false);
      expect(validateNumber(101, 0, 100)).toBe(false);
    });
  });

  describe("validatePromocodeTranslations", () => {
    const validTranslations: any = [
      { language: "uz", title: "Uz Title", slug: "uz-title" },
      { language: "ru", title: "Ru Title", slug: "ru-title" },
      { language: "en", title: "En Title", slug: "en-title" },
    ];

    it("validates correct translations array", () => {
      expect(validatePromocodeTranslations(validTranslations)).toBe(true);
    });

    it("rejects missing languages", () => {
      const invalid = validTranslations.slice(0, 2);
      expect(validatePromocodeTranslations(invalid)).toBe(false);
    });

    it("rejects empty fields", () => {
      const invalid = [...validTranslations];
      invalid[0] = { ...invalid[0], title: "" };
      expect(validatePromocodeTranslations(invalid)).toBe(false);
    });

    it("rejects duplicate languages", () => {
      const invalid = [
        { language: "uz", title: "Uz Title", slug: "uz-title" },
        { language: "uz", title: "Ru Title", slug: "ru-title" },
        { language: "en", title: "En Title", slug: "en-title" },
      ];
      expect(validatePromocodeTranslations(invalid as any)).toBe(false);
    });

    it("rejects when all language slugs are identical", () => {
      const invalid = [
        { language: "uz", title: "Uz Title", slug: "same-slug" },
        { language: "ru", title: "Ru Title", slug: "same-slug" },
        { language: "en", title: "En Title", slug: "same-slug" },
      ] as const;
      expect(validatePromocodeTranslations(invalid)).toBe(false);
      expect(hasDistinctLanguageSlugs(invalid)).toBe(false);
    });
  });
});
