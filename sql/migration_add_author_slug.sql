-- Add slug to blog_authors and ensure populated
alter table if exists public.blog_authors add column if not exists slug text unique;

update public.blog_authors
set slug = lower(regexp_replace(coalesce(name,''),'[^a-z0-9]+','-','g'))
where (slug is null or slug = '') and name is not null;

create or replace function public.blog_authors_slug_before()
returns trigger language plpgsql as $$
begin
  if NEW.slug is null or NEW.slug = '' then
    NEW.slug := lower(regexp_replace(coalesce(NEW.name,''),'[^a-z0-9]+','-','g'));
  end if;
  return NEW;
end;$$;

drop trigger if exists t_blog_authors_slug_before on public.blog_authors;
create trigger t_blog_authors_slug_before before insert or update on public.blog_authors
for each row execute function public.blog_authors_slug_before();

create index if not exists idx_blog_authors_slug on public.blog_authors(slug);
