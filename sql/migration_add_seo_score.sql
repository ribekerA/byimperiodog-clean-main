-- Adiciona coluna seo_score e trigger para atualizar ao salvar
alter table if exists blog_posts add column if not exists seo_score integer;

create or replace function fn_compute_seo_score(mdx text, seo_title text, seo_description text, excerpt text)
returns integer language plpgsql as $$
DECLARE
  v_words int;
  v_headings int;
  v_images int;
  v_alts int;
  v_score int := 0;
BEGIN
  if mdx is null then mdx := ''; end if;
  -- contagem simples
  v_words := (select coalesce(array_length(regexp_split_to_array(mdx,'\s+'),1),0));
  v_headings := (select count(*) from regexp_matches(mdx,'^##\s.+$','gm'));
  v_images := (select count(*) from regexp_matches(mdx,'!\[[^\]]*\]\([^)]*\)','g'));
  v_alts := (select count(*) from regexp_matches(mdx,'!\[[^\]]+\]\([^)]*\)','g'));

  if v_words >= 800 then v_score := v_score + 20; end if;
  if v_words >= 1200 then v_score := v_score + 5; end if;
  if v_words >= 1800 then v_score := v_score + 5; end if;
  if v_headings >= 8 then v_score := v_score + 15; end if;
  if v_headings >= 12 then v_score := v_score + 5; end if;
  if v_images >= 2 then v_score := v_score + 10; end if;
  if v_images >= 4 then v_score := v_score + 5; end if;
  if v_images > 0 and v_alts = v_images then v_score := v_score + 10; end if;
  if v_images > 0 and v_alts >= (v_images * 7 / 10) then v_score := v_score + 5; end if;
  if seo_title is not null and seo_title <> '' then v_score := v_score + 5; end if;
  if seo_description is not null and seo_description <> '' then v_score := v_score + 5; end if;
  if excerpt is not null and excerpt <> '' then v_score := v_score + 5; end if;
  return v_score;
END;
$$;

create or replace function trg_blog_posts_seo_score()
returns trigger language plpgsql as $$
BEGIN
  NEW.seo_score := fn_compute_seo_score(NEW.content_mdx, NEW.seo_title, NEW.seo_description, NEW.excerpt);
  return NEW;
END;
$$;

drop trigger if exists blog_posts_seo_score_trg on blog_posts;
create trigger blog_posts_seo_score_trg before insert or update on blog_posts
  for each row execute procedure trg_blog_posts_seo_score();

-- backfill
update blog_posts set seo_score = fn_compute_seo_score(content_mdx, seo_title, seo_description, excerpt) where seo_score is null;
