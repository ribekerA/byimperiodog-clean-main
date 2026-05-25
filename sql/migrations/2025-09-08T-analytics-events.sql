-- Migration: create analytics_events table
-- Date: 2025-09-08
-- Safe to run multiple times (idempotent via IF NOT EXISTS / policy guards)

create extension if not exists pgcrypto;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  value numeric null,
  metric_id text null,
  label text null,
  meta jsonb null,
  path text null,
  ua text null,
  ip inet null,
  ts timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_idx on public.analytics_events (name);
create index if not exists analytics_events_ts_idx on public.analytics_events (ts desc);
create index if not exists analytics_events_path_idx on public.analytics_events (path);

alter table public.analytics_events enable row level security;

-- Política de inserção (Postgres não suporta "create policy if not exists")
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'analytics_events'
      AND policyname = 'analytics_events_insert_service_role'
  ) THEN
    EXECUTE 'create policy analytics_events_insert_service_role on public.analytics_events for insert with check (auth.role() = ''service_role'')';
  END IF;
END
$$;

-- Optional select policy (commented):
-- create policy if not exists analytics_events_select_authenticated
--   on public.analytics_events for select
--   to authenticated
--   using (true);

-- EOF
