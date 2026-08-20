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