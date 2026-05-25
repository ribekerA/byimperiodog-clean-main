import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = 'https://npmnuihgydadihktglrd.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbW51aWhneWRhZGloa3RnbHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5MDA4NiwiZXhwIjoyMDcxMjY2MDg2fQ.IaBdH-IqdwNHNyDMREpYtRtwMEp5LIOirH1FHXWLiPw'
const openaiApiKey = process.env.OPENAI_API_KEY || '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'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

async function generateEmbeddings() {
  try {
    // 1. Buscar posts que ainda não têm embeddings
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, content_mdx, excerpt')
      .eq('status', 'published')
      .limit(5) // Limitar para teste
    
    if (postsError) {
      console.error('Erro ao buscar posts:', postsError)
      return
    }

    console.log(`Encontrados ${posts.length} posts para processar`)

    // 2. Para cada post, gerar embedding e salvar
    for (const post of posts) {
      try {
        // Preparar o texto para embedding (título + conteúdo)
        const text = `Título: ${post.title}\n\nResumo: ${post.excerpt}\n\nConteúdo: ${post.content_mdx}`
        
        // Gerar embedding via OpenAI
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text,
          encoding_format: "float"
        })

        // Salvar embedding no banco
        const { error: saveError } = await supabase
          .from('blog_post_embeddings')
          .upsert({
            post_id: post.id,
            source: 'openai',
            embedding: JSON.stringify(response.data[0].embedding),
            updated_at: new Date().toISOString()
          })

        if (saveError) {
          console.error(`Erro ao salvar embedding para post ${post.id}:`, saveError)
        } else {
          console.log(`✅ Embedding gerado e salvo para post ${post.id}`)
        }

      } catch (err) {
        console.error(`Erro ao processar post ${post.id}:`, err)
      }
    }

  } catch (err) {
    console.error('Erro geral:', err)
  }
}

generateEmbeddings()