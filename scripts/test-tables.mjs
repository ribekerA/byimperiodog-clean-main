import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
// A service_role ignora RLS: ela nunca pode ficar escrita no arquivo — este
// repositorio e publico. Rode com a chave no ambiente, por exemplo:
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/test-db.mjs
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente antes de rodar este script.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testTables() {
  const tables = [
    'analytics_events',
    'blog_categories',
    'blog_comments',
    'blog_post_embeddings',
    'media'
  ]

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)

      if (error) {
        console.error(`Erro na tabela ${table}:`, error)
      } else {
        console.log(`✅ Tabela ${table} OK`)
      }
    } catch (err) {
      console.error(`Erro ao testar tabela ${table}:`, err)
    }
  }
}

testTables()