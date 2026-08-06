#!/usr/bin/env bash
#
# Cloud Agent / local development INSTALL script.
#
# Idempotent. Prepares a fully working local development environment:
#   1. Installs and starts a local PostgreSQL server (system package).
#   2. Installs Node dependencies.
#   3. Creates the local `promocode_db`, applies migrations (with Supabase-compat
#      shims), and seeds baseline data.
#
# SAFETY: The environment injects a *production* Supabase DATABASE_URL. This script
# deliberately targets a LOCAL database for all DB work so it never mutates
# production. The app dev server is likewise pointed at the local DB (see
# cloud-start.sh).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

LOCAL_DB_URL="postgresql://postgres:postgres@localhost:5432/promocode_db"

echo "==> Ensuring PostgreSQL is installed"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y --no-install-recommends postgresql postgresql-contrib
fi

PG_VERSION="$(ls /usr/lib/postgresql/ | sort -V | tail -1)"
echo "==> Using PostgreSQL ${PG_VERSION}"

echo "==> Starting PostgreSQL cluster"
sudo pg_ctlcluster "${PG_VERSION}" main start 2>/dev/null || true

echo "==> Waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if sudo -u postgres psql -c "SELECT 1" >/dev/null 2>&1; then break; fi
  sleep 1
done

echo "==> Configuring postgres role + local database"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" >/dev/null
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='promocode_db'" | grep -q 1; then
  sudo -u postgres createdb promocode_db
fi

echo "==> Installing Node dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> Writing local .env (if missing)"
if [ ! -f .env ]; then
  cat > .env <<'ENV'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/promocode_db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
CSRF_SECRET="local-dev-csrf-secret-at-least-32-characters"
SEED_ADMIN_EMAIL="admin@example.com"
DISABLE_CSRF="true"
TRUSTED_TYPES_ENFORCE="false"
ENV
fi

echo "==> Applying local migrations (Supabase-compat shims + Drizzle)"
LOCAL_DATABASE_URL="$LOCAL_DB_URL" bash scripts/dev/migrate-local.sh

echo "==> Seeding baseline data (local DB)"
DATABASE_URL="$LOCAL_DB_URL" npm run seed

echo "==> Install complete"
