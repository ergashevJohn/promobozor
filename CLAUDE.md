# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application

```bash
npm run dev           # Start development server with .env (local database)
npm run dev:turbo     # Start development server (turbopack mode, faster but experimental)
npm run dev:prod      # Start development server with .env.production (production database)
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
```

**⚠️ IMPORTANT:** `npm run dev:prod` uses production database. Use with caution - changes will affect live data!

### Database Commands

**Development (local):**

```bash
npm run db:generate   # Generate Drizzle migrations from schema.ts
npm run db:migrate    # Apply migrations to database
npm run db:push       # Push schema changes directly (skip migrations)
npm run db:studio     # Open Drizzle Studio for database management
npm run seed          # Seed database with sample data (creates system user for FK)
```

**Production:**

```bash
npm run db:push:prod    # Push schema to production database (.env.production)
npm run db:migrate:prod # Apply migrations to production database
npm run db:studio:prod  # Open Drizzle Studio for production database
npm run seed:prod       # Seed production database with system user
```

**Note:** Production commands use `.env.production` file automatically via `dotenv-cli`.

### Environment Setup

Required environment variables in `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/promocode_db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

**IMPORTANT:** Database secrets should NEVER use `NEXT_PUBLIC_` prefix as this exposes them in browser code.

Seed creates a system user (default email `admin@example.com`, override with `SEED_ADMIN_EMAIL`) used only for `promocodes.createdById` FK.

## Development Best Practices

### 1. Write Tests First (TDD Approach)

**Test-Driven Development Workflow:**

```
1. Write a failing test
2. Implement the minimum code to make it pass
3. Refactor and improve
4. Repeat
```

**Testing Guidelines:**

- **Write tests for each feature** before or immediately after implementation
- **Test file location:** Place test files next to the source files they test
  - Example: `components/public/GrouponCard.tsx` → `components/public/GrouponCard.test.tsx`
- **Test naming:** Use descriptive test names that explain what is being tested

  ```typescript
  // ✅ Good
  it("should show error message when required fields are empty", () => {});
  it("should submit form successfully with valid data", () => {});

  // ❌ Bad
  it("works", () => {});
  it("test form", () => {});
  ```

**What to Test:**

- **Components:** User interactions, state changes, props rendering, conditional rendering
- **Forms:** Validation, error handling, successful submission
- **API Routes:** Request/response handling, error cases, authentication/authorization
- **Utilities:** Pure functions, input/output validation, edge cases

**Running Tests:**

```bash
npm test              # Run tests in watch mode
npm test:ci          # Run tests once (for CI)
npm test:coverage    # Generate coverage report
```

### 2. Write Descriptive Commit Messages

**Commit Message Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring (no functional changes)
- `test` - Adding or updating tests
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc.)
- `chore` - Maintenance tasks, dependencies, build process
- `perf` - Performance improvements
- `security` - Security-related changes

**Examples:**

```bash
# ✅ Good commits
feat(admin): add two-factor authentication for admin users
fix(promocodes): resolve slug collision when duplicate names exist
test(forms): add unit tests for PromocodeForm validation
refactor(api): extract common error handling into helper function
docs(readme): update deployment instructions for production

# ❌ Bad commits
fix stuff
added thing
update
wip
```

**Additional guidelines:**

- Keep the subject line under 72 characters
- Use imperative mood ("add" not "added" or "adds")
- Capitalize the subject line
- Do not end the subject line with a period
- Reference issues in the footer: `Closes #123` or `Refs #456`

### 3. Follow Existing Patterns

**Before writing new code, explore the codebase to find existing patterns:**

**Component Structure:**

- **Server components** by default (no `"use client"` directive)
- **Client components** only when needed (interactivity, state, browser APIs)
- Keep components small and focused (single responsibility)
- Extract reusable logic into custom hooks
- Follow the existing folder structure:
  ```
  components/
    public/       # Public-facing components
    home/         # Homepage-specific components
    layout/       # Layout components (Header, Footer)
    ui/           # Reusable UI primitives (shadcn/ui)
    providers/    # Context providers
  ```

**API Route Patterns:**

- Follow existing error handling patterns in `lib/errors.ts`
- Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Validate input with Zod schemas before processing
- Return consistent response shapes:

  ```typescript
  // Success
  return NextResponse.json({ data: result }, { status: 200 });

  // Error
  return NextResponse.json({ error: "Error message" }, { status: 400 });
  ```

**Database Query Patterns:**

- Use Drizzle ORM query builders (not raw SQL)
- Follow multi-language join patterns for translatable entities
- Use transactions for multiple related operations:
  ```typescript
  await db.transaction(async (tx) => {
    // Multiple operations
  });
  ```

**Naming Conventions:**

- **Files:** `kebab-case.tsx` (e.g., `promocode-form.tsx`)
- **Components:** `PascalCase` (e.g., `PromocodeForm`)
- **Functions/Variables:** `camelCase` (e.g., `getPromocodes`)
- **Types/Interfaces:** `PascalCase` (e.g., `PromocodeData`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- **Database tables:** `snake_case` (e.g., `store_translations`)

### 4. Maintain Code Quality

**Code Style:**

- **Run linter before committing:**
  ```bash
  npm run lint          # Check for issues
  npm run lint:fix      # Auto-fix issues
  ```
- **Configure your editor** to use the project's ESLint and Prettier settings
- **Follow TypeScript best practices:**
  - Avoid `any` type - use `unknown` when type is truly unknown
  - Enable strict type checking
  - Use type inference where possible
  - Define proper return types for public functions

**Code Review Checklist:**

Before considering code "done," verify:

- [ ] Tests are written and passing
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] No ESLint warnings (`npm run lint` passes)
- [ ] Code follows existing patterns in the codebase
- [ ] Sensitive data is not exposed (no `NEXT_PUBLIC_` for secrets)
- [ ] Database queries are properly indexed and optimized
- [ ] Error handling is comprehensive
- [ ] Translation keys are added for all three languages (uz, ru, en)
- [ ] Commit message is descriptive and follows format

**Performance Best Practices:**

- Use server components by default for better performance
- Implement pagination for list endpoints (don't fetch all records)
- Add database indexes for frequently queried columns
- Use `revalidatePath` and `revalidateTag` for cache invalidation
- Optimize images (use Next.js `Image` component with proper sizes)
- Lazy load heavy components with `next/dynamic`

**Security Best Practices:**

- Never expose database credentials or API secrets in client code
- Validate and sanitize all user inputs
- Use prepared statements (Drizzle handles this automatically)
- Implement rate limiting for public API endpoints
- Use CSRF protection (already configured in `lib/csrf.ts`)
- Keep dependencies updated (`npm audit` and `npm update`)

**Documentation Guidelines:**

- Add comments for complex logic (why, not what)
- Document public API functions with JSDoc comments:
  ```typescript
  /**
   * Generates a SEO-friendly slug from text
   * @param text - The input text to slugify
   * @param language - The language code for transliteration (uz, ru, en)
   * @returns A lowercase, hyphenated slug
   */
  export function generateSlug(text: string, language: Language): string;
  ```
- Update CLAUDE.md when introducing new patterns or breaking changes
- Keep README.md accurate for end-user documentation

### 5. Debugging and Troubleshooting

**Common Issues and Solutions:**

| Issue                        | Solution                                                  |
| ---------------------------- | --------------------------------------------------------- |
| Build fails with type errors | Run `npm run build` and fix each error systematically     |
| Database connection errors   | Verify DATABASE_URL in .env, check if Postgres is running |
| Translation keys missing     | Run type check and add missing keys to all language files |
| Middleware not working       | Remember: use `proxy.ts` not `middleware.ts`              |
| Tests failing locally        | Clear Jest cache: `npm run test -- --clearCache`          |
| Import errors                | Verify path aliases in `tsconfig.json`                    |

**Development Tools:**

- **Drizzle Studio:** Visual database browser (`npm run db:studio`)
- **React DevTools:** Component tree debugging
- **Next.js DevTools:** Route and request info (built-in to dev server)
- **Browser DevTools:** Network inspection, console debugging

### 6. Feature Development Workflow

**Step-by-step process:**

1. **Understand requirements** - Ask clarifying questions before coding
2. **Explore the codebase** - Find similar features to use as reference
3. **Plan the approach** - Identify files to create/modify, dependencies, risks
4. **Write tests first** - Define expected behavior
5. **Implement incrementally** - Small commits, each passing tests
6. **Test manually** - Verify the feature works in the browser
7. **Run lint and build** - Ensure code quality
8. **Write descriptive commit** - Document what and why
9. **Update documentation** - Add notes to CLAUDE.md if needed

**When stuck:**

1. Check existing similar code in the codebase
2. Read official documentation (Next.js, Drizzle, next-intl)
3. Search for error messages online
4. Ask for help or clarification

## Architecture Overview

### Database: Drizzle ORM with Multi-Language Translation Pattern

This project uses **Drizzle ORM** (NOT Prisma, despite outdated README references). The database schema follows a translation pattern where core entities (Store, Category, Brand, Promocode) have separate translation tables for multi-language support.

**Key schema patterns:**

- Main entities: `stores`, `categories`, `brands`, `promocodes`, `users`
- Translation tables: `store_translations`, `category_translations`, `brand_translations`, `promocode_translations`
- Each translation has `language` enum (`uz`, `ru`, `en`) and `slug` field for SEO-friendly URLs
- UNIQUE constraints on `(entityId, language)` and `(language, slug)` pairs
- All IDs use UUIDs generated with `randomUUID()`

**Database connection:**

- Client: `postgres-js` (NOT `@vercel/postgres` or native `pg`)
- Configuration in `db/index.ts` with Supabase password handling and connection pooling
- Schema defined in `db/schema.ts`
- Access database via: `import { db } from "@/db"`

### Routing: Next.js 14+ App Router with next-intl

This project uses **next-intl** for internationalization with App Router. All routes are automatically language-prefixed.

**Route structure:**

```
app/
  [locale]/                        # Language dynamic segment (uz|ru|en) - managed by next-intl
    (user)/                        # Public site route group
      page.tsx                     # Homepage: /uz or /ru or /en
      store/[slug]/page.tsx        # Store detail: /uz/store/yandex-eats
      category/[slug]/page.tsx     # Category detail: /uz/category/food
      brand/[slug]/page.tsx        # Brand detail: /uz/brand/yandex-go
      promocode/[slug]/page.tsx    # Promocode detail: /uz/promocode/50-discount-on-yandex-eats
      layout.tsx                   # Public layout (header/footer)
```

**next-intl Configuration:**

- **Configuration files:**
  - `i18n.ts` - Main next-intl request config (loads messages)
  - `i18n/routing.ts` - Routing configuration (locales, default locale, prefix strategy)
  - `lib/navigation.ts` - Typed navigation helpers (Link, useRouter, usePathname, etc.)
  - `proxy.ts` - Locale negotiation and URL rewrites (middleware)
  - `messages/` - Translation JSON files (uz.json, ru.json, en.json)

**Important:** This repo uses `proxy.ts` instead of `middleware.ts`. Do not create `middleware.ts` or the build will fail with the "middleware-to-proxy" warning. Keep any middleware logic (e.g. CSP headers, nonce, `x-pathname`) inside `proxy.ts`.

- **Supported languages:** `uz` (default), `ru`, `en`
- **Locale prefix strategy:** `always` (URLs always include locale: `/uz/stores`)

**Navigation Best Practices:**

**❌ WRONG - Never use Next.js navigation directly:**

```typescript
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

// ❌ Don't manually construct locale URLs
<Link href={`/${locale}/stores`}>Stores</Link>
router.push(`/${locale}/stores`);
```

**✅ CORRECT - Always use next-intl typed navigation:**

```typescript
import { Link, useRouter, usePathname } from "@/lib/navigation";

// ✅ Locale is automatically handled
<Link href="/stores">Stores</Link>
router.push("/stores");

// ✅ Switch language while preserving current path
router.replace(pathname, { locale: 'ru' });
```

**Translation Usage:**

**Server Components:**

```typescript
import { getTranslations } from "next-intl/server";

const t = await getTranslations({ locale, namespace: "home" });
<h1>{t("title")}</h1>
```

**Client Components:**

```typescript
"use client";
import { useTranslations } from "next-intl";

const t = useTranslations("home");
<h1>{t("title")}</h1>
```

**Type Safety:**

TypeScript types for translations are defined in `types/messages.d.ts`:

```typescript
type Messages = typeof import("../messages/uz.json");
declare interface IntlMessages extends Messages {}
```

This provides autocomplete and type checking for translation keys.

### API Routes Structure

**Public API routes:**

- `GET /api/stores` - List stores
- `GET /api/categories` - List categories
- `GET /api/promocodes` - List promocodes (with filtering)
- `POST /api/promocodes/[id]/view` - Increment view count
- `POST /api/promocodes/[id]/copy` - Increment copy count

Content CRUD is done via the database / Drizzle Studio / scripts (no admin UI or `/api/admin` routes).

### Key Implementation Patterns

**1. Multi-language queries:**
When fetching entities, always join with translation tables and filter by language:

```typescript
const stores = await db
  .select()
  .from(stores)
  .leftJoin(
    storeTranslations,
    and(eq(storeTranslations.storeId, stores.id), eq(storeTranslations.language, lang))
  );
```

**2. Slug generation:**

- Use `lib/slug.ts` `generateSlug()` function for SEO-friendly slugs
- Slugs are transliterated (Cyrillic → Latin) and lowercased with hyphens
- Slugs must be unique per language (enforced by database constraint)

**3. UI Components:**

- shadcn/ui components in `components/ui/`
- Tailwind CSS v4 with custom config
- Dark mode support with theme toggle on the public site

### TypeScript Configuration

- Path alias: `@/*` maps to project root
- Strict mode enabled
- Type inference from Drizzle: `typeof table.$inferSelect` and `typeof table.$inferInsert`
- Exported types in `db/schema.ts`: `User`, `Store`, `Category`, `Brand`, `Promocode`, etc.

### Deployment & Middleware (proxy.ts)

This project adheres to **Next.js 16 standards** where `middleware.ts` is deprecated in favor of `proxy.ts`.

- **Logic Location:** `proxy.ts` handles all middleware duties, including i18n locale negotiation.
- **Root Redirect:** `app/page.tsx` contains a fallback redirect (`redirect("/uz")`). This is **intentional** and required by the App Router structure as a fallback if middleware fails or for static exports. Do not remove it.

## Important Notes

### Database Schema: Use Drizzle, Not Prisma

The README.md incorrectly mentions Prisma. This project uses **Drizzle ORM**. Do not create or modify `prisma/schema.prisma` files. All schema changes must be made in `db/schema.ts` and applied via Drizzle Kit commands.

### Development Mode Recommendation

Use `npm run dev` (webpack mode) instead of `npm run dev:turbo` for Drizzle ORM compatibility. Turbopack may have issues with the database client initialization.

### Content Management

There is no admin panel in this codebase. Manage stores, categories, brands, and promocodes via Drizzle Studio, SQL, or scripts. Keep a `users` row for `promocodes.createdById`.

### Promocode Status Management

Promocode status (`draft`, `active`, `expired`, `disabled`) is managed manually. There's no automatic cron job to expire promocodes. The application should check `expiresAt` timestamp when displaying promocodes.

### Image Handling

The project allows any external image URLs (configured in `next.config.ts`). No image upload functionality is implemented - users provide image URLs directly.

## DO NOT MODIFY (Well-Implemented SEO Patterns)

**⚠️ IMPORTANT:** The following files and patterns are well-implemented for SEO. Do NOT modify them without explicit user request and good reason:

### Structured Data / Schema Markup (DO NOT TOUCH)

These files implement comprehensive JSON-LD schema markup that drives rich results in search engines. They are correctly implemented and should NOT be modified:

- `components/public/StructuredData.tsx` - Core schema generator (WebPage, Product, Offer, CollectionPage)
- `components/public/OrganizationSchema.tsx` - Organization schema with contact info
- `components/public/BreadcrumbsSchema.tsx` - BreadcrumbList schema for navigation
- `components/public/EntityFAQSchema.tsx` - FAQPage schema for entity pages
- `components/public/HowToSchema.tsx` - HowTo schema for promocode usage instructions
- `components/public/ItemListSchema.tsx` - ListItem schema for promocode listings
- `components/public/LocalBusinessSchema.tsx` - LocalBusiness schema for stores

**Why these are good:**

- Properly structured JSON-LD following Schema.org specifications
- Include all required fields (context, type, name, url)
- Rich with additional properties (aggregateRating, offers, itemListElement)
- Multi-language aware with locale-specific URLs

### Metadata Generation (DO NOT TOUCH)

The metadata system in `lib/metadata.ts` is well-designed:

- `generateFullMetadata()` - Handles title, description, OG, Twitter, hreflang, canonical
- `generateStoreTitle/Description()` - SEO-optimized store page metadata
- `generateCategoryTitle/Description()` - SEO-optimized category page metadata
- `generateBrandTitle/Description()` - SEO-optimized brand page metadata
- `generatePromocodeTitle/Description()` - SEO-optimized promocode page metadata
- `generateOgImageUrl()` - Dynamic OG image generation

**Why this is good:**

- Proper truncation at 60/160 characters for SERP display
- Includes discount information in titles/descriptions
- Dynamic OG images with store logos and discounts
- Complete OpenGraph and Twitter Card support
- Proper hreflang implementation with x-default

### Hreflang & Canonical Implementation (DO NOT TOUCH)

The hreflang implementation correctly supports multi-language SEO:

```typescript
// From lib/metadata.ts - DO NOT MODIFY THIS PATTERN
alternates: {
  canonical: `${baseUrl}/${locale}${urlSuffix}`,
  languages: {
    "x-default": `${baseUrl}/uz${urlSuffix}`,  // Correct: x-default points to primary locale
    uz: `${baseUrl}/uz${urlSuffix}`,
    ru: `${baseUrl}/ru${urlSuffix}`,
    en: `${baseUrl}/en${urlSuffix}`,
  },
}
```

**Why this is good:**

- `x-default` correctly points to Uzbek (primary locale)
- Per-entity language alternates (each store/category/brand has proper hreflang)
- Self-referencing canonicals on all pages

### Sitemap Implementation (DO NOT TOUCH)

`app/sitemap.ts` generates multi-language sitemaps:

- `/sitemap/uz.xml` - Uzbek pages
- `/sitemap/ru.xml` - Russian pages
- `/sitemap/en.xml` - English pages
- Includes all dynamic pages (stores, categories, brands, promocodes)
- Only includes active, non-expired promocodes
- Build-time safety (skips DB queries during build)

### Security Headers (DO NOT TOUCH)

`next.config.ts` headers section (lines 70-137) includes:

- HSTS (Strict-Transport-Security)
- X-Frame-Options
- X-Content-Type-Options
- CSP (Content-Security-Policy) with nonce

### Known SEO Issues (Feel Free to Fix These)

These are known issues that CAN be improved:

1. **`app/layout.tsx:35`** - Hard-coded `lang="uz"` should be removed or made dynamic
2. **`lib/metadata.ts:6-8`** - Title truncation doesn't account for Cyrillic character width
3. **Filtered canonicals** - Pages with filters should canonicalize to clean URL
