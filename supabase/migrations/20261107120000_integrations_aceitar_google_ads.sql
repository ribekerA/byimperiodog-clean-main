-- Amplia o check de provider da tabela integrations para aceitar 'google_ads'.
--
-- Por que isto existe: o adaptador google_ads ja esta no codigo -- a uniao
-- ProviderKey em src/lib/tracking/providers/types.ts lista os cinco
-- provedores -- mas a tabela nasceu em sql/integrations_tracking.sql com o
-- check limitado a quatro. Sem esta migration a falha chega no pior momento
-- possivel: o consentimento do Google termina, a conta e autorizada, e so
-- entao o upsert do callback morre com 23514 (check violation). Para quem
-- opera, parece que o Google recusou.

do $$
declare
  nome text;
begin
  -- Descobre o nome real do check em vez de supor 'integrations_provider_check':
  -- check inline dentro de create table recebe nome automatico, e esse nome
  -- varia conforme o caminho por onde a tabela foi aplicada.
  for nome in
    select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and rel.relname = 'integrations'
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%provider%'
  loop
    execute format('alter table public.integrations drop constraint %I', nome);
  end loop;
end
$$;

alter table public.integrations
  add constraint integrations_provider_check
  check (provider in ('facebook','google_ads','google_analytics','google_tag_manager','tiktok'));
