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

async function createTestPost() {
  try {
    // Criar post de teste
    const testPost = {
      title: 'Post de Teste para Embeddings',
      slug: 'post-teste-embeddings',
      content_mdx: '# Post de Teste\n\nEste é um post de teste para verificar o funcionamento do sistema de embeddings.\n\n## Conteúdo\n\nO sistema de embeddings ajuda na busca semântica de conteúdo, permitindo encontrar posts relacionados mesmo quando não compartilham as mesmas palavras-chave exatas.\n\nPor exemplo, se alguém buscar por "machine learning" ou "inteligência artificial", este post poderia aparecer nos resultados por causa da menção a embeddings e busca semântica.',
      excerpt: 'Post de teste para verificar o funcionamento do sistema de embeddings e busca semântica.',
      status: 'published',
      author_id: null, // opcional
      published_at: new Date().toISOString()
    }

    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert(testPost)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar post:', error)
      return
    }

    console.log('✅ Post de teste criado com sucesso:', post.id)

  } catch (err) {
    console.error('Erro geral:', err)
  }
}

createTestPost()