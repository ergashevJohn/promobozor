# Promocode Site

MVP promocode sharing website with multi-language support.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Drizzle ORM
- PostgreSQL (Supabase)
- next-intl (internationalization)

## Features

- Multi-language support (uz, ru, en) with URL prefixes
- Public site with filtering and promocode details
- SEO-friendly routes
- Automatic expiration handling

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

**For local development:**

```bash
cp .env.example .env
```

Edit `.env` and add your database URL:

```
DATABASE_URL="postgresql://user:password@localhost:5432/promocode_db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
SEED_ADMIN_EMAIL="admin@example.com"
```

**IMPORTANT:** Never use `NEXT_PUBLIC_` prefix for secrets like `DATABASE_URL` as it exposes them in browser code.

3. Set up the database:

**For local development:**

```bash
npm run db:push
```

**For production setup:**

```bash
npm run db:push:prod
```

4. (Optional) Seed the database with a system user (needed for `promocodes.createdById` FK) and sample category:

**For local development:**

```bash
npm run seed
```

**For production:**

```bash
npm run seed:prod
```

5. Run the development server:

**For local development (uses .env):**

```bash
npm run dev
```

**For testing with production database (uses .env.production):**

```bash
npm run dev:prod
```

**⚠️ Warning:** `npm run dev:prod` connects to production database. Use carefully!

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Automated DB Backup (Weekly + Telegram Copy)

This project includes two GitHub Actions workflows for backup and restore verification:

- `.github/workflows/db-backup-weekly.yml` - creates weekly full DB dump, uploads to S3/R2, then sends a Telegram secondary copy (or metadata fallback if file is too large).
- `.github/workflows/db-restore-check-monthly.yml` - restores the latest backup into a temporary PostgreSQL service and runs smoke checks.

### Schedule

- Weekly backup: Sunday 02:00 UZT (`0 21 * * 6` UTC)
- Monthly restore check: day 1 of each month at 02:30 UZT (`30 21 1 * *` UTC)

### Required GitHub Secrets

Set these in repository settings (`Settings -> Secrets and variables -> Actions`):

- `BACKUP_DATABASE_URL` - direct PostgreSQL connection URL for `pg_dump`
- `BACKUP_S3_ACCESS_KEY_ID`
- `BACKUP_S3_SECRET_ACCESS_KEY`
- `BACKUP_S3_REGION`
- `BACKUP_S3_BUCKET`
- `BACKUP_S3_PREFIX` (optional, defaults to `db-backups`)
- `BACKUP_S3_ENDPOINT` (optional, required for some S3-compatible providers like R2)
- `BACKUP_TELEGRAM_BOT_TOKEN` (optional for secondary Telegram copy)
- `BACKUP_TELEGRAM_CHAT_ID` (optional for secondary Telegram copy)

Optional GitHub variable:

- `TELEGRAM_MAX_FILE_SIZE_BYTES` - override Telegram file-size threshold used for fallback behavior

### Telegram Backup Behavior

- Telegram is a secondary channel only; S3/R2 is the primary backup storage.
- If file size is above Telegram limit, workflow sends backup metadata (object key, checksum, size) to Telegram instead of the file.
- If Telegram copy step fails, workflow emits a warning while keeping primary S3 backup result visible in summary.

### Manual Runbook

1. Run weekly backup manually from Actions tab: `Weekly DB Backup -> Run workflow`.
2. Confirm dump and `.sha256` file in bucket prefix `db-backups/weekly/` (or your configured prefix).
3. Check Telegram channel/chat:
   - file arrived, or
   - fallback metadata message arrived.
4. Run restore check: `Monthly Backup Restore Check -> Run workflow`.
5. Verify restore smoke checks pass.

### Restore Notes

- Restore check workflow uses the latest object in weekly backup prefix and verifies checksum before `pg_restore`.
- Configure bucket lifecycle policy to keep backups for 90 days (recommended).

## Default Routes

- Public: `http://localhost:3000/uz`, `http://localhost:3000/ru`, or `http://localhost:3000/en`

Content (stores, categories, brands, promocodes) is managed via the database / Drizzle Studio / scripts — there is no admin UI in this codebase.

## Database Schema

The project uses Drizzle ORM with translation tables for multi-language support:

- Store (with StoreTranslation)
- Category (with CategoryTranslation)
- Brand (with BrandTranslation)
- Promocode (with PromocodeTranslation)
- User (system row for `promocodes.createdById` FK)

## Project Structure

```
app/
  [locale]/        # Language-based routes (uz, ru, en)
    (user)/        # Public site routes
  api/             # API routes
components/
  public/          # Public components
  ui/              # shadcn/ui components
  layout/          # Header and Footer components
lib/               # Utilities and helpers
db/                # Drizzle schema and migrations
i18n/              # Internationalization config
messages/          # Translation files (uz.json, ru.json, en.json)
```

## License

MIT
