-- ============================================================================
-- PRODUCAO — 13/08/2026 (segunda parte) — as 3 colunas que ainda faltam
--
-- POR QUE EXISTE
-- O producao_2026_08_13_leads_e_autosales.sql ja foi executado e as 22 colunas
-- dele estao la — conferido lendo o catalogo do projeto npmnuihgydadihktglrd.
-- Mas o insert de app/api/leads/route.ts manda 29 chaves, e tres delas ainda
-- nao tem coluna correspondente em producao:
--
--     estado           (obrigatorio no formulario: UF com 2 letras)
--     sexo_preferido   (macho | femea | tanto_faz)
--     cor_preferida    (texto livre)
--
-- Nenhuma migration deste repositorio criou essas tres em lugar nenhum: elas so
-- existiam no banco local. O PostgREST recusa o insert INTEIRO quando uma chave
-- nao e coluna (PGRST204), entao o formulario continua sem gravar. O admin
-- tambem le as tres (leads/queries.ts filtra e lista por cor_preferida,
-- sexo_preferido e estado), entao a lista de leads sofre do mesmo problema.
--
-- SEGURANCA
-- Idempotente: `add column if not exists`. Nao apaga, nao renomeia, nao muda
-- tipo e nao toca em nenhuma linha existente — as colunas nascem NULL.
-- Sem CHECK de dominio: quem restringe o valor e o zod do endpoint publico.
-- ============================================================================

begin;

alter table public.leads add column if not exists estado         text;
alter table public.leads add column if not exists sexo_preferido text;
alter table public.leads add column if not exists cor_preferida  text;

comment on column public.leads.estado         is 'UF de quem preencheu. O formulario publico manda 2 letras maiusculas.';
comment on column public.leads.sexo_preferido is 'Preferencia declarada. Formulario publico: macho, femea ou tanto_faz.';
comment on column public.leads.cor_preferida  is 'Cor declarada no formulario. Texto livre — nao e a cor de nenhum filhote do catalogo.';

commit;

-- ============================================================================
-- CONFERENCIA — rode depois. Tem que voltar 3 linhas.
-- ============================================================================
-- select column_name, data_type
--   from information_schema.columns
--  where table_schema = 'public'
--    and table_name   = 'leads'
--    and column_name in ('estado','sexo_preferido','cor_preferida')
--  order by column_name;
