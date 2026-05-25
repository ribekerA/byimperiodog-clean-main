-- Blog categories and relations
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public._touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists t_blog_categories_touch on public.blog_categories;
create trigger t_blog_categories_touch before update on public.blog_categories
for each row execute function public._touch_updated_at();

create table if not exists public.blog_post_categories (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  category_id uuid not null references public.blog_categories(id) on delete cascade,
  primary key (post_id, category_id)
);

create index if not exists idx_blog_post_categories_post on public.blog_post_categories (post_id);
create index if not exists idx_blog_post_categories_category on public.blog_post_categories (category_id);

