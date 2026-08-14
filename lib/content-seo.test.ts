import { describe, expect, it } from "vitest";
import { howToHtmlToSteps, normalizeFaqItems, resolveEntityBody, stripHtml } from "./content-seo";

describe("content-seo helpers", () => {
  it("prefers bodyHtml over thinner description", () => {
    const body = resolveEntityBody({
      bodyHtml: "<p>Long enough store editorial body for SEO.</p>",
      description: "short",
      hubDescription: "hub copy",
    });
    expect(body).toContain("Long enough");
  });

  it("falls back to hub when description is thin", () => {
    const body = resolveEntityBody({
      description: "thin",
      hubDescription: "Hub description that is long enough for store pages and SEO.",
    });
    expect(body).toContain("Hub description");
  });

  it("normalizes faq json and rejects invalid shapes", () => {
    expect(normalizeFaqItems([{ question: "Q", answer: "A" }])).toEqual([
      { question: "Q", answer: "A" },
    ]);
    expect(normalizeFaqItems([{ question: "Q" }])).toBeNull();
  });

  it("parses howto list items from html", () => {
    const steps = howToHtmlToSteps("<ul><li>One</li><li>Two</li></ul>");
    expect(steps).toEqual([
      { name: "Step 1", text: "One" },
      { name: "Step 2", text: "Two" },
    ]);
  });

  it("strips html tags", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });
});
