-- Codigo curto no WhatsApp (aprovado pelo usuario em 18/11/2026).
--
-- Quem chega por anuncio do Google e toca num botao de WhatsApp leva na
-- mensagem um codigo como "(cod. K7M2Q)". O site grava aqui esse codigo junto
-- com o gclid/wbraid/gbraid do clique. Quando a conversa vira venda, o codigo
-- na mensagem liga a conversa ao clique do anuncio, sem por o gclid no texto.
--
-- So grava com aceite de marketing (o navegador nem guarda o gclid sem ele).
-- Nao guarda telefone, nome nem IP.
--
-- Rodar de novo nao muda nada.

create table if not exists public.whatsapp_refs (
  ref text primary key,
  gclid text,
  wbraid text,
  gbraid text,
  page text,
  puppy_slug text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_refs_created_at_idx on public.whatsapp_refs (created_at desc);

-- So o servidor (service_role) le e grava.
alter table public.whatsapp_refs enable row level security;
revoke all privileges on table public.whatsapp_refs from public, anon, authenticated;
