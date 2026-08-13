-- ============================================================================
-- Conserta a captura de lead e destrava o agendador do blog.
--
-- CONTEXTO
-- app/api/leads/route.ts monta um insert com 29 colunas. A tabela `leads` so
-- tem 7 delas. O PostgREST rejeita o insert INTEIRO quando uma coluna nao
-- existe, entao toda submissao do formulario volta HTTP 400 — e o LeadForm
-- ainda mostra a mensagem crua do Postgres para o visitante.
--
-- POR QUE ISSO PASSOU DESPERCEBIDO
-- sql/leads.sql abre com `create table if not exists public.leads`. A tabela ja
-- existia com um schema mais antigo (id uuid, com `email`, `origem`, `notas`),
-- entao o comando nao fez nada — silenciosamente. As colunas novas nunca
-- chegaram. Por isso aqui e tudo ALTER ... ADD COLUMN IF NOT EXISTS: adiciona o
-- que falta sem tocar no que existe.
--
-- O `id` continua uuid DE PROPOSITO. sql/leads.sql declara bigint identity, mas
-- autosales_sequences.lead_id e autosales_logs.lead_id ja apontam para o uuid;
-- trocar o tipo quebraria as duas foreign keys. O arquivo sql/leads.sql e que
-- esta desatualizado.
--
-- Idempotente: pode rodar de novo sem efeito colateral.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. leads — as 22 colunas que o endpoint envia e o banco nao tem
-- ─────────────────────────────────────────────────────────────────────────────

-- dados do formulario
alter table public.leads add column if not exists prazo_aquisicao   text;
alter table public.leads add column if not exists mensagem          text;

-- LGPD: consentimento precisa ser provavel, com versao e carimbo de tempo
alter table public.leads add column if not exists consent_lgpd      boolean default false;
alter table public.leads add column if not exists consent_version   text default '1.0';
alter table public.leads add column if not exists consent_timestamp timestamptz;

-- contexto de pagina: e isto que responde "qual artigo gerou o lead"
alter table public.leads add column if not exists page        text;
alter table public.leads add column if not exists page_type   text;
alter table public.leads add column if not exists page_slug   text;
alter table public.leads add column if not exists page_color  text;
alter table public.leads add column if not exists page_city   text;
alter table public.leads add column if not exists page_intent text;
alter table public.leads add column if not exists referer     text;

-- identificadores de clique de anuncio
alter table public.leads add column if not exists gclid  text;
alter table public.leads add column if not exists fbclid text;

-- rastro tecnico
alter table public.leads add column if not exists ip_address text;
alter table public.leads add column if not exists user_agent text;

-- UTMs
alter table public.leads add column if not exists utm_source   text;
alter table public.leads add column if not exists utm_medium   text;
alter table public.leads add column if not exists utm_campaign text;
alter table public.leads add column if not exists utm_content  text;
alter table public.leads add column if not exists utm_term     text;

-- `source` e o campo que o endpoint preenche (utm_source ou 'site_org').
-- Nao confundir com `origem`, que ja existia e guarda o rotulo escrito a mao
-- no admin ("Instagram", "WhatsApp"). Os dois convivem: `source` e maquina,
-- `origem` e humano.
alter table public.leads add column if not exists source text default 'site_org';

-- Restringe prazo_aquisicao aos valores que o zod aceita em route.ts.
-- Seguro: toda linha existente fica NULL nessa coluna, e CHECK passa em NULL.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_prazo_aquisicao_check'
  ) then
    alter table public.leads
      add constraint leads_prazo_aquisicao_check
      check (prazo_aquisicao in ('imediato','1_mes','2_3_meses','3_mais'));
  end if;
end $$;

-- Indices. O de page_slug existe para a pergunta que hoje nao tem resposta:
-- quais artigos do blog convertem.
create index if not exists idx_leads_telefone_created on public.leads (telefone, created_at desc);
create index if not exists idx_leads_status           on public.leads (status);
create index if not exists idx_leads_created_at       on public.leads (created_at desc);
create index if not exists idx_leads_page_slug        on public.leads (page_slug) where page_slug is not null;
create index if not exists idx_leads_utm_source       on public.leads (utm_source) where utm_source is not null;

comment on column public.leads.source      is 'Origem automatica (utm_source ou site_org). Preenchida pelo endpoint.';
comment on column public.leads.origem      is 'Origem escrita a mao no admin. Nao e a mesma coisa que source.';
comment on column public.leads.page_slug   is 'Slug da pagina que originou o lead — e por aqui que se mede conversao por artigo.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. blog_post_schedule_events — a fila do agendador do blog
--
-- app/api/admin/blog/schedule/{route,events,process,run-due} leem e escrevem
-- nesta tabela. Ela nunca foi criada: as quatro rotas falham com PGRST205.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.blog_post_schedule_events (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.blog_posts(id) on delete cascade,
  run_at      timestamptz not null,
  action      text        not null default 'publish',
  executed_at timestamptz,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

-- run-due varre por (executed_at is null and run_at <= now) ordenado por run_at.
-- O indice parcial cobre exatamente essa varredura e ignora o que ja rodou.
create index if not exists idx_bpse_pendentes
  on public.blog_post_schedule_events (run_at)
  where executed_at is null;
create index if not exists idx_bpse_post on public.blog_post_schedule_events (post_id);

comment on table public.blog_post_schedule_events is
  'Fila de publicacao agendada do blog. Consumida por /api/admin/blog/schedule/run-due.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ai_generation_sessions — progresso da geracao de artigo
--
-- generate-post e generate-missing gravam o avanco das fases
-- (outline -> expand -> enrich -> finalize) aqui. Os inserts estao dentro de
-- try/catch vazio, entao a ausencia da tabela nunca apareceu: a geracao roda,
-- so que cega, sem nenhum registro de progresso ou de erro.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.ai_generation_sessions (
  id            uuid primary key default gen_random_uuid(),
  topic         text,
  phase         text,
  progress      integer     not null default 0,
  status        text        not null default 'running',
  error_message text,
  post_id       uuid references public.blog_posts(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- A rota /ai/session?active=1 filtra por status diferente de completed/error
-- e ordena por created_at desc.
create index if not exists idx_ags_created on public.ai_generation_sessions (created_at desc);
create index if not exists idx_ags_status  on public.ai_generation_sessions (status);

comment on table public.ai_generation_sessions is
  'Progresso das fases de geracao de artigo por IA. Escrita por /api/admin/blog/ai/generate-post.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS
--
-- As duas tabelas so sao tocadas por rotas de admin usando a service role, que
-- ignora RLS. Ligar RLS sem policy nenhuma e o que fecha as duas para o anon
-- key que roda no navegador. `leads` ja tinha RLS ligado.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.blog_post_schedule_events enable row level security;
alter table public.ai_generation_sessions    enable row level security;
