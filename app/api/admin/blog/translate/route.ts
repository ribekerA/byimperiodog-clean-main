export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/*
  POST /api/admin/blog/translate
  Body: { post_id: string; target_lang: string; force?: boolean }
  - Gera versão localizada do post em blog_post_localizations se não existir
  - Usa OpenAI ou fallback simples
*/

interface TranslateReq { post_id: string; target_lang: string; force?: boolean }

export async function POST(req: Request){
  try {
    const body = await req.json() as TranslateReq;
    if(!body.post_id || !body.target_lang) return NextResponse.json({ ok:false, error:'post_id e target_lang obrigatórios'}, { status:400 });
    const lang = body.target_lang;
    const sb = supabaseAdmin();
    // Carrega post base
    const { data: post, error } = await sb.from('blog_posts').select('id,slug,title,content_mdx,seo_title,seo_description').eq('id', body.post_id).single();
    if(error || !post) return NextResponse.json({ ok:false, error:'Post não encontrado'}, { status:404 });

    if(!body.force){
      const { data: existing } = await sb.from('blog_post_localizations').select('id,slug').eq('post_id', post.id).eq('lang', lang).maybeSingle();
      if(existing) return NextResponse.json({ ok:true, reused:true, localization_id: existing.id, slug: existing.slug });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    let translatedMDX: string; let translatedTitle: string; let translatedSeoTitle: string; let translatedSeoDesc: string;
    if(!openaiKey){
      // fallback simples (marca idioma, não traduz realmente)
      translatedTitle = `[${lang}] ${post.title}`;
      translatedMDX = `# ${translatedTitle}\n\n_Tradução placeholder (${lang})_\n\n` + (post.content_mdx||'');
      translatedSeoTitle = `[${lang}] ${post.seo_title || post.title}`.slice(0,60);
      translatedSeoDesc = `[${lang}] ${post.seo_description || post.title}`.slice(0,155);
    } else {
      const prompt = `Traduza mantendo estrutura MDX e headings, adaptando para SEO natural no idioma alvo. Responda somente o MDX. Idioma destino: ${lang}. Texto:\n\n${post.content_mdx}`;
      const res = await fetch('https://api.openai.com/v1/chat/completions',{ method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${openaiKey}`}, body: JSON.stringify({ model:'gpt-4o-mini', temperature:0.4, messages:[{ role:'user', content: prompt }], max_tokens:4000 }) });
      if(!res.ok){ const t = await res.text(); throw new Error('Falha OpenAI translate: '+t); }
      const j = await res.json();
      translatedMDX = j.choices?.[0]?.message?.content || post.content_mdx;
      translatedTitle = extractFirstHeading(translatedMDX) || post.title;
      translatedSeoTitle = translatedTitle.slice(0,60);
      translatedSeoDesc = (post.seo_description || post.title).slice(0,155); // poderia re-gerar
    }

    const locSlug = `${post.slug}-${lang.toLowerCase()}`.replace(/[^a-z0-9-]/g,'');
    const { data: loc, error: locErr } = await sb.from('blog_post_localizations').insert([{ post_id: post.id, lang, slug: locSlug, title: translatedTitle, subtitle: null, content_mdx: translatedMDX, seo_title: translatedSeoTitle, seo_description: translatedSeoDesc, og_image_url: null }]).select('id,slug').single();
    if(locErr) throw locErr;

    return NextResponse.json({ ok:true, localization_id: loc.id, slug: loc.slug });
  } catch(e:any){
    return NextResponse.json({ ok:false, error: e.message }, { status:500 });
  }
}

function extractFirstHeading(mdx: string): string | null {
  const m = mdx.match(/^#\s+(.+)$/m); return m? m[1].trim(): null;
}
