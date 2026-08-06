import "dotenv/config";

import { and, eq } from "drizzle-orm";
import { users, categories, categoryTranslations } from "./schema";

async function seed() {
  console.log("🌱 Starting database seed...");

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set in .env file");
    console.error("💡 Please set DATABASE_URL in your .env file");
    process.exit(1);
  }

  console.log("✅ DATABASE_URL found");

  // Important: load db module after env is available to avoid dummy fallback connection
  const { db } = await import("./index");

  try {
    // 1. Create system user for promocodes.createdById FK (or get existing)
    console.log("👤 Creating system user...");

    const defaultAdminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";

    // Check if system user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, defaultAdminEmail))
      .limit(1);

    let adminUser;
    if (existingUser) {
      console.log("ℹ️  System user already exists, using existing user");
      adminUser = existingUser;
    } else {
      [adminUser] = await db
        .insert(users)
        .values({
          email: defaultAdminEmail,
          // Placeholder — admin auth UI removed; kept for promocodes.createdById FK
          password: "unused-no-login",
          role: "admin",
        })
        .returning();

      console.log("✅ System user created:", adminUser.email);
    }

    // Silence unused variable if only used for FK logging
    void adminUser;

    // 2. Create or update Programming & IT Services category
    console.log("📁 Creating or updating Programming & IT Services category...");

    const [existingCategoryTranslation] = await db
      .select({ categoryId: categoryTranslations.categoryId })
      .from(categoryTranslations)
      .where(
        and(
          eq(categoryTranslations.language, "uz"),
          eq(categoryTranslations.slug, "dasturlash-va-it-xizmatlari")
        )
      )
      .limit(1);

    let programmingCategoryId = existingCategoryTranslation?.categoryId;

    if (!programmingCategoryId) {
      const [newCategory] = await db
        .insert(categories)
        .values({
          imageUrl: null,
          sortOrder: 7,
          isActive: true,
        })
        .returning({ id: categories.id });

      programmingCategoryId = newCategory.id;
      console.log("✅ Category created:", programmingCategoryId);
    } else {
      await db
        .update(categories)
        .set({
          imageUrl: null,
          sortOrder: 7,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, programmingCategoryId));

      console.log("ℹ️  Category already exists, using existing category:", programmingCategoryId);
    }

    // 3. Upsert category translations
    console.log("🌍 Creating category translations...");

    if (!programmingCategoryId) {
      throw new Error("Failed to create or load Programming & IT Services category id");
    }

    await db
      .delete(categoryTranslations)
      .where(eq(categoryTranslations.categoryId, programmingCategoryId));

    await db.insert(categoryTranslations).values([
      {
        categoryId: programmingCategoryId,
        language: "uz",
        name: "Dasturlash va IT xizmatlari",
        slug: "dasturlash-va-it-xizmatlari",
        description:
          "Dasturlash, sun'iy intellekt, onlayn servislar va IT platformalar uchun chegirmalar hamda maxsus takliflar.",
        metaTitle: "Dasturlash va IT xizmatlari uchun promokodlar",
        metaDescription:
          "Dasturlash, IT xizmatlari, sun'iy intellekt va onlayn platformalar uchun eng so'nggi promokodlar va chegirmalar.",
      },
      {
        categoryId: programmingCategoryId,
        language: "ru",
        name: "Программирование и IT-услуги",
        slug: "programmirovanie-i-it-uslugi",
        description:
          "Скидки и специальные предложения на программирование, ИИ, онлайн-сервисы и IT-платформы.",
        metaTitle: "Промокоды на программирование и IT-сервисы",
        metaDescription: "Бонусы и промокоды для IT-сервисов, платформ программирования и ИИ.",
      },
      {
        categoryId: programmingCategoryId,
        language: "en",
        name: "Programming & IT Services",
        slug: "programming-it-services",
        description:
          "Discounts and special offers on programming, AI, online services, and IT platforms.",
        metaTitle: "Programming & IT Services Promocodes",
        metaDescription:
          "Promo codes and bonuses for IT services, programming platforms, and AI tools.",
      },
    ]);

    console.log("✅ Category translations created");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => {
    console.log("✅ Seed script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script error:", error);
    process.exit(1);
  });
