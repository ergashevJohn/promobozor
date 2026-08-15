import { describe, expect, it } from "vitest";
import {
  BLOG_LOCALES,
  blogPosts,
  findBlogPostByAnySlug,
  getBlogLanguageAlternates,
  getBlogSlug,
  getBlogStaticParams,
  getTranslatedBlogSlug,
  resolveBlogPost,
} from "./blog";

describe("blog localized slugs", () => {
  it("resolves each locale by its own slug", () => {
    const uz = resolveBlogPost("promokod-qanday-ishlatiladi", "uz");
    const ru = resolveBlogPost("kak-ispolzovat-promokod", "ru");
    const en = resolveBlogPost("how-to-use-a-promocode", "en");

    expect(uz?.needsRedirect).toBe(false);
    expect(ru?.needsRedirect).toBe(false);
    expect(en?.needsRedirect).toBe(false);
    expect(uz?.post.legacySlug).toBe(ru?.post.legacySlug);
    expect(en?.post.legacySlug).toBe("promokod-qanday-ishlatiladi");
  });

  it("redirects legacy / cross-locale slugs to the canonical locale slug", () => {
    const fromLegacyOnRu = resolveBlogPost("promokod-qanday-ishlatiladi", "ru");
    expect(fromLegacyOnRu).not.toBeNull();
    expect(fromLegacyOnRu?.needsRedirect).toBe(true);
    expect(fromLegacyOnRu?.canonicalSlug).toBe("kak-ispolzovat-promokod");

    const uzSlugOnEn = resolveBlogPost("yandex-eats-promokod-2026", "en");
    expect(uzSlugOnEn?.needsRedirect).toBe(true);
    expect(uzSlugOnEn?.canonicalSlug).toBe("yandex-eats-promocode-2026");
  });

  it("maps slugs across locales for language switch", () => {
    expect(getTranslatedBlogSlug("yandex-eats-promokod-2026", "uz", "ru")).toBe(
      "promokod-yandex-eats-2026"
    );
    expect(getTranslatedBlogSlug("promokod-yandex-eats-2026", "ru", "en")).toBe(
      "yandex-eats-promocode-2026"
    );
    expect(getTranslatedBlogSlug("missing-post", "uz", "ru")).toBeNull();
  });

  it("builds language alternates with distinct per-locale slugs", () => {
    const post = findBlogPostByAnySlug("uzum-market-promokod-qollanma");
    expect(post).toBeDefined();
    if (!post) return;

    expect(getBlogLanguageAlternates(post)).toEqual({
      uz: "/uz/blog/uzum-market-promokod-qollanma",
      ru: "/ru/blog/promokod-uzum-market-instruktsiya",
      en: "/en/blog/uzum-market-promocode-guide",
    });
    expect(getBlogSlug(post, "ru")).toBe("promokod-uzum-market-instruktsiya");
  });

  it("keeps locale slugs unique within each language", () => {
    for (const locale of BLOG_LOCALES) {
      const slugs = blogPosts.map((post) => post.slug[locale]);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("generates static params for every locale slug", () => {
    const params = getBlogStaticParams();
    expect(params).toHaveLength(blogPosts.length * BLOG_LOCALES.length);
    expect(params).toContainEqual({ locale: "ru", slug: "kak-ispolzovat-promokod" });
    expect(params).toContainEqual({ locale: "en", slug: "click-and-payme-promocodes" });
  });

  it("resolves related brand slugs per locale", () => {
    const post = findBlogPostByAnySlug("yandex-eats-promokod-2026");
    expect(post?.relatedBrandSlug?.uz).toBe("yandex-eats");
    expect(post?.relatedBrandSlug?.ru).toBe("yandex-eda");
    expect(post?.relatedBrandSlug?.en).toBe("yandex-eats");
  });
});
