#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Script de diagnóstico para testar query de posts do blog
 * Verifica se os posts existem no banco e se estão sendo retornados corretamente
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

// Parse .env.local manually
const envFile = readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Diagnóstico de Posts do Blog\n');
console.log('📌 Variáveis de ambiente:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', url ? '✅ Configurada' : '❌ Ausente');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? '✅ Configurada' : '❌ Ausente');

if (!url || !key) {
  console.error('\n❌ Variáveis de ambiente ausentes. Configure .env.local');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  console.log('\n📊 Testando queries...\n');

  // 1. Contar TODOS os posts
  const { count: totalCount, error: countError } = await sb
    .from('blog_posts')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Erro ao contar posts:', countError.message);
  } else {
    console.log(`✅ Total de posts na tabela: ${totalCount}`);
  }

  // 2. Contar posts publicados
  const { count: publishedCount, error: pubError } = await sb
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  if (pubError) {
    console.error('❌ Erro ao contar posts publicados:', pubError.message);
  } else {
    console.log(`✅ Posts com status='published': ${publishedCount}`);
  }

  // 3. Buscar posts por status (ver quais status existem)
  const { data: allPosts, error: allError } = await sb
    .from('blog_posts')
    .select('id,slug,title,status,published_at,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (allError) {
    console.error('❌ Erro ao buscar posts:', allError.message);
  } else {
    console.log(`\n📋 Primeiros ${allPosts?.length || 0} posts:`);
    const statusCount = {};
    allPosts?.forEach((post) => {
      statusCount[post.status] = (statusCount[post.status] || 0) + 1;
      console.log(`  ${post.status.padEnd(12)} | ${post.slug.padEnd(40)} | ${post.title.slice(0, 50)}`);
    });
    console.log('\n📊 Distribuição por status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  }

  // 4. Testar query exata da página /blog
  console.log('\n🔎 Testando query exata da página /blog:\n');
  const { data: blogPosts, error: blogError, count: blogCount } = await sb
    .from('blog_posts')
    .select(
      'id,slug,title,excerpt,cover_url,cover_alt,published_at,updated_at,content_mdx,status,category,tags,author_id',
      { count: 'exact' }
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(60);

  if (blogError) {
    console.error('❌ Erro na query do blog:', blogError.message);
  } else {
    console.log(`✅ Query retornou ${blogPosts?.length || 0} posts (count: ${blogCount})`);
    if (blogPosts && blogPosts.length > 0) {
      console.log('\n📝 Posts retornados:');
      blogPosts.slice(0, 5).forEach((post) => {
        console.log(`  • ${post.slug} - ${post.title}`);
        console.log(`    published_at: ${post.published_at || 'null'}`);
        console.log(`    status: ${post.status}`);
      });
    } else {
      console.log('\n⚠️  Nenhum post retornado pela query do blog!');
      console.log('\n🔍 Possíveis causas:');
      console.log('  1. Nenhum post com status="published"');
      console.log('  2. Problemas com RLS (Row Level Security) no Supabase');
      console.log('  3. Posts não têm published_at definido');
    }
  }

  // 5. Verificar RLS
  console.log('\n🔐 Verificando políticas RLS...');
  const { data: policies } = await sb.rpc('pg_policies').select('*').eq('tablename', 'blog_posts');
  console.log('Políticas RLS:', policies ? `${policies.length} encontradas` : 'Não foi possível verificar (função não existe)');

  console.log('\n✨ Diagnóstico concluído!\n');
}

main().catch((err) => {
  console.error('\n❌ Erro fatal:', err);
  process.exit(1);
});
