#!/usr/bin/env bash
#
# Cloud Agent / local development START script (runs on every boot).
#
# Idempotent per-boot reconciliation:
#   1. Starts the local PostgreSQL cluster and waits for readiness.
#   2. Starts the Next.js dev server (pointed at the LOCAL database) in the
#      background, then returns.
#
# The dev server is intentionally pointed at the local DB via inline env vars,
# overriding the injected production DATABASE_URL secret so local development
# never writes to production.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

LOCAL_DB_URL="postgresql://postgres:postgres@localhost:5432/promocode_db"

PG_VERSION="$(ls /usr/lib/postgresql/ 2>/dev/null | sort -V | tail -1 || true)"

echo "==> Starting PostgreSQL cluster (${PG_VERSION:-unknown})"
if [ -n "$PG_VERSION" ]; then
  sudo pg_ctlcluster "${PG_VERSION}" main start 2>/dev/null || true
fi

echo "==> Waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if psql "$LOCAL_DB_URL" -c "SELECT 1" >/dev/null 2>&1; then break; fi
  sleep 1
done

# Start the dev server only if nothing is already listening on :3000.
if ! (curl -sf -o /dev/null http://localhost:3000 2>/dev/null); then
  echo "==> Starting Next.js dev server (local DB) in background"
  mkdir -p /tmp/cursor
  DATABASE_URL="$LOCAL_DB_URL" \
  NEXT_PUBLIC_BASE_URL="http://localhost:3000" \
  DISABLE_CSRF="true" \
  RATE_LIMIT_DISABLED="true" \
    nohup npm run dev >/tmp/cursor/next-dev.log 2>&1 &

  echo "==> Waiting for dev server readiness"
  for _ in $(seq 1 60); do
    if curl -sf -o /dev/null http://localhost:3000/uz; then
      echo "==> Dev server is up at http://localhost:3000/uz"
      break
    fi
    sleep 1
  done
else
  echo "==> Dev server already running on :3000"
fi

echo "==> Start complete"
