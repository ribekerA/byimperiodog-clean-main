-- Localizations per post
create table if not exists public.blog_post_localizations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  lang text not null,
  slug text not null,
  title text not null,
  subtitle text,
  content_mdx text,
  seo_title text,
  seo_description text,
  og_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_post_localizations_post_lang_uniq unique (post_id, lang),
  constraint blog_post_localizations_slug_lang_uniq unique (slug, lang)
);

drop trigger if exists t_blog_post_localizations_touch on public.blog_post_localizations;
create trigger t_blog_post_localizations_touch before update on public.blog_post_localizations
for each row execute function public._touch_updated_at();

create index if not exists idx_blog_post_localizations_post on public.blog_post_localizations (post_id);

