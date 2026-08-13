-- ============================================================================
-- Uma sequencia de follow-up por lead.
--
-- CONTEXTO
-- src/lib/ai/autoSalesEngine.ts faz
--   .upsert(payload, { onConflict: "lead_id" })
-- e o Postgres respondia 42P10 "there is no unique or exclusion constraint
-- matching the ON CONFLICT specification": o unico indice sobre lead_id era
-- `idx_autosales_sequences_lead`, um btree comum, sem UNIQUE. Resultado: nenhuma
-- sequencia de follow-up chegou a ser criada — a tabela estava com 0 linhas
-- mesmo com leads entrando.
--
-- POR QUE UNIQUE E A SEMANTICA CERTA
-- O proprio upsert ja declara a intencao: quando o mesmo lead volta, a linha
-- existente e substituida em vez de virar uma segunda sequencia paralela. Duas
-- sequencias ativas para o mesmo lead significariam duas reguas de mensagem
-- disparando para a mesma pessoa.
--
-- Seguro de rodar: a tabela nao tem lead_id duplicado (verificado antes de
-- aplicar). Se algum dia tiver, a criacao do indice falha em vez de apagar dado.
-- ============================================================================

-- O indice nao-unico vira redundante: o UNIQUE abaixo atende as mesmas consultas.
drop index if exists public.idx_autosales_sequences_lead;

create unique index if not exists idx_autosales_sequences_lead_unico
  on public.autosales_sequences (lead_id);

comment on index public.idx_autosales_sequences_lead_unico is
  'Garante uma sequencia de follow-up por lead. E o alvo do ON CONFLICT (lead_id) do autoSalesEngine.';
