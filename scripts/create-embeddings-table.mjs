import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://npmnuihgydadihktglrd.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbW51aWhneWRhZGloa3RnbHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5MDA4NiwiZXhwIjoyMDcxMjY2MDg2fQ.IaBdH-IqdwNHNyDMREpYtRtwMEp5LIOirH1FHXWLiPw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createEmbeddingsTable() {
  try {
    // Verificar se a tabela existe
    const { error: tableError } = await supabase.from('blog_post_embeddings').select('*').limit(1)
    
    if (tableError && tableError.code === 'PGRST205') {
      // Tabela não existe, vamos criá-la
      const { error: createError } = await supabase.rpc('execute_sql', {
        sql_command: `
          CREATE TABLE IF NOT EXISTS public.blog_post_embeddings (
            post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
            source text NOT NULL DEFAULT 'db',
            embedding text, -- temporariamente como text até habilitar pgvector
            updated_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (post_id, source)
          );
        `
      })
      
      if (createError) {
        console.error('Erro ao criar tabela:', createError)
        return
      }
      console.log('✅ Tabela blog_post_embeddings criada com sucesso')
    } else if (tableError) {
      console.error('Erro ao verificar tabela:', tableError)
    } else {
      console.log('✅ Tabela blog_post_embeddings já existe')
    }

  } catch (err) {
    console.error('Erro geral:', err)
  }
}

createEmbeddingsTable()