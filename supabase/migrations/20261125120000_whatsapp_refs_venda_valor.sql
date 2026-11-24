-- Valor da venda marcada no codigo do WhatsApp, em reais (BRL).
--
-- Usado no export de conversoes offline para o Google Ads
-- (src/lib/admin/whatsappVendasCsv.ts). Nulo = venda marcada sem valor;
-- essas vendas ficam de fora do export.
--
-- Rodar de novo nao muda nada.

alter table public.whatsapp_refs add column if not exists venda_valor numeric(10,2);
