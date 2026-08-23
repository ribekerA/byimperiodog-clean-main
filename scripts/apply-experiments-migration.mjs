#!/usr/bin/env node
// Script para aplicar migração experiments.sql
// Uso: node scripts/apply-experiments-migration.mjs

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Carrega .env.local manualmente
const envPath = join(rootDir, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#][^=]*?)\s*=\s*(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos');
  process.exit(1);
}

console.log('🚀 Aplicando migração experiments.sql...\n');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Lê o SQL
const sqlPath = join(rootDir, 'sql', 'experiments.sql');
const sqlContent = readFileSync(sqlPath, 'utf-8');

console.log('📄 SQL lido:', sqlContent.length, 'caracteres');

// Primeiro, garante que a função _touch_updated_at existe
console.log('🔍 Verificando função _touch_updated_at...');

const createFunctionSql = `
CREATE OR REPLACE FUNCTION public._touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;
`;

try {
  const { error: funcError } = await supabase.rpc('exec', { sql: createFunctionSql });
  if (funcError && !funcError.message.includes('does not exist')) {
    console.warn('⚠️  Aviso ao criar função:', funcError.message);
  } else {
    console.log('✅ Função _touch_updated_at pronta');
  }
} catch (err) {
  console.warn('⚠️  Não foi possível verificar função via RPC:', err.message);
}

// Executa a migração dividida em comandos
console.log('\n📦 Criando tabela experiments...');

const commands = [
  // Cria tabela
  `CREATE TABLE IF NOT EXISTS public.experiments (
    id uuid primary key default gen_random_uuid(),
    key text unique not null,
    name text not null,
    description text,
    status text not null default 'draft',
    audience text,
    variants jsonb not null default '[]'::jsonb,
    starts_at timestamptz,
    ends_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,

  // Cria índices
  `CREATE INDEX IF NOT EXISTS idx_experiments_status ON public.experiments (status)`,
  `CREATE INDEX IF NOT EXISTS idx_experiments_key ON public.experiments (key)`,

  // Cria trigger
  `DROP TRIGGER IF EXISTS t_experiments_touch ON public.experiments`,
  `CREATE TRIGGER t_experiments_touch BEFORE UPDATE ON public.experiments
   FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at()`,

  // Adiciona comentários
  `COMMENT ON TABLE public.experiments IS 'A/B tests and experiments configuration'`,
  `COMMENT ON COLUMN public.experiments.key IS 'Unique identifier used in tracking events'`,
  `COMMENT ON COLUMN public.experiments.variants IS 'Array of variant definitions with keys, labels, and traffic weights'`
];

let successCount = 0;
for (const cmd of commands) {
  try {
    const { error } = await supabase.rpc('exec', { sql: cmd });
    if (error) {
      // Tenta via query direto se RPC falhar
      const { error: queryError } = await supabase.from('_sql').select('*').eq('query', cmd);
      if (queryError) {
        console.error('❌ Erro ao executar:', cmd.substring(0, 50) + '...');
        console.error('   ', error.message);
      } else {
        successCount++;
      }
    } else {
      successCount++;
    }
  } catch (err) {
    console.warn('⚠️  Comando ignorado:', cmd.substring(0, 50) + '...');
  }
}

console.log(`\n✅ Migração processada (${successCount}/${commands.length} comandos)`);

// Valida se tabela foi criada
console.log('\n🔍 Validando tabela...');
const { data, error } = await supabase
  .from('experiments')
  .select('count')
  .limit(0);

if (error) {
  console.error('❌ Erro: Tabela experiments não encontrada');
  console.error('   ', error.message);
  console.log('\n📝 SOLUÇÃO MANUAL:');
  console.log('1. Acesse: https://supabase.com/dashboard');
  console.log('2. Vá em SQL Editor → New query');
  console.log('3. Copie o conteúdo de sql/experiments.sql');
  console.log('4. Cole e clique em Run');
  process.exit(1);
}

console.log('✅ Tabela experiments criada com sucesso!');
console.log('\n🎯 Próximo passo: npm run seed');
