-- Cria public.pixels_settings, que o codigo usa desde sempre e nunca existiu.
--
-- src/lib/pixels.ts le e grava uma linha unica (id = 'pixels') com um jsonb
-- por ambiente. Em 16/11/2026 o PostgREST respondia PGRST205 "Could not find
-- the table 'public.pixels_settings'". Como o upsert nao conferia o erro:
--   - salvar Tracking & Pixels gravava tracking_settings e "sincronizava" com
--     uma tabela inexistente, sem aviso;
--   - gravar as conversoes na tela do Google Ads respondia ok e nao guardava nada;
--   - o site publico caia sempre nas variaveis de ambiente (GTM_ID,
--     GOOGLE_ADS_ID, GOOGLE_ADS_CONVERSION_LABEL, GOOGLE_ADS_WHATSAPP_LABEL).
--
-- A linha inicial so copia o GTM ja ligado em tracking_settings de producao.
-- Os demais campos ficam vazios, entao o site continua usando as mesmas
-- variaveis de ambiente para Google Ads ate alguem gravar pelo painel.
--
-- Rodar de novo nao muda nada.

create table if not exists public.pixels_settings (
  id text primary key,
  production jsonb not null default '{}'::jsonb,
  staging jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- So o servidor (service_role) le e grava, igual as demais tabelas de tracking.
alter table public.pixels_settings enable row level security;
revoke all privileges on table public.pixels_settings from public, anon, authenticated;

insert into public.pixels_settings (id, production, staging)
select
  'pixels',
  coalesce(
    (
      select jsonb_build_object('gtmId', ts.gtm_container_id)
      from public.tracking_settings ts
      where ts.environment = 'production'
        and ts.is_gtm_enabled is true
        and ts.gtm_container_id is not null
      limit 1
    ),
    '{}'::jsonb
  ),
  '{}'::jsonb
on conflict (id) do nothing;

notify pgrst, 'reload schema';
