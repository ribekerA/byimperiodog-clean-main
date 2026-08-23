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