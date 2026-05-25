import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://npmnuihgydadihktglrd.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbW51aWhneWRhZGloa3RnbHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5MDA4NiwiZXhwIjoyMDcxMjY2MDg2fQ.IaBdH-IqdwNHNyDMREpYtRtwMEp5LIOirH1FHXWLiPw'

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