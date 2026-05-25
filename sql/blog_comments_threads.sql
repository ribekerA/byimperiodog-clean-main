-- Threaded comments and moderation signals
do $$ begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='blog_comments' and column_name='id'
  ) then
    alter table if exists public.blog_comments
      add column if not exists parent_id uuid references public.blog_comments(id) on delete cascade,
      add column if not exists user_agent text,
      add column if not exists ip_hash text,
      add column if not exists ai_score numeric,
      add column if not exists akismet_score numeric;
  end if;
end $$;

create index if not exists idx_blog_comments_post on public.blog_comments (post_id, approved, created_at desc);
create index if not exists idx_blog_comments_parent on public.blog_comments (parent_id);

