-- Base AI / Versionamento / Mídia
-- Executar no Supabase antes de usar os novos endpoints.

create table if not exists ai_tasks (
  id uuid primary key default gen_random_uuid(),
  type text not null,              -- outline | draft | enrich | rewrite | image | alt
  topic text,
  post_id uuid references blog_posts(id) on delete set null,
  phase text,                      -- fase atual (outline/expand/enrich/etc)
  status text not null default 'pending', -- pending | running | done | error | canceled
  progress int not null default 0, -- 0..100
  payload jsonb,
  result jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists ai_tasks_status_idx on ai_tasks(status);
create index if not exists ai_tasks_post_idx on ai_tasks(post_id);

create table if not exists blog_post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog_posts(id) on delete cascade,
  snapshot jsonb not null,
  reason text,
  created_by text,
  created_at timestamptz default now()
);
create index if not exists blog_post_versions_post_idx on blog_post_versions(post_id);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,
  mime text,
  width int,
  height int,
  size_bytes int,
  tags text[],
  dominant_color text,
  alt text,
  caption text,
  source text,         -- upload | ai | external
  created_by text,
  created_at timestamptz default now()
);
create index if not exists media_assets_tags_idx on media_assets using gin (tags);

-- Pivot de relacionamento post <-> mídia
create table if not exists post_media (
  post_id uuid references blog_posts(id) on delete cascade,
  media_id uuid references media_assets(id) on delete cascade,
  role text, -- cover | gallery | inline
  created_at timestamptz default now(),
  primary key(post_id, media_id)
);
create index if not exists post_media_role_idx on post_media(role);

-- (Opcional) se existir tabela antiga 'media' considerar migração manual
