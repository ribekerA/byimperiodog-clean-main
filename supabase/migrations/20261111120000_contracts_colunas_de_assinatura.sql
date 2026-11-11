-- Colunas que o fluxo de contrato usa e que nunca tiveram migração no repositório.
-- Sem elas: a assinatura feita pelo comprador não é gravada (signature_path) e o
-- envio para o ZapSign e o retorno dele falham (zapsign_*, signed_pdf_url).
--
-- Só acrescenta colunas vazias; não altera nem apaga nenhum dado existente.
-- A validade do link (expires_at) está em 20260828140000_security_and_lgpd_hardening.sql.
alter table if exists public.contracts
  add column if not exists signature_path text,
  add column if not exists zapsign_doc_token text,
  add column if not exists zapsign_sign_link text,
  add column if not exists zapsign_status text,
  add column if not exists signed_pdf_url text;

create index if not exists idx_contracts_zapsign_doc_token
  on public.contracts (zapsign_doc_token)
  where zapsign_doc_token is not null;
