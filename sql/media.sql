-- Tabelas de mídia (assets genéricos e associação a posts do blog)
-- Execute no Supabase. Usa extensões padrão (pgcrypto para gen_random_uuid já assumida em outros scripts).

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  file_path text not null unique,
  alt text null,
  caption text null,
  tags text[] null,
  source text null,
  created_at timestamptz not null default now()
);

create table if not exists public.post_media (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete cascade,
  role text not null check (role in ('cover','gallery','inline')),
  position int not null default 0,
  created_at timestamptz not null default now(),
  primary key (post_id, media_id, role)
);

create index if not exists post_media_post_role_idx on public.post_media(post_id, role);
create index if not exists media_assets_created_idx on public.media_assets(created_at desc);

-- Restringe a apenas um cover por post (índice parcial)
create unique index if not exists post_media_unique_cover on public.post_media(post_id) where role = 'cover';

-- RLS opcional (descomentar se quiser habilitar e criar policies). Mantemos desabilitado por ora para simplificar ingest via service role.
-- alter table public.media_assets enable row level security;
-- alter table public.post_media enable row level security;

-- DONE
