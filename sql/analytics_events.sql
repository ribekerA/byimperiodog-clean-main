-- Criação da tabela de eventos analíticos básica
-- Execute este script no banco do Supabase (SQL Editor) ou adicione ao pipeline de migrações.

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

-- Índices para consultas prováveis
create index if not exists analytics_events_name_idx on public.analytics_events (name);
create index if not exists analytics_events_ts_idx on public.analytics_events (ts desc);
create index if not exists analytics_events_path_idx on public.analytics_events (path);

-- (Opcional) Limpeza automática futura pode usar pg_cron / retention job.

-- Ativar RLS se desejar restringir leitura pública
alter table public.analytics_events enable row level security;

-- Política: somente service role (supabase) grava; leitura opcional (ajuste conforme necessidade)
-- Exemplo simples permitindo nenhum acesso anônimo (remova se quiser expor agregações via RPC):
-- revoke all on public.analytics_events from anon, authenticated;

-- Exemplo de política de inserção apenas para chave service_role (usa claim 'role' = 'service_role')
create policy if not exists analytics_events_insert_service_role
  on public.analytics_events for insert
  with check (auth.role() = 'service_role');

-- Política de seleção (desabilitada por padrão). Descomente se quiser permitir leitura autenticada:
-- create policy if not exists analytics_events_select_authenticated
--   on public.analytics_events for select
--   to authenticated
--   using (true);

-- Se for criar visões agregadas, fazer em outro arquivo (ex: kpi_counts_v2 etc.)

-- DONE
