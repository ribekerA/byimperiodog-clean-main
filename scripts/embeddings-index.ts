#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY;
if(!url || !key) { console.error('Missing Supabase env'); process.exit(1); }
const supa = createClient(url, key, { auth: { persistSession: false } });

interface DbPost { id: string; slug: string; title: string; excerpt: string | null; content_mdx: string | null; updated_at: string; }

async function fetchDbPosts(): Promise<DbPost[]> {
  const { data, error } = await supa.from('blog_posts').select('id,slug,title,excerpt,content_mdx,updated_at').eq('status','published').order('updated_at',{ ascending:false }).limit(500);
  if(error) throw error; return data || [];
}

// Leitura simples de posts MDX (Contentlayer) manual caso queira indexar também
function loadContentlayerMdx(): { slug: string; body: string }[] {
  const dir = path.join(process.cwd(), 'content','posts');
  if(!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.mdx'));
  return files.map(f=> ({ slug: f.replace(/\.mdx$/,''), body: fs.readFileSync(path.join(dir,f),'utf8') }));
}

async function embed(texts: { id: string; input: string; meta: any }[]) {
  if(!openaiKey){
    // fallback determinístico (hash simples -> vetor curto) apenas para não quebrar dev
    return texts.map(t=> ({ id: t.id, embedding: fakeVector(t.input) }));
  }
  // Chunk para evitar limites
  const batches: { id: string; input: string; meta: any }[][] = [];
  const size = 32;
  for(let i=0;i<texts.length;i+=size) batches.push(texts.slice(i,i+size));
  const out: { id: string; embedding: number[] }[] = [];
  for(const b of batches){
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: b.map(x=>x.input) })
    });
    if(!res.ok){ const txt = await res.text(); throw new Error('Embedding API falhou: '+txt); }
    const j = await res.json();
    j.data.forEach((row: any, idx: number)=> { out.push({ id: b[idx].id, embedding: row.embedding }); });
  }
  return out;
}

function fakeVector(s: string): number[] {
  // gera vetor de tamanho fixo 10 com base em hash
  const arr = new Array(10).fill(0);
  let h=0; for(const ch of s) { h = (h*31 + ch.charCodeAt(0))>>>0; }
  for(let i=0;i<arr.length;i++){ arr[i] = ( (h >> (i*3)) & 255 ) / 255; }
  return arr;
}

async function upsertEmbeddings(rows: { id: string; slug: string; embedding: number[]; source: string }[]) {
  // Requer tabela blog_post_embeddings (id uuid, post_id uuid, source text, embedding vector, updated_at timestamptz)
  // Upsert por (post_id, source)
  const payload = rows.map(r=> ({ post_id: r.id, source: r.source, embedding: r.embedding }));
  const { error } = await supa.from('blog_post_embeddings').upsert(payload, { onConflict: 'post_id,source' });
  if(error) throw error;
}

function toPlain(md: string): string {
  return md.replace(/```[\s\S]*?```/g,' ').replace(/[#>*_`]/g,' ').replace(/\s+/g,' ').trim();
}

async function run(){
  console.log('Carregando posts do banco...');
  const dbPosts = await fetchDbPosts();
  const mdxPosts = loadContentlayerMdx();
  console.log(`DB posts: ${dbPosts.length} | MDX posts: ${mdxPosts.length}`);

  const texts: { id: string; input: string; meta: any }[] = [];
  for(const p of dbPosts){
    const base = `${p.title}\n${p.excerpt||''}\n${p.content_mdx||''}`;
    texts.push({ id: p.id, input: toPlain(base).slice(0,8000), meta: { slug: p.slug, source:'db' } });
  }
  // Contentlayer posts (slug sem id -> usa slug como pseudo-id; poderia mapear depois)
  for(const m of mdxPosts){
    texts.push({ id: m.slug, input: toPlain(m.body).slice(0,8000), meta: { slug: m.slug, source:'mdx' } });
  }
  if(!texts.length){ console.log('Nada para indexar.'); return; }
  console.log('Gerando embeddings...');
  const vectors = await embed(texts);
  console.log('Upsert no banco...');
  const rows = vectors.map(v=> ({ id: v.id, slug: texts.find(t=>t.id===v.id)!.meta.slug, embedding: v.embedding, source: texts.find(t=>t.id===v.id)!.meta.source }));
  const dbRows = rows.filter(r=> /[0-9a-f-]{36}/.test(r.id));
  if(dbRows.length) await upsertEmbeddings(dbRows);
  console.log('Concluído. Vetores (db):', dbRows.length);
  if(rows.length !== dbRows.length) console.log('Vetores MDX não upsertados (precisa de tabela separada ou map):', rows.length - dbRows.length);
}
run().catch(e=> { console.error(e); process.exit(1); });
