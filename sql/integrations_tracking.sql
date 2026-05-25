-- OAuth Integrations and Tracking Settings
-- Consistent with existing Supabase SQL style

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null check (provider in ('facebook','google_analytics','google_tag_manager','tiktok')),
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  provider_account_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracking_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  facebook_pixel_id text,
  ga_measurement_id text,
  gtm_container_id text,
  tiktok_pixel_id text,
  is_facebook_pixel_enabled boolean not null default false,
  is_ga_enabled boolean not null default false,
  is_gtm_enabled boolean not null default false,
  is_tiktok_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Touch triggers to keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists t_integrations_touch on public.integrations;
create trigger t_integrations_touch before update on public.integrations
for each row execute function public.touch_updated_at();

drop trigger if exists t_tracking_settings_touch on public.tracking_settings;
create trigger t_tracking_settings_touch before update on public.tracking_settings
for each row execute function public.touch_updated_at();

-- RLS
alter table public.integrations enable row level security;
alter table public.tracking_settings enable row level security;

-- Policies: allow authenticated users to manage their own rows
drop policy if exists integrations_select_own on public.integrations;
create policy integrations_select_own on public.integrations
for select to authenticated using (auth.uid() = user_id);

drop policy if exists integrations_insert_own on public.integrations;
create policy integrations_insert_own on public.integrations
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists integrations_update_own on public.integrations;
create policy integrations_update_own on public.integrations
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists integrations_delete_own on public.integrations;
create policy integrations_delete_own on public.integrations
for delete to authenticated using (auth.uid() = user_id);

-- tracking_settings policies
drop policy if exists tracking_settings_select_own on public.tracking_settings;
create policy tracking_settings_select_own on public.tracking_settings
for select to authenticated using (auth.uid() = user_id);

drop policy if exists tracking_settings_insert_own on public.tracking_settings;
create policy tracking_settings_insert_own on public.tracking_settings
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists tracking_settings_update_own on public.tracking_settings;
create policy tracking_settings_update_own on public.tracking_settings
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists tracking_settings_delete_own on public.tracking_settings;
create policy tracking_settings_delete_own on public.tracking_settings
for delete to authenticated using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_integrations_user_provider on public.integrations (user_id, provider);
create index if not exists idx_tracking_settings_user on public.tracking_settings (user_id);

-- Unique constraints for upsert
alter table public.integrations drop constraint if exists integrations_user_provider_key;
alter table public.integrations add constraint integrations_user_provider_key unique (user_id, provider);

alter table public.tracking_settings drop constraint if exists tracking_settings_user_key;
alter table public.tracking_settings add constraint tracking_settings_user_key unique (user_id);
