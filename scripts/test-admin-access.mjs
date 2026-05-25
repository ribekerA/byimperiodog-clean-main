#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Testa conexão do admin com SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

// Parse .env.local
const envFile = readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Diagnóstico de Acesso Admin\n');
console.log('📌 Credenciais:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', url ? '✅' : '❌');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? '✅' : '❌');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✅' : '❌');

if (!url) {
  console.error('\n❌ NEXT_PUBLIC_SUPABASE_URL ausente');
  process.exit(1);
}

if (!serviceKey) {
  console.error('\n❌ SUPABASE_SERVICE_ROLE_KEY ausente (necessária para admin)');
  process.exit(1);
}

// Teste com SERVICE_ROLE_KEY (admin)
const sbAdmin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  console.log('\n📊 Testando acesso admin...\n');

  const { data: posts, error, count } = await sbAdmin
    .from('blog_posts')
    .select('id,slug,title,status,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Erro ao buscar posts:', error.message);
    process.exit(1);
  }

  console.log(`✅ Total de posts no banco: ${count}`);
  
  if (posts && posts.length > 0) {
    console.log('\n📋 Posts encontrados:');
    posts.forEach(p => {
      console.log(`  ${p.status.padEnd(12)} | ${p.slug.slice(0, 50)}`);
    });
  } else {
    console.log('\n⚠️  Nenhum post encontrado!');
  }

  // Testar listSummaries
  console.log('\n🔎 Testando query listSummaries simulada...\n');
  
  const { data: summaries, error: err2, count: count2 } = await sbAdmin
    .from('blog_posts')
    .select(
      'id,slug,title,subtitle,excerpt,status,cover_url,published_at,created_at,updated_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (err2) {
    console.error('❌ Erro em listSummaries:', err2.message);
  } else {
    console.log(`✅ listSummaries retornou ${summaries?.length || 0} posts (total: ${count2})`);
  }

  console.log('\n✨ Diagnóstico concluído!\n');
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err);
  process.exit(1);
});
