-- Versionamento automático de blog_posts
-- Cria snapshot antes de updates significativos (ignora mudanças somente em updated_at / updated_by)

create or replace function public.blog_post_versions_capture()
returns trigger language plpgsql as $$
declare
  old_clean jsonb;
  new_clean jsonb;
begin
  old_clean := to_jsonb(OLD) - 'updated_at' - 'updated_by';
  new_clean := to_jsonb(NEW) - 'updated_at' - 'updated_by';
  if old_clean is distinct from new_clean then
    insert into public.blog_post_versions (post_id, snapshot, reason, created_by)
    values (OLD.id, to_jsonb(OLD), coalesce(current_setting('app.version_reason', true), 'auto'), null);
  end if;
  return NEW;
end; $$;

drop trigger if exists t_blog_post_versions_capture on public.blog_posts;
create trigger t_blog_post_versions_capture
before update on public.blog_posts
for each row execute function public.blog_post_versions_capture();
