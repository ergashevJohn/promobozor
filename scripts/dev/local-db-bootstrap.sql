-- Local development database bootstrap
--
-- Production runs on Supabase, which provides the `anon`/`authenticated` roles and
-- a `public.rls_auto_enable()` SECURITY DEFINER helper. Migration 0017 hardens that
-- helper with REVOKE statements that reference those objects. A plain local
-- PostgreSQL instance does not have them, so those migrations fail.
--
-- This script creates minimal, idempotent Supabase-compatible shims so that the
-- repository's standard `npm run db:migrate` applies cleanly against a local
-- PostgreSQL. It is intended for local/dev environments only and never runs
-- against the production database.

-- Roles referenced by migration 0017 REVOKE statements.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END
$$;

-- Stub for the Supabase RLS helper. No-op locally; only needs to exist so the
-- REVOKE EXECUTE statements in migration 0017 succeed.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Intentionally empty: RLS auto-enable is a Supabase-only concern.
  RETURN;
END
$$;
