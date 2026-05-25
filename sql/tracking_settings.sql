-- Tabela de tracking versionada por ambiente (sem dependência de admin_users)
create table if not exists public.tracking_settings (
  id uuid primary key default gen_random_uuid(),
  environment text not null,
  is_gtm_enabled boolean default false,
  gtm_container_id text,
  is_ga4_enabled boolean default false,
  ga_measurement_id text,
  is_facebook_enabled boolean default false,
  facebook_pixel_id text,
  is_tiktok_enabled boolean default false,
  tiktok_pixel_id text,
  meta_domain_verification text,
  google_site_verification text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Se a tabela já existia sem environment, adiciona e preenche
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tracking_settings' and column_name = 'environment'
  ) then
    alter table public.tracking_settings add column environment text;
    update public.tracking_settings set environment = 'production' where environment is null;
    alter table public.tracking_settings alter column environment set not null;
  end if;
end;
$$;

create unique index if not exists tracking_settings_env_idx on public.tracking_settings(environment);

-- Trigger simples para updated_at
create or replace function public.set_tracking_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tracking_settings_updated_at on public.tracking_settings;
create trigger trg_tracking_settings_updated_at
before update on public.tracking_settings
for each row execute function public.set_tracking_settings_updated_at();

-- Auditoria opcional
create table if not exists public.tracking_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  environment text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz default now()
);
