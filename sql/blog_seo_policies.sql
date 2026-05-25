-- RLS policies for SEO tables to allow public read of post overrides on published posts

alter table if exists public.seo_overrides enable row level security;
drop policy if exists seo_overrides_public_read on public.seo_overrides;
create policy seo_overrides_public_read on public.seo_overrides
for select using (
  entity_type = 'post'
  and exists (
    select 1 from public.blog_posts p
    where p.id = entity_id and p.status = 'published'
  )
);

