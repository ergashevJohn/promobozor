import { getTranslatedBlogSlug, type BlogLocale } from "@/lib/blog";
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
import { checkRateLimit, RateLimits } from "@/lib/rate-limit";
import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type EntityType = "promocode" | "store" | "brand" | "category" | "blog";
type Language = "uz" | "ru" | "en";

const MAX_SLUG_LENGTH = 200;

export async function GET(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(request, RateLimits.api);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetTime),
        },
      }
    );
  }

  const { searchParams } = request.nextUrl;
  const entityType = searchParams.get("entityType") as EntityType | null;
  const currentSlug = searchParams.get("currentSlug");
  const currentLanguage = searchParams.get("currentLanguage") as Language | null;
  const targetLanguage = searchParams.get("targetLanguage") as Language | null;

  // Validate required parameters
  if (!entityType || !currentSlug || !currentLanguage || !targetLanguage) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  if (currentSlug.length > MAX_SLUG_LENGTH) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  // Validate entity type
  if (!["promocode", "store", "brand", "category", "blog"].includes(entityType)) {
    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  }

  // Validate languages
  const validLanguages: Language[] = ["uz", "ru", "en"];
  if (!validLanguages.includes(currentLanguage) || !validLanguages.includes(targetLanguage)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  // Same language - return current slug
  if (currentLanguage === targetLanguage) {
    return NextResponse.json({ slug: currentSlug });
  }

  // Static editorial blog posts — resolve without DB
  if (entityType === "blog") {
    const targetSlug = getTranslatedBlogSlug(
      currentSlug,
      currentLanguage as BlogLocale,
      targetLanguage as BlogLocale
    );
    if (!targetSlug) {
      return NextResponse.json({ slug: null }, { status: 404 });
    }
    return NextResponse.json({ slug: targetSlug });
  }

  try {
    let entityId: string | null = null;

    const now = new Date();

    // Step 1: Find entity ID by current slug and current language
    switch (entityType) {
      case "promocode": {
        const [promocodeTranslation] = await db
          .select({ promocodeId: promocodeTranslations.promocodeId })
          .from(promocodeTranslations)
          .innerJoin(promocodes, eq(promocodeTranslations.promocodeId, promocodes.id))
          .leftJoin(stores, eq(promocodes.storeId, stores.id))
          .where(
            and(
              eq(promocodeTranslations.slug, currentSlug),
              eq(promocodeTranslations.language, currentLanguage),
              eq(promocodes.status, "active"),
              or(isNull(promocodes.storeId), eq(stores.isActive, true)),
              or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now)),
              or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now))
            )
          )
          .limit(1);
        entityId = promocodeTranslation?.promocodeId ?? null;
        break;
      }

      case "store": {
        const [storeTranslation] = await db
          .select({ storeId: storeTranslations.storeId })
          .from(storeTranslations)
          .innerJoin(stores, eq(storeTranslations.storeId, stores.id))
          .where(
            and(
              eq(storeTranslations.slug, currentSlug),
              eq(storeTranslations.language, currentLanguage),
              eq(stores.isActive, true)
            )
          )
          .limit(1);
        entityId = storeTranslation?.storeId ?? null;
        break;
      }

      case "brand": {
        const [brandTranslation] = await db
          .select({ brandId: brandTranslations.brandId })
          .from(brandTranslations)
          .innerJoin(brands, eq(brandTranslations.brandId, brands.id))
          .where(
            and(
              eq(brandTranslations.slug, currentSlug),
              eq(brandTranslations.language, currentLanguage),
              eq(brands.isActive, true)
            )
          )
          .limit(1);
        entityId = brandTranslation?.brandId ?? null;
        break;
      }

      case "category": {
        const [categoryTranslation] = await db
          .select({ categoryId: categoryTranslations.categoryId })
          .from(categoryTranslations)
          .innerJoin(categories, eq(categoryTranslations.categoryId, categories.id))
          .where(
            and(
              eq(categoryTranslations.slug, currentSlug),
              eq(categoryTranslations.language, currentLanguage),
              eq(categories.isActive, true)
            )
          )
          .limit(1);
        entityId = categoryTranslation?.categoryId ?? null;
        break;
      }

      default: {
        const _exhaustive: never = entityType;
        return NextResponse.json(
          { error: `Unsupported entity type: ${_exhaustive}` },
          { status: 400 }
        );
      }
    }

    // Entity not found in current language
    if (!entityId) {
      return NextResponse.json({ slug: null }, { status: 404 });
    }

    // Step 2: Find slug in target language
    let targetSlug: string | null = null;

    switch (entityType) {
      case "promocode": {
        const [translation] = await db
          .select({ slug: promocodeTranslations.slug })
          .from(promocodeTranslations)
          .where(
            and(
              eq(promocodeTranslations.promocodeId, entityId),
              eq(promocodeTranslations.language, targetLanguage)
            )
          )
          .limit(1);
        targetSlug = translation?.slug ?? null;
        break;
      }

      case "store": {
        const [translation] = await db
          .select({ slug: storeTranslations.slug })
          .from(storeTranslations)
          .where(
            and(
              eq(storeTranslations.storeId, entityId),
              eq(storeTranslations.language, targetLanguage)
            )
          )
          .limit(1);
        targetSlug = translation?.slug ?? null;
        break;
      }

      case "brand": {
        const [translation] = await db
          .select({ slug: brandTranslations.slug })
          .from(brandTranslations)
          .where(
            and(
              eq(brandTranslations.brandId, entityId),
              eq(brandTranslations.language, targetLanguage)
            )
          )
          .limit(1);
        targetSlug = translation?.slug ?? null;
        break;
      }

      case "category": {
        const [translation] = await db
          .select({ slug: categoryTranslations.slug })
          .from(categoryTranslations)
          .where(
            and(
              eq(categoryTranslations.categoryId, entityId),
              eq(categoryTranslations.language, targetLanguage)
            )
          )
          .limit(1);
        targetSlug = translation?.slug ?? null;
        break;
      }

      default: {
        const _exhaustive: never = entityType;
        return NextResponse.json(
          { error: `Unsupported entity type: ${_exhaustive}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ slug: targetSlug });
  } catch (error) {
    console.error("Error fetching translation slug:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
