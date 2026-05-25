import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://npmnuihgydadihktglrd.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbW51aWhneWRhZGloa3RnbHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5MDA4NiwiZXhwIjoyMDcxMjY2MDg2fQ.IaBdH-IqdwNHNyDMREpYtRtwMEp5LIOirH1FHXWLiPw'

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