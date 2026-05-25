-- Blog schema for By Império Dog
create table if not exists public.blog_authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  avatar_url text,
  socials jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  cover_url text,
  excerpt text,
  content_mdx text,
  status text not null default 'draft' check (status in ('draft','review','scheduled','published','archived')),
  scheduled_at timestamptz,
  published_at timestamptz,
  author_id uuid references public.blog_authors(id) on delete set null,
  seo_title text,
  seo_description text,
  og_image_url text,
  lang text default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists public.blog_post_tags (
  post_id uuid references public.blog_posts(id) on delete cascade,
  tag_id uuid references public.blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- Índices para acelerar filtros por tag e post
create index if not exists idx_blog_post_tags_post on public.blog_post_tags (post_id);
create index if not exists idx_blog_post_tags_tag on public.blog_post_tags (tag_id);

create or replace function public.blog_posts_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists t_blog_posts_touch on public.blog_posts;
create trigger t_blog_posts_touch before update on public.blog_posts
for each row execute function public.blog_posts_touch();

-- RLS: leitura pública apenas de publicados
alter table public.blog_posts enable row level security;
drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read on public.blog_posts
for select using (status = 'published');

-- índices auxiliares
create index if not exists idx_blog_posts_status_published_at on public.blog_posts (status, published_at desc);
create index if not exists idx_blog_posts_slug on public.blog_posts (slug);

-- Optional: auto-set published_at if status changes to 'published' and field is null
create or replace function public.blog_posts_set_published_at()
returns trigger language plpgsql as $$
begin
  if NEW.status = 'published' and (NEW.published_at is null) then
    NEW.published_at = now();
  end if;
  return NEW;
end; $$;

drop trigger if exists t_blog_posts_set_published_at on public.blog_posts;
create trigger t_blog_posts_set_published_at before insert or update on public.blog_posts
for each row execute function public.blog_posts_set_published_at();
