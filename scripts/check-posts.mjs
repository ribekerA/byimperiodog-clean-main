import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://npmnuihgydadihktglrd.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbW51aWhneWRhZGloa3RnbHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5MDA4NiwiZXhwIjoyMDcxMjY2MDg2fQ.IaBdH-IqdwNHNyDMREpYtRtwMEp5LIOirH1FHXWLiPw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPosts() {
  // Verificar todos os posts
  const { data: posts, error: statsError } = await supabase
    .from('blog_posts')
    .select('status')

  if (statsError) {
    console.error('Erro ao verificar status dos posts:', statsError)
    return
  }

  console.log('Status dos posts:', posts?.length || 0, 'posts encontrados')
  if (posts && posts.length > 0) {
    const statusCount = posts.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1
      return acc
    }, {})
    console.table(statusCount)
  }

  // Verificar um post de exemplo
  const { data: sample, error: sampleError } = await supabase
    .from('blog_posts')
    .select('*')
    .limit(1)

  if (sampleError) {
    console.error('Erro ao buscar post de exemplo:', sampleError)
    return
  }

  if (sample && sample.length > 0) {
    console.log('\nEstrutura de um post:')
    console.log(JSON.stringify(sample[0], null, 2))
  }
}

checkPosts()