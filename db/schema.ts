import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const languageEnum = pgEnum("language", ["uz", "ru", "en"]);
export const discountTypeEnum = pgEnum("discount_type", ["percent", "amount"]);
export const currencyEnum = pgEnum("currency", ["UZS", "USD", "EUR"]);
export const promocodeStatusEnum = pgEnum("promocode_status", [
  "draft",
  "active",
  "expired",
  "disabled",
]);
export const promocodeTypeEnum = pgEnum("promocode_type", ["code", "link"]);
export const userRoleEnum = pgEnum("user_role", ["superadmin", "admin"]);
export const activityTypeEnum = pgEnum("activity_type", ["view", "copy", "like", "dislike"]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stores = pgTable(
  "stores",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    logoUrl: text("logo_url"),
    websiteUrl: text("website_url"),
    priority: integer("priority").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Composite index for stores listing query
    isActivePriorityCreatedIdx: index("stores_is_active_priority_created_idx").on(
      table.isActive,
      table.priority,
      table.createdAt
    ),
    isActiveIdx: index("stores_is_active_idx").on(table.isActive),
  })
);

export const storeTranslations = pgTable(
  "store_translations",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    language: languageEnum("language").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: varchar("meta_description", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    storeLanguageUnique: unique("store_language_unique").on(table.storeId, table.language),
    languageSlugUnique: unique("language_slug_unique").on(table.language, table.slug),

    // Indexes for query optimization
    storeIdLanguageIdx: index("store_translations_store_id_language_idx").on(
      table.storeId,
      table.language
    ),
    languageSlugIdx: index("store_translations_language_slug_idx").on(table.language, table.slug),
  })
);

export const categories = pgTable(
  "categories",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    parentId: text("parent_id"),
    iconName: text("icon_name"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Composite index for categories listing query
    isActiveSortOrderIdx: index("categories_is_active_sort_order_idx").on(
      table.isActive,
      table.sortOrder
    ),
    isActiveIdx: index("categories_is_active_idx").on(table.isActive),
  })
);

export const categoryTranslations = pgTable(
  "category_translations",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    language: languageEnum("language").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: varchar("meta_description", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    categoryLanguageUnique: unique("category_language_unique").on(table.categoryId, table.language),
    languageSlugUnique: unique("category_language_slug_unique").on(table.language, table.slug),

    // Indexes for query optimization
    categoryIdLanguageIdx: index("category_translations_category_id_language_idx").on(
      table.categoryId,
      table.language
    ),
    languageSlugIdx: index("category_translations_language_slug_idx").on(
      table.language,
      table.slug
    ),
  })
);

export const brands = pgTable(
  "brands",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    imageUrl: text("image_url"),
    websiteUrl: text("website_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Composite index for brands listing query
    isActiveCreatedIdx: index("brands_is_active_created_idx").on(table.isActive, table.createdAt),
    isActiveIdx: index("brands_is_active_idx").on(table.isActive),
  })
);

export const brandTranslations = pgTable(
  "brand_translations",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    language: languageEnum("language").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: varchar("meta_description", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    brandLanguageUnique: unique("brand_language_unique").on(table.brandId, table.language),
    languageSlugUnique: unique("brand_language_slug_unique").on(table.language, table.slug),

    // Indexes for query optimization
    brandIdLanguageIdx: index("brand_translations_brand_id_language_idx").on(
      table.brandId,
      table.language
    ),
    languageSlugIdx: index("brand_translations_language_slug_idx").on(table.language, table.slug),
  })
);

export const promocodes = pgTable(
  "promocodes",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    type: promocodeTypeEnum("type").notNull().default("code"),
    code: varchar("code", { length: 255 }).unique(),
    link: text("link"),
    discountType: discountTypeEnum("discount_type").notNull(),
    discountValue: integer("discount_value").notNull(),
    currency: currencyEnum("currency").notNull().default("UZS"),
    originalPrice: integer("original_price"),
    imageUrl: text("image_url"),
    storeId: text("store_id").references(() => stores.id, { onDelete: "set null" }),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    brandId: text("brand_id").references(() => brands.id, { onDelete: "set null" }),
    status: promocodeStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    order: integer("order").notNull().unique(),
    viewsCount: integer("views_count").notNull().default(0),
    copyCount: integer("copy_count").notNull().default(0),
    likesCount: integer("likes_count").notNull().default(0),
    dislikesCount: integer("dislikes_count").notNull().default(0),
    startsAt: timestamp("starts_at"),
    expiresAt: timestamp("expires_at"),
    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Single column indexes (existing)
    codeIdx: index("promocodes_code_idx").on(table.code),
    storeIdIdx: index("promocodes_store_id_idx").on(table.storeId),
    categoryIdIdx: index("promocodes_category_id_idx").on(table.categoryId),
    brandIdIdx: index("promocodes_brand_id_idx").on(table.brandId),
    statusIdx: index("promocodes_status_idx").on(table.status),
    featuredIdx: index("promocodes_featured_idx").on(table.isFeatured),
    orderIdx: index("promocodes_order_idx").on(table.order),
    createdByIdIdx: index("promocodes_created_by_id_idx").on(table.createdById),

    // Composite indexes for query optimization
    // Main query: status + isFeatured + expiresAt + startsAt + createdAt
    statusFeaturedExpiresStartsCreatedIdx: index(
      "promocodes_status_featured_expires_starts_created_idx"
    ).on(table.status, table.isFeatured, table.expiresAt, table.startsAt, table.createdAt),

    // Store filter: storeId + status + expiresAt + startsAt
    storeStatusExpiresStartsIdx: index("promocodes_store_status_expires_starts_idx").on(
      table.storeId,
      table.status,
      table.expiresAt,
      table.startsAt
    ),

    // Category filter: categoryId + status + expiresAt + startsAt
    categoryStatusExpiresStartsIdx: index("promocodes_category_status_expires_starts_idx").on(
      table.categoryId,
      table.status,
      table.expiresAt,
      table.startsAt
    ),

    // Brand filter: brandId + status + expiresAt + startsAt
    brandStatusExpiresStartsIdx: index("promocodes_brand_status_expires_starts_idx").on(
      table.brandId,
      table.status,
      table.expiresAt,
      table.startsAt
    ),

    // Popular sort: status + isFeatured + copyCount + createdAt
    statusFeaturedCopyCreatedIdx: index("promocodes_status_featured_copy_created_idx").on(
      table.status,
      table.isFeatured,
      table.copyCount,
      table.createdAt
    ),

    // Discount sort: status + isFeatured + discountValue + createdAt
    statusFeaturedDiscountCreatedIdx: index("promocodes_status_featured_discount_created_idx").on(
      table.status,
      table.isFeatured,
      table.discountValue,
      table.createdAt
    ),

    // Ending sort: status + isFeatured + expiresAt + createdAt
    statusFeaturedExpiresCreatedIdx: index("promocodes_status_featured_expires_created_idx").on(
      table.status,
      table.isFeatured,
      table.expiresAt,
      table.createdAt
    ),

    // Partial indexes for active promocodes only (most common query)
    // These are smaller and faster since they only include active promocodes
    activeStatusIdx: index("promocodes_active_status_idx")
      .on(table.status)
      .where(sql`status = 'active'`),
    activeStoreIdx: index("promocodes_active_store_idx")
      .on(table.storeId, table.expiresAt)
      .where(sql`status = 'active'`),
    activeCategoryIdx: index("promocodes_active_category_idx")
      .on(table.categoryId, table.expiresAt)
      .where(sql`status = 'active'`),
    activeBrandIdx: index("promocodes_active_brand_idx")
      .on(table.brandId, table.expiresAt)
      .where(sql`status = 'active'`),
  })
);

export const promocodeTranslations = pgTable(
  "promocode_translations",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    promocodeId: text("promocode_id")
      .notNull()
      .references(() => promocodes.id, { onDelete: "cascade" }),
    language: languageEnum("language").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    shortDescription: text("short_description"),
    conditions: text("conditions"),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: varchar("meta_description", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    promocodeLanguageUnique: unique("promocode_language_unique").on(
      table.promocodeId,
      table.language
    ),
    languageSlugUnique: unique("promocode_language_slug_unique").on(table.language, table.slug),

    // Indexes for query optimization
    promocodeIdLanguageIdx: index("promocode_translations_promocode_id_language_idx").on(
      table.promocodeId,
      table.language
    ),
    languageSlugIdx: index("promocode_translations_language_slug_idx").on(
      table.language,
      table.slug
    ),
    // Full-text search index for title (PostgreSQL GIN index)
    titleSearchIdx: index("promocode_translations_title_search_idx").on(table.title),
  })
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    promocodeId: text("promocode_id")
      .notNull()
      .references(() => promocodes.id, { onDelete: "cascade" }),
    activityType: activityTypeEnum("activity_type").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    promocodeIdIdx: index("activity_logs_promocode_id_idx").on(table.promocodeId),
    activityTypeIdx: index("activity_logs_activity_type_idx").on(table.activityType),
    createdAtIdx: index("activity_logs_created_at_idx").on(table.createdAt),
  })
);

export const contacts = pgTable(
  "contacts",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    message: text("message").notNull(),
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("contacts_created_at_idx").on(table.createdAt),
    phoneIdx: index("contacts_phone_idx").on(table.phone),
  })
);

// SEO Redirects - handle legacy URLs and slug changes
export const redirects = pgTable(
  "redirects",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    fromPath: varchar("from_path", { length: 500 }).notNull().unique(), // e.g., "/en/brand/uzum-bank-en"
    toPath: varchar("to_path", { length: 500 }).notNull(), // e.g., "/en/brand/uzum-bank"
    entityType: varchar("entity_type", { length: 20 }).notNull(), // "brand", "store", "category", "promocode"
    statusCode: integer("status_code").notNull().default(301), // 301 or 302
    isActive: boolean("is_active").notNull().default(true),
    hits: integer("hits").notNull().default(0), // Track how many times this redirect was used
    lastHitAt: timestamp("last_hit_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    fromPathIdx: index("redirects_from_path_idx").on(table.fromPath),
    entityTypeIdx: index("redirects_entity_type_idx").on(table.entityType),
    isActiveIdx: index("redirects_is_active_idx").on(table.isActive),
  })
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type StoreTranslation = typeof storeTranslations.$inferSelect;
export type NewStoreTranslation = typeof storeTranslations.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type CategoryTranslation = typeof categoryTranslations.$inferSelect;
export type NewCategoryTranslation = typeof categoryTranslations.$inferInsert;
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
export type BrandTranslation = typeof brandTranslations.$inferSelect;
export type NewBrandTranslation = typeof brandTranslations.$inferInsert;
export type Promocode = typeof promocodes.$inferSelect;
export type NewPromocode = typeof promocodes.$inferInsert;
export type PromocodeTranslation = typeof promocodeTranslations.$inferSelect;
export type NewPromocodeTranslation = typeof promocodeTranslations.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Redirect = typeof redirects.$inferSelect;
export type NewRedirect = typeof redirects.$inferInsert;
