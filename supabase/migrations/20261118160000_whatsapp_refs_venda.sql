-- Venda marcada no codigo do WhatsApp (aprovado pelo usuario em 18/11/2026).
--
-- No dashboard do admin, quem atende cola o codigo que veio na conversa
-- ("cod. K7M2Q") e marca que virou venda. Aqui fica so a hora da marcacao:
-- nada sai para o Google Ads por causa disso.
--
-- Rodar de novo nao muda nada.

alter table public.whatsapp_refs add column if not exists venda_em timestamptz;
