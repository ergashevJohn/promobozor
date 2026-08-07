#!/usr/bin/env bash
#
# Idempotent LOCAL migration runner for a plain PostgreSQL instance.
#
# Why this exists:
#   * `drizzle-kit migrate` / `drizzle-kit push` (v0.31.x) fail against a local
#     PostgreSQL in the Cloud Agent environment (introspection + migrator bugs).
#   * Migration 0017 depends on Supabase-only objects (`anon`/`authenticated`
#     roles and `public.rls_auto_enable()`), which do not exist on plain Postgres.
#
# SAFETY: The Cloud Agent environment injects a *production* Supabase DATABASE_URL.
# This script deliberately ignores that and targets a LOCAL database only. It
# refuses to run against any non-local host so it can never mutate production.
#
# Override the local target with LOCAL_DATABASE_URL if needed (must be localhost).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DRIZZLE_DIR="$REPO_ROOT/drizzle"

LOCAL_DB_URL="${LOCAL_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/promocode_db}"

# Hard guard: never allow this script to touch a remote (e.g. production) DB.
DB_HOST="$(node -e "try{console.log(new URL(process.argv[1]).hostname)}catch{console.log('')}" "$LOCAL_DB_URL")"
if [[ "$DB_HOST" != "localhost" && "$DB_HOST" != "127.0.0.1" ]]; then
  echo "❌ Refusing to run: LOCAL_DATABASE_URL host is '$DB_HOST', not localhost." >&2
  echo "   This runner is for local development databases only." >&2
  exit 1
fi

PSQL=(psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=1 -q)

echo "🔧 Applying local Supabase-compat bootstrap shims..."
"${PSQL[@]}" -f "$SCRIPT_DIR/local-db-bootstrap.sql"

echo "📇 Ensuring migration tracking table..."
"${PSQL[@]}" -c "CREATE TABLE IF NOT EXISTS public._local_migrations (tag text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());"

# Read migration tags in journal order.
mapfile -t TAGS < <(node -e "console.log(require('$DRIZZLE_DIR/meta/_journal.json').entries.map(e=>e.tag).join('\n'))")

applied=0
skipped=0
for tag in "${TAGS[@]}"; do
  already="$(${PSQL[@]} -tA -c "SELECT 1 FROM public._local_migrations WHERE tag = '$tag' LIMIT 1;")"
  if [[ "$already" == "1" ]]; then
    skipped=$((skipped + 1))
    continue
  fi

  echo "  → applying $tag"
  psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=1 -q --single-transaction \
    -f "$DRIZZLE_DIR/$tag.sql" \
    -c "INSERT INTO public._local_migrations (tag) VALUES ('$tag');"
  applied=$((applied + 1))
done

echo "✅ Local migrations complete (applied: $applied, already up-to-date: $skipped)."
