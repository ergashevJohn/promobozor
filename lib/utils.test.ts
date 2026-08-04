import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", true && "bar", false && "baz")).toBe("foo bar");
  });

  it("should merge tailwind classes properly", () => {
    // p-4 should overwrite p-2
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("should handle arrays and objects", () => {
    expect(cn("foo", ["bar", { baz: true }])).toBe("foo bar baz");
  });
});
