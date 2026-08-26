-- media_likes -- curtidas reais em fotos e videos
--
-- Uma linha por (midia, visitante). Nao existe contador guardado em lugar
-- nenhum: a contagem e sempre COUNT das linhas. Isso e de proposito -- numero
-- de curtida guardado a parte e numero que pode ser digitado, e nesta operacao
-- nada pode ser digitado. Se a tabela estiver vazia, a contagem e zero de
-- verdade, nao zero de enfeite.
--
-- visitor_hash NAO e o visitante. E HMAC-SHA256 de um token opaco de primeira
-- parte (cookie HttpOnly) com um segredo que so o servidor tem. O banco nunca
-- ve o token, nem IP, nem nome, nem telefone, nem WhatsApp, nem e-mail. Sem o
-- segredo, o hash nao volta a ser nada. O que ele resolve e uma coisa so: a
-- mesma pessoa nao curte a mesma foto duas vezes -- e por isso ele existe.
--
-- UNIQUE (media_id, visitor_hash) e o que da essa garantia no banco, e nao na
-- aplicacao. Corrida de dois cliques no mesmo instante bate no indice unico e
-- o segundo vira conflito, nao vira contagem dobrada.
--
-- media_id vem do registro de src/domain/media-registry.ts
-- (`gallery:spitz-branco`, `foto:filhotes/branco/branco-femea-jardim-01`).
-- Nao e indice de array: e derivado do arquivo, entao reordenar a galeria no
-- admin nao move curtida de uma foto para outra.
--
-- Idempotente: roda de novo sem erro e sem apagar nada.

create table if not exists public.media_likes (
  id           uuid        primary key default gen_random_uuid(),
  media_id     text        not null,
  media_type   text        not null check (media_type in ('image', 'video')),
  context_type text,
  context_id   text,
  visitor_hash text        not null,
  created_at   timestamptz not null default now()
);

-- Um voto por pessoa por midia. Descurtir e DELETE desta linha.
create unique index if not exists idx_media_likes_midia_visitante
  on public.media_likes (media_id, visitor_hash);

-- A leitura da pagina e um count agrupado por media_id para a lista de ids
-- daquela pagina (GET /api/media-likes?ids=...). Este indice cobre a varredura.
create index if not exists idx_media_likes_media_id
  on public.media_likes (media_id);

-- O painel /admin/media-engagement filtra por tipo e ordena por data.
create index if not exists idx_media_likes_created
  on public.media_likes (created_at desc);

comment on table public.media_likes is
  'Curtidas em fotos de filhote e videos da galeria. Uma linha por midia e visitante; a contagem e COUNT, nunca um numero guardado.';
comment on column public.media_likes.media_id is
  'Id estavel de src/domain/media-registry.ts. Ex.: gallery:spitz-branco, foto:filhotes/branco/branco-femea-jardim-01.';
comment on column public.media_likes.context_type is
  'Onde a midia foi curtida: puppy ou gallery. So rotulo de relatorio -- nao entra na chave unica.';
comment on column public.media_likes.context_id is
  'Slug do filhote ou do video. Idem: rotulo, nao chave.';
comment on column public.media_likes.visitor_hash is
  'HMAC-SHA256(token do cookie, MEDIA_LIKE_SECRET). Nao contem IP, nome, telefone nem e-mail e nao e reversivel sem o segredo.';

-- RLS
--
-- A tabela e tocada SOMENTE por /api/media-likes e /api/media-likes/toggle,
-- que rodam com a service role e ignoram RLS. Ligar RLS sem policy nenhuma e o
-- que fecha a tabela para a anon key que roda no navegador: o browser anonimo
-- nao insere, nao apaga e nao le visitor_hash de ninguem. E o exigido na especificacao.
alter table public.media_likes enable row level security;

-- Contagem em lote
--
-- A pagina de um filhote mostra ate uma duzia de midias e a /galeria mostra
-- treze. Uma consulta por midia seria N+1 no caminho mais visitado do site, e
-- trazer todas as linhas para contar no JavaScript cresce sem limite conforme
-- as curtidas chegam. O group by pertence ao banco, entao ele fica aqui: uma
-- ida, um array de ids, um numero por id.
--
-- Devolve so o par (media_id, total). visitor_hash nao sai desta funcao --
-- quem curtiu nao e pergunta que a contagem responde.
create or replace function public.media_likes_contagem(ids text[])
returns table (media_id text, total bigint)
language sql
stable
as $$
  select l.media_id, count(*)::bigint as total
  from public.media_likes l
  where l.media_id = any(ids)
  group by l.media_id
$$;

comment on function public.media_likes_contagem(text[]) is
  'Contagem de curtidas por midia, em lote. Usada por GET /api/media-likes.';
