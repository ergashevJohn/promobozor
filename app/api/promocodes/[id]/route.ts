import { NextRequest, NextResponse } from "next/server";
import {
  db,
  promocodes,
  promocodeTranslations,
  stores,
  storeTranslations,
  categories,
  categoryTranslations,
  brands,
  brandTranslations,
} from "@/lib/db";
import { isValidLanguage } from "@/lib/i18n";
import { eq, and } from "drizzle-orm";

// Force dynamic rendering for API routes (Next.js 15+)
// API routes are always dynamic and cannot be statically rendered
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Explicitly set runtime

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const lang = searchParams.get("lang") || "uz";

    if (!isValidLanguage(lang)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    const langValue = lang as "uz" | "ru" | "en";

    const result = await db
      .select({
        promocode: promocodes,
        promocodeTranslation: promocodeTranslations,
        store: stores,
        storeTranslation: storeTranslations,
        category: categories,
        categoryTranslation: categoryTranslations,
        brand: brands,
        brandTranslation: brandTranslations,
      })
      .from(promocodes)
      .leftJoin(
        promocodeTranslations,
        and(
          eq(promocodeTranslations.promocodeId, promocodes.id),
          eq(promocodeTranslations.language, langValue)
        )
      )
      .leftJoin(stores, eq(stores.id, promocodes.storeId))
      .leftJoin(
        storeTranslations,
        and(eq(storeTranslations.storeId, stores.id), eq(storeTranslations.language, langValue))
      )
      .leftJoin(categories, eq(categories.id, promocodes.categoryId))
      .leftJoin(
        categoryTranslations,
        and(
          eq(categoryTranslations.categoryId, categories.id),
          eq(categoryTranslations.language, langValue)
        )
      )
      .leftJoin(brands, eq(brands.id, promocodes.brandId))
      .leftJoin(
        brandTranslations,
        and(eq(brandTranslations.brandId, brands.id), eq(brandTranslations.language, langValue))
      )
      .where(eq(promocodes.id, id));

    if (result.length === 0) {
      return NextResponse.json({ error: "Promocode not found" }, { status: 404 });
    }

    const row = result[0];
    const promocode = {
      ...row.promocode,
      translations: row.promocodeTranslation ? [row.promocodeTranslation] : [],
      store: row.store
        ? {
            ...row.store,
            translations: row.storeTranslation ? [row.storeTranslation] : [],
          }
        : null,
      brand: row.brand
        ? {
            ...row.brand,
            translations: row.brandTranslation ? [row.brandTranslation] : [],
          }
        : null,
      category: row.category
        ? {
            ...row.category,
            translations: row.categoryTranslation ? [row.categoryTranslation] : [],
          }
        : null,
    };

    return NextResponse.json(promocode);
  } catch {
    return NextResponse.json({ error: "Failed to fetch promocode" }, { status: 500 });
  }
}
