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