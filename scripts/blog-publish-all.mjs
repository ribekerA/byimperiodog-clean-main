#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Publica todos os posts em status draft ou review.
 * Uso: node scripts/blog-publish-all.mjs [--dry]
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const dry = process.argv.includes('--dry');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url || !key){
  console.error('[publish-all] Variáveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession:false }});

async function main(){
  const { data: posts, error } = await sb.from('blog_posts').select('id, slug, status').in('status',['draft','review']);
  if(error){
    console.error('[publish-all] Erro buscando posts:', error.message);
    process.exit(1);
  }
  if(!posts || posts.length===0){
    console.log('[publish-all] Nada a publicar');
    return;
  }
  console.log(`[publish-all] Encontrados ${posts.length} posts para publicar`);
  if(dry){
    posts.forEach(p=> console.log(` - ${p.slug} (${p.status})`));
    console.log('[publish-all] --dry ativo, nenhuma mudança aplicada.');
    return;
  }
  const now = new Date().toISOString();
  const { error: upErr } = await sb.from('blog_posts').update({ status:'published', published_at: now, scheduled_at: null }).in('id', posts.map(p=>p.id));
  if(upErr){
    console.error('[publish-all] Falha ao publicar:', upErr.message);
    process.exit(1);
  }
  console.log('[publish-all] Publicação concluída.');
}

main();
