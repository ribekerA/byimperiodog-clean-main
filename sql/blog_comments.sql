-- Comments table for blog posts
create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.blog_posts(id) on delete cascade,
  author_name text,
  author_email text,
  body text not null,
  approved boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_blog_comments_post_id on public.blog_comments(post_id);
create index if not exists idx_blog_comments_post_approved_created on public.blog_comments(post_id, approved, created_at desc);

-- Enable RLS and add basic policies
alter table public.blog_comments enable row level security;

-- Public can read only approved comments
drop policy if exists blog_comments_public_read on public.blog_comments;
create policy blog_comments_public_read on public.blog_comments
for select using (approved = true);

-- Inserts are handled by server (service role) only; no public insert policy
