-- Blog v2 schema extensions

-- Add richer fields to blog_posts
alter table if exists public.blog_posts
  add column if not exists content_blocks_json jsonb,
  add column if not exists gallery_json jsonb default '[]'::jsonb,
  add column if not exists canonical_url text,
  add column if not exists reading_time integer,
  add column if not exists updated_by uuid;

-- Optional index helpers
create index if not exists idx_blog_posts_published_at on public.blog_posts (published_at desc);

-- Media library (optional, can map to Supabase Storage)
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt text,
  width integer,
  height integer,
  credits text,
  created_at timestamptz not null default now()
);

-- Post ↔ Media (gallery and inline references)
create table if not exists public.post_media (
  post_id uuid references public.blog_posts(id) on delete cascade,
  media_id uuid references public.media(id) on delete cascade,
  role text check (role in ('cover','gallery','inline')) default 'gallery',
  position integer default 0,
  primary key (post_id, media_id, role)
);

create index if not exists idx_post_media_post on public.post_media (post_id);
create index if not exists idx_post_media_media on public.post_media (media_id);

-- Post revisions (history)
create table if not exists public.blog_post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.blog_posts(id) on delete cascade,
  snapshot jsonb not null,
  reason text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_blog_post_revisions_post on public.blog_post_revisions (post_id, created_at desc);

-- Generated columns helpers (optional) – update reading_time if null
create or replace function public.blog_posts_set_reading_time()
returns trigger language plpgsql as $$
declare
  wc integer := 0;
begin
  -- naive word count from excerpt + content_mdx
  wc := coalesce(array_length(regexp_split_to_array(coalesce(new.excerpt,'') || ' ' || coalesce(new.content_mdx,''), '\\s+'),1), 0);
  if (new.reading_time is null) then
    new.reading_time := greatest(1, ceil(wc::numeric / 200.0));
  end if;
  return new;
end $$;

drop trigger if exists t_blog_posts_set_reading_time on public.blog_posts;
create trigger t_blog_posts_set_reading_time before insert or update on public.blog_posts
for each row execute function public.blog_posts_set_reading_time();

