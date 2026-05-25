-- Full Text Search for blog_posts
-- Requires the 'portuguese' text search config (default in Postgres)

alter table if exists public.blog_posts
  add column if not exists tsv tsvector generated always as (
    setweight(to_tsvector('portuguese', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(subtitle,'')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(excerpt,'')), 'C') ||
    setweight(to_tsvector('portuguese', coalesce(content_mdx,'')), 'D')
  ) stored;

create index if not exists blog_posts_tsv_gin on public.blog_posts using gin (tsv);

