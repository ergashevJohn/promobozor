import { getBaseUrl } from "@/lib/metadata";
import { MetadataRoute } from "next";

import {
  brands,
  brandTranslations,
  categories,
  categoryTranslations,
  db,
  promocodes,
  promocodeTranslations,
  stores,
  storeTranslations,
} from "@/lib/db";
import { and, eq, gt, isNull, lte, or } from "drizzle-orm";

export async function generateSitemaps() {
  // Next.js will generate 3 sitemaps: /sitemap/uz.xml, /sitemap/ru.xml, /sitemap/en.xml
  return [{ id: "uz" }, { id: "ru" }, { id: "en" }];
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();
  const locale = (await id) as "uz" | "ru" | "en";
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Homepage entry
  sitemapEntries.push({
    url: `${baseUrl}/${locale}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1.0,
    alternates: {
      languages: {
        "x-default": `${baseUrl}/uz`,
        uz: `${baseUrl}/uz`,
        ru: `${baseUrl}/ru`,
        en: `${baseUrl}/en`,
      },
    },
  });

  // List pages
  const listPages = ["stores", "categories", "brands", "promocodes", "blog"];
  for (const page of listPages) {
    sitemapEntries.push({
      url: `${baseUrl}/${locale}/${page}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: {
          "x-default": `${baseUrl}/uz/${page}`,
          uz: `${baseUrl}/uz/${page}`,
          ru: `${baseUrl}/ru/${page}`,
          en: `${baseUrl}/en/${page}`,
        },
      },
    });
  }

  // Static pages
  sitemapEntries.push({
    url: `${baseUrl}/${locale}/faq`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  });

  sitemapEntries.push({
    url: `${baseUrl}/${locale}/privacy`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  });

  sitemapEntries.push({
    url: `${baseUrl}/${locale}/terms`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  });

  sitemapEntries.push({
    url: `${baseUrl}/${locale}/contact`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  });

  sitemapEntries.push({
    url: `${baseUrl}/${locale}/about`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  });

  sitemapEntries.push({
    url: `${baseUrl}/${locale}/how-we-verify-promocodes`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
    alternates: {
      languages: {
        "x-default": `${baseUrl}/uz/how-we-verify-promocodes`,
        uz: `${baseUrl}/uz/how-we-verify-promocodes`,
        ru: `${baseUrl}/ru/how-we-verify-promocodes`,
        en: `${baseUrl}/en/how-we-verify-promocodes`,
      },
    },
  });

  // Blog guides (static editorial content)
  try {
    const { getBlogPosts } = await import("@/lib/blog");
    const posts = getBlogPosts();
    for (const post of posts) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: "weekly",
        priority: 0.65,
        alternates: {
          languages: {
            "x-default": `${baseUrl}/uz/blog/${post.slug}`,
            uz: `${baseUrl}/uz/blog/${post.slug}`,
            ru: `${baseUrl}/ru/blog/${post.slug}`,
            en: `${baseUrl}/en/blog/${post.slug}`,
          },
        },
      });
    }
  } catch (error) {
    console.error("Error adding blog posts to sitemap:", error);
  }

  // Dynamic pages - fetch all entity translations in parallel
  try {
    const [
      allStoreTranslations,
      allCategoryTranslations,
      allBrandTranslations,
      allPromocodeTranslations,
    ] = await Promise.all([
      db
        .select({
          storeId: storeTranslations.storeId,
          language: storeTranslations.language,
          slug: storeTranslations.slug,
          updatedAt: stores.updatedAt,
        })
        .from(storeTranslations)
        .innerJoin(stores, eq(storeTranslations.storeId, stores.id))
        .where(eq(stores.isActive, true)),
      db
        .select({
          categoryId: categoryTranslations.categoryId,
          language: categoryTranslations.language,
          slug: categoryTranslations.slug,
          updatedAt: categories.updatedAt,
        })
        .from(categoryTranslations)
        .innerJoin(categories, eq(categoryTranslations.categoryId, categories.id))
        .where(eq(categories.isActive, true)),
      db
        .select({
          brandId: brandTranslations.brandId,
          language: brandTranslations.language,
          slug: brandTranslations.slug,
          updatedAt: brands.updatedAt,
        })
        .from(brandTranslations)
        .innerJoin(brands, eq(brandTranslations.brandId, brands.id))
        .where(eq(brands.isActive, true)),
      db
        .select({
          promocodeId: promocodeTranslations.promocodeId,
          language: promocodeTranslations.language,
          slug: promocodeTranslations.slug,
          updatedAt: promocodes.updatedAt,
        })
        .from(promocodeTranslations)
        .innerJoin(promocodes, eq(promocodeTranslations.promocodeId, promocodes.id))
        .where(
          and(
            eq(promocodes.status, "active"),
            or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, new Date())),
            or(isNull(promocodes.startsAt), lte(promocodes.startsAt, new Date()))
          )
        ),
    ]);

    // Store pages
    const storeMap = new Map<string, { language: string; slug: string; updatedAt: Date }[]>();
    allStoreTranslations.forEach((row) => {
      if (!storeMap.has(row.storeId)) storeMap.set(row.storeId, []);
      const existing = storeMap.get(row.storeId);
      if (existing) {
        existing.push({ language: row.language, slug: row.slug, updatedAt: row.updatedAt });
      }
    });

    for (const [, translations] of storeMap.entries()) {
      const currentTranslation = translations.find((t) => t.language === locale);
      if (!currentTranslation) continue;

      const languages: Record<string, string> = {};
      translations.forEach((t) => {
        languages[t.language] = `${baseUrl}/${t.language}/store/${t.slug}`;
      });

      const uzTranslation = translations.find((t) => t.language === "uz");
      if (uzTranslation) {
        languages["x-default"] = `${baseUrl}/uz/store/${uzTranslation.slug}`;
      }

      sitemapEntries.push({
        url: `${baseUrl}/${locale}/store/${currentTranslation.slug}`,
        lastModified: currentTranslation.updatedAt || now,
        changeFrequency: "daily",
        priority: 0.7,
        alternates: { languages },
      });
    }

    // Category pages
    const categoryMap = new Map<string, { language: string; slug: string; updatedAt: Date }[]>();
    allCategoryTranslations.forEach((row) => {
      if (!categoryMap.has(row.categoryId)) categoryMap.set(row.categoryId, []);
      const existing = categoryMap.get(row.categoryId);
      if (existing) {
        existing.push({ language: row.language, slug: row.slug, updatedAt: row.updatedAt });
      }
    });

    for (const [, translations] of categoryMap.entries()) {
      const currentTranslation = translations.find((t) => t.language === locale);
      if (!currentTranslation) continue;

      const languages: Record<string, string> = {};
      translations.forEach((t) => {
        languages[t.language] = `${baseUrl}/${t.language}/category/${t.slug}`;
      });

      const uzTranslation = translations.find((t) => t.language === "uz");
      if (uzTranslation) {
        languages["x-default"] = `${baseUrl}/uz/category/${uzTranslation.slug}`;
      }

      sitemapEntries.push({
        url: `${baseUrl}/${locale}/category/${currentTranslation.slug}`,
        lastModified: currentTranslation.updatedAt || now,
        changeFrequency: "daily",
        priority: 0.7,
        alternates: { languages },
      });
    }

    // Brand pages
    const brandMap = new Map<string, { language: string; slug: string; updatedAt: Date }[]>();
    allBrandTranslations.forEach((row) => {
      if (!brandMap.has(row.brandId)) brandMap.set(row.brandId, []);
      const existing = brandMap.get(row.brandId);
      if (existing) {
        existing.push({ language: row.language, slug: row.slug, updatedAt: row.updatedAt });
      }
    });

    for (const [, translations] of brandMap.entries()) {
      const currentTranslation = translations.find((t) => t.language === locale);
      if (!currentTranslation) continue;

      const languages: Record<string, string> = {};
      translations.forEach((t) => {
        languages[t.language] = `${baseUrl}/${t.language}/brand/${t.slug}`;
      });

      const uzTranslation = translations.find((t) => t.language === "uz");
      if (uzTranslation) {
        languages["x-default"] = `${baseUrl}/uz/brand/${uzTranslation.slug}`;
      }

      sitemapEntries.push({
        url: `${baseUrl}/${locale}/brand/${currentTranslation.slug}`,
        lastModified: currentTranslation.updatedAt || now,
        changeFrequency: "daily",
        priority: 0.7,
        alternates: { languages },
      });
    }

    // Promocode pages (only active and not expired)
    const promocodeMap = new Map<string, { language: string; slug: string; updatedAt: Date }[]>();
    allPromocodeTranslations.forEach((row) => {
      if (!promocodeMap.has(row.promocodeId)) promocodeMap.set(row.promocodeId, []);
      const existing = promocodeMap.get(row.promocodeId);
      if (existing) {
        existing.push({ language: row.language, slug: row.slug, updatedAt: row.updatedAt });
      }
    });

    for (const [, translations] of promocodeMap.entries()) {
      const currentTranslation = translations.find((t) => t.language === locale);
      if (!currentTranslation) continue;

      const languages: Record<string, string> = {};
      translations.forEach((t) => {
        languages[t.language] = `${baseUrl}/${t.language}/promocode/${t.slug}`;
      });

      const uzTranslation = translations.find((t) => t.language === "uz");
      if (uzTranslation) {
        languages["x-default"] = `${baseUrl}/uz/promocode/${uzTranslation.slug}`;
      }

      sitemapEntries.push({
        url: `${baseUrl}/${locale}/promocode/${currentTranslation.slug}`,
        lastModified: currentTranslation.updatedAt || now,
        changeFrequency: "daily",
        priority: 0.6,
        alternates: { languages },
      });
    }
  } catch (error) {
    console.error("Error fetching dynamic pages for sitemap:", error);
  }

  return sitemapEntries;
}

export const revalidate = 3600; // Update sitemap every hour
