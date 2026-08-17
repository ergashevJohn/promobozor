import { describe, expect, it } from "vitest";
import { getBlogAuthorSchema } from "./blog-author";

describe("blog article author schema", () => {
  it.each([
    ["uz", "Jahongir Ergashev"],
    ["ru", "Джахонгир Эргашев"],
    ["en", "Jahongir Ergashev"],
  ])("links the %s article author to the locale About person entity", (locale, name) => {
    expect(
      getBlogAuthorSchema({
        baseUrl: "https://www.promobozor.uz",
        locale,
        name,
      })
    ).toEqual({
      "@type": "Person",
      "@id": `https://www.promobozor.uz/${locale}/about#person`,
      name,
      url: `https://www.promobozor.uz/${locale}/about`,
    });
  });
});
