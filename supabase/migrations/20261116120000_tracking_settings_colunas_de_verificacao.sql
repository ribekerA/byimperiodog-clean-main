-- tracking_settings de producao nao tinha as colunas de verificacao de dominio.
--
-- O codigo (app/api/admin/tracking-settings e src/lib/tracking/getTrackingConfig.ts)
-- le e grava essas colunas, mas elas so existiam em sql/tracking_settings.sql,
-- que nunca virou migracao. Resultado em 16/11/2026: salvar Tracking & Pixels
-- falhava com "Could not find the 'google_site_verification' column of
-- 'tracking_settings' in the schema cache", e a leitura, que pede as mesmas
-- colunas, voltava com erro e caia nos valores das variaveis de ambiente.
--
-- Tudo com "if not exists": rodar de novo nao muda nada.

alter table public.tracking_settings add column if not exists is_gtm_enabled boolean default false;
alter table public.tracking_settings add column if not exists gtm_container_id text;
alter table public.tracking_settings add column if not exists is_ga4_enabled boolean default false;
alter table public.tracking_settings add column if not exists ga_measurement_id text;
alter table public.tracking_settings add column if not exists is_facebook_enabled boolean default false;
alter table public.tracking_settings add column if not exists facebook_pixel_id text;
alter table public.tracking_settings add column if not exists is_tiktok_enabled boolean default false;
alter table public.tracking_settings add column if not exists tiktok_pixel_id text;
alter table public.tracking_settings add column if not exists meta_domain_verification text;
alter table public.tracking_settings add column if not exists google_site_verification text;
alter table public.tracking_settings add column if not exists updated_at timestamptz default now();
alter table public.tracking_settings add column if not exists updated_by uuid;

-- O upsert usa onConflict "environment"; sem indice unico ele falha.
create unique index if not exists tracking_settings_env_idx on public.tracking_settings(environment);

-- Faz o PostgREST enxergar as colunas novas sem esperar o recarregamento.
notify pgrst, 'reload schema';
