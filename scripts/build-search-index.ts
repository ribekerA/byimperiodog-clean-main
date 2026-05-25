#!/usr/bin/env tsx
/**
 * Gera índice estático de busca em JSON a partir de blog_posts publicados.
 * Campos: slug, title, excerpt, published_at (ordenado por data desc)
 * Uso: npx tsx scripts/build-search-index.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function main(){
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('blog_posts')
    .select('slug,title,excerpt,published_at,status')
    .eq('status','published')
    .order('published_at', { ascending:false })
    .limit(2000);
  if(error) throw error;
  interface Row { slug:string; title:string; excerpt:string|null; published_at:string|null }
  const items = (data||[] as Row[]).map((p:Row)=> ({
    slug: p.slug,
    title: p.title,
    excerpt: (p.excerpt||'').slice(0,300),
    published_at: p.published_at,
    url: `/blog/${p.slug}`
  }));
  const outDir = path.join(process.cwd(), 'public');
  mkdirSync(outDir, { recursive:true });
  const outFile = path.join(outDir, 'search-index.json');
  writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), count: items.length, items }, null, 0));
  process.stdout.write(`search-index.json gerado com ${items.length} itens.\n`);
}
main().catch(e=>{ console.error('[build-search-index] erro', e); process.exit(1); });
