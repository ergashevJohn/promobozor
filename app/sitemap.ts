import { getBaseUrl } from "@/lib/metadata";
import {
  getEntityPath,
  getListPath,
  type ListType,
  type Locale as RouteLocale,
} from "@/lib/routes";
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
import { getIndexableCollections } from "@/lib/collections";
import { getNewPromocodes } from "@/lib/queries/new-promocodes";
import {
  getCollectionPath,
  getCollectionsPath,
  getNewPromocodesPath,
  getPartnersPath,
} from "@/lib/routes";

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

  sitemapEntries.push({
    url: `${baseUrl}${getPartnersPath(locale)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  });

  try {
    const [newPromocodes, collections] = await Promise.all([
      getNewPromocodes(locale),
      getIndexableCollections(locale),
    ]);
    if (newPromocodes.total > 0) {
      sitemapEntries.push({
        url: `${baseUrl}${getNewPromocodesPath(locale)}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
    if (collections.length > 0) {
      sitemapEntries.push({
        url: `${baseUrl}${getCollectionsPath(locale)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.65,
      });
      for (const key of collections) {
        sitemapEntries.push({
          url: `${baseUrl}${getCollectionPath(locale, key)}`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.65,
        });
      }
    }
  } catch (error) {
    console.error("Error adding new offers and collections to sitemap:", error);
  }

  // List pages (localized segments)
  const listPages: Array<ListType | "blog"> = [
    "stores",
    "categories",
    "brands",
    "promocodes",
    "blog",
  ];
  for (const page of listPages) {
    const pathFor = (loc: RouteLocale) =>
      page === "blog" ? `/${loc}/blog` : getListPath(loc, page);
    sitemapEntries.push({
      url: `${baseUrl}${pathFor(locale)}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: {
          "x-default": `${baseUrl}${pathFor("uz")}`,
          uz: `${baseUrl}${pathFor("uz")}`,
          ru: `${baseUrl}${pathFor("ru")}`,
          en: `${baseUrl}${pathFor("en")}`,
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

  // Blog guides (static editorial content, per-locale slugs)
  try {
    const { getBlogLanguageAlternates, getBlogPosts } = await import("@/lib/blog");
    const posts = getBlogPosts();
    for (const post of posts) {
      const alternates = getBlogLanguageAlternates(post);
      sitemapEntries.push({
        url: `${baseUrl}${alternates[locale]}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: "weekly",
        priority: 0.65,
        alternates: {
          languages: {
            "x-default": `${baseUrl}${alternates.uz}`,
            uz: `${baseUrl}${alternates.uz}`,
            ru: `${baseUrl}${alternates.ru}`,
            en: `${baseUrl}${alternates.en}`,
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
        languages[t.language] =
          `${baseUrl}${getEntityPath(t.language as RouteLocale, "store", t.slug)}`;
      });

      const uzTranslation = translations.find((t) => t.language === "uz");
      if (uzTranslation) {
        languages["x-default"] = `${baseUrl}${getEntityPath("uz", "store", uzTranslation.slug)}`;
      }

      sitemapEntries.push({
        url: `${baseUrl}${getEntityPath(locale, "store", currentTranslation.slug)}`,
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
        languages[t.language] =
          `${baseUrl}${getEntityPath(t.language as RouteLocale, "category", t.slug)}`;
      });

      const uzTranslation = translations.find((t) => t.language === "uz");
      if (uzTranslation) {
        languages["x-default"] = `${baseUrl}${getEntityPath("uz", "category", uzTranslation.slug)}`;
      }

      sitemapEntries.push({
        url: `${baseUrl}${getEntityPath(locale, "category", currentTranslation.slug)}`,
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
        languages[t.language] =
          `${baseUrl}${getEntityPath(t.language as RouteLocale, "brand", t.slug)}`;
      });

      const uzTranslation = translations.find((t) => t.language === "uz");
      if (uzTranslation) {
        languages["x-default"] = `${baseUrl}${getEntityPath("uz", "brand", uzTranslation.slug)}`;
      }

      sitemapEntries.push({
        url: `${baseUrl}${getEntityPath(locale, "brand", currentTranslation.slug)}`,
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
        languages[t.language] =
          `${baseUrl}${getEntityPath(t.language as RouteLocale, "promocode", t.slug)}`;
      });

      const uzTranslation = translations.find((t) => t.language === "uz");
      if (uzTranslation) {
        languages["x-default"] =
          `${baseUrl}${getEntityPath("uz", "promocode", uzTranslation.slug)}`;
      }

      sitemapEntries.push({
        url: `${baseUrl}${getEntityPath(locale, "promocode", currentTranslation.slug)}`,
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
