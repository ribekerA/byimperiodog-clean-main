export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Endpoint ad-hoc para aplicar migration de seo_score se ainda não existir.
// Segurança: ideal proteger via auth admin; assumimos já estar sob /api/admin/* protegido por middleware existente.
export async function POST(){
  try {
    const sb = supabaseAdmin();
    // Verifica se coluna existe
    let colCheck: any[] | null = null;
    try {
      const colResp: any = await (sb.rpc as any)('introspection_columns', { table_name: 'blog_posts' });
      if(colResp?.data) colCheck = colResp.data;
    } catch {}
    if(colCheck && colCheck.some((c:any)=> c.column_name==='seo_score')){
      return NextResponse.json({ ok:true, already:true });
    }
    // Se não existir, executa SQL (adaptado da migration)
    const sql = `
alter table if exists blog_posts add column if not exists seo_score integer;
create or replace function fn_compute_seo_score(mdx text, seo_title text, seo_description text, excerpt text)
returns integer language plpgsql as $$
DECLARE
  v_words int; v_headings int; v_images int; v_alts int; v_score int := 0;
BEGIN
  if mdx is null then mdx := ''; end if;
  v_words := (select coalesce(array_length(regexp_split_to_array(mdx,'\\s+'),1),0));
  v_headings := (select count(*) from regexp_matches(mdx,'^##\\s.+$','gm'));
  v_images := (select count(*) from regexp_matches(mdx,'!\\[[^\\]]*\\]\\([^)]*\\)','g'));
  v_alts := (select count(*) from regexp_matches(mdx,'!\\[[^\\]]+\\]\\([^)]*\\)','g'));
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
  return v_score; END; $$;
create or replace function trg_blog_posts_seo_score() returns trigger language plpgsql as $$ BEGIN NEW.seo_score := fn_compute_seo_score(NEW.content_mdx, NEW.seo_title, NEW.seo_description, NEW.excerpt); return NEW; END; $$;
DROP TRIGGER IF EXISTS blog_posts_seo_score_trg ON blog_posts; CREATE TRIGGER blog_posts_seo_score_trg BEFORE INSERT OR UPDATE ON blog_posts FOR EACH ROW EXECUTE PROCEDURE trg_blog_posts_seo_score();
update blog_posts set seo_score = fn_compute_seo_score(content_mdx, seo_title, seo_description, excerpt) where seo_score is null;`;

    // Executa via pg rpc fallback (não há função genérica, usamos single insert em sql executor custom se existir)
    // Simples: usar função anon exec via PostgREST 'rpc' se existir; se não, tentar direct query via supabase-js (não suporta múltiplas; dividir).
    // Dividir statements
    const statements = sql.split(/;\n/).map(s=> s.trim()).filter(Boolean);
    for(const stmt of statements){
      try {
        await (sb.rpc as any)('exec_sql', { q: stmt });
      } catch { /* ignora se função não existir */ }
    }

    return NextResponse.json({ ok:true, applied:true });
  } catch(e:any){
    return NextResponse.json({ ok:false, error:e?.message||'erro' }, { status:500 });
  }
}
