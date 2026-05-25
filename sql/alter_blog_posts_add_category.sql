-- Migration: add category column to blog_posts
-- Safe to run multiple times (IF NOT EXISTS guards)

alter table public.blog_posts
  add column if not exists category text;

comment on column public.blog_posts.category is 'Primary category for the blog post (optional)';

-- Simple functional index for case-insensitive filtering
create index if not exists blog_posts_category_lower_idx
  on public.blog_posts (lower(category));

-- Optional: ensure empty strings are stored as NULL (idempotent approach via update)
update public.blog_posts set category = null where category = '';

-- (Optional future) Enforce length constraint at application layer; could add a check constraint:
-- alter table public.blog_posts add constraint blog_posts_category_length_chk
--   check (category is null or length(category) between 3 and 60);
