import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://npmnuihgydadihktglrd.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbW51aWhneWRhZGloa3RnbHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5MDA4NiwiZXhwIjoyMDcxMjY2MDg2fQ.IaBdH-IqdwNHNyDMREpYtRtwMEp5LIOirH1FHXWLiPw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testEmbeddingsTable() {
  try {
    // Teste 1: Verificar se a tabela existe
    const { data: tableInfo, error: tableError } = await supabase
      .from('blog_post_embeddings')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela:', tableError)
      return
    }
    console.log('✅ Tabela blog_post_embeddings está acessível')
    
    // Teste 2: Tentar inserir um registro de teste
    const testData = {
      post_id: '00000000-0000-0000-0000-000000000000', // UUID de teste
      source: 'test',
      embedding: '[]' // Array vazio como texto para teste
    }
    
    const { error: insertError } = await supabase
      .from('blog_post_embeddings')
      .upsert(testData)
    
    if (insertError && insertError.code === 'PGRST204') {
      console.log('✅ Políticas de segurança funcionando (bloqueio de insert sem autenticação)')
    } else if (insertError) {
      console.error('❌ Erro inesperado ao testar insert:', insertError)
    } else {
      console.log('✅ Inserção de teste bem sucedida')
    }

    // Teste 3: Verificar as políticas de RLS
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'blog_post_embeddings' })
    
    if (policiesError) {
      console.error('❌ Erro ao verificar políticas:', policiesError)
    } else {
      console.log('✅ Políticas configuradas:', policies)
    }

  } catch (err) {
    console.error('Erro geral:', err)
  }
}

testEmbeddingsTable()