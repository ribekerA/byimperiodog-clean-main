-- ============================================================================
-- PRODUCAO — 13/08/2026 — conserta a captura de lead e a fila de follow-up
--
-- POR QUE ESTE ARQUIVO EXISTE, E NAO SO A MIGRATION
-- O historico de migrations do projeto de producao (npmnuihgydadihktglrd) tem 9
-- versoes que nunca existiram neste repositorio, entao `supabase db push` se
-- recusa a rodar ate o historico ser reconciliado. Reconciliar exige renumerar
-- migrations e resetar o banco local — trabalho que nao deve ficar no caminho de
-- um bug que esta perdendo lead agora. Este arquivo aplica a mesma coisa que as
-- migrations 20260813091500 e 20260813154000, pelo SQL Editor, que e como as
-- outras 48 alteracoes de schema deste projeto foram aplicadas.
--
-- O QUE ESTA QUEBRADO
-- app/api/leads/route.ts monta um insert com 29 colunas. A tabela `leads` de
-- producao tem 23, e faltam 12 das que o endpoint envia. O PostgREST rejeita o
-- insert INTEIRO quando uma coluna nao existe: toda submissao do formulario
-- volta HTTP 400. Nenhum lead vindo do site esta sendo gravado.
--
-- SEGURANCA
-- Tudo aqui e idempotente: `add column if not exists`, `create table if not
-- exists`, `create index if not exists`. Rodar duas vezes nao causa efeito.
-- Nenhum comando apaga, renomeia ou altera tipo de coluna existente. Nenhuma
-- linha de dado e tocada.
-- ============================================================================

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. leads — as colunas que o endpoint envia
--
-- Das 22 listadas, 10 ja existem em producao (mensagem, consent_lgpd, page,
-- referer, gclid, fbclid, utm_source, utm_medium, utm_campaign, source) e viram
-- no-op. As 12 restantes sao as que faltam de verdade.
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

comment on column public.leads.source    is 'Origem automatica (utm_source ou site_org). Preenchida pelo endpoint.';
comment on column public.leads.page_slug is 'Slug da pagina que originou o lead — e por aqui que se mede conversao por artigo.';

-- `origem` existe no banco de desenvolvimento, onde guarda o rotulo escrito a
-- mao no admin, mas NAO existe em producao: la o mesmo conceito so aparece como
-- apelido de utm_source dentro de uma view sobre autosales_logs. COMMENT ON
-- COLUMN aborta a transacao inteira se a coluna nao existir.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'origem'
  ) then
    comment on column public.leads.origem is
      'Origem escrita a mao no admin. Nao e a mesma coisa que source.';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. blog_post_schedule_events e ai_generation_sessions
--
-- As duas JA EXISTEM em producao — conferido no dump do schema. Os comandos
-- abaixo sao no-op la, e existem para o banco de desenvolvimento, onde faltam.
-- A versao de producao de blog_post_schedule_events tem uma coluna a mais
-- (post_slug); `if not exists` preserva ela intacta.
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

create index if not exists idx_bpse_pendentes
  on public.blog_post_schedule_events (run_at)
  where executed_at is null;
create index if not exists idx_bpse_post on public.blog_post_schedule_events (post_id);

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

create index if not exists idx_ags_created on public.ai_generation_sessions (created_at desc);
create index if not exists idx_ags_status  on public.ai_generation_sessions (status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS
--
-- Producao tem RLS ligado so em `leads`. As duas tabelas abaixo sao tocadas
-- exclusivamente por rotas de admin via supabaseAdmin (service role), que ignora
-- RLS — conferido nas 15 chamadas de app/api/admin/blog/schedule/. Ligar RLS sem
-- policy nenhuma fecha as duas para o anon key que roda no navegador.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.blog_post_schedule_events enable row level security;
alter table public.ai_generation_sessions    enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. autosales_sequences — uma sequencia de follow-up por lead
--
-- src/lib/ai/autoSalesEngine.ts faz .upsert(payload, { onConflict: "lead_id" }) e
-- o Postgres responde 42P10 "there is no unique or exclusion constraint matching
-- the ON CONFLICT specification": o unico indice sobre lead_id e um btree comum.
-- Resultado: nenhuma sequencia de follow-up chega a ser criada.
--
-- Se producao tiver lead_id duplicado, o bloco aborta com o numero na mensagem em
-- vez do erro cru do Postgres — e a transacao inteira volta atras, sem dano.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  duplicados integer;
begin
  select count(*) into duplicados
  from (
    select lead_id
    from public.autosales_sequences
    group by lead_id
    having count(*) > 1
  ) t;

  if duplicados > 0 then
    raise exception
      'autosales_sequences tem % lead_id duplicados. Resolva os duplicados antes de criar o indice UNIQUE — cada duplicata e uma regua de mensagem paralela disparando para a mesma pessoa.',
      duplicados;
  end if;
end $$;

drop index if exists public.idx_autosales_sequences_lead;

create unique index if not exists idx_autosales_sequences_lead_unico
  on public.autosales_sequences (lead_id);

commit;

-- ============================================================================
-- VERIFICACAO — rode depois do COMMIT e confira o resultado
--
-- Esperado: as 12 colunas abaixo aparecem na lista. Se alguma faltar, o insert
-- do formulario continua voltando 400.
-- ============================================================================
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'leads'
  and column_name in (
    'prazo_aquisicao','consent_version','consent_timestamp',
    'page_type','page_slug','page_color','page_city','page_intent',
    'ip_address','user_agent','utm_content','utm_term'
  )
order by column_name;
