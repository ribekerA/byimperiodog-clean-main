import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://npmnuihgydadihktglrd.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbW51aWhneWRhZGloa3RnbHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5MDA4NiwiZXhwIjoyMDcxMjY2MDg2fQ.IaBdH-IqdwNHNyDMREpYtRtwMEp5LIOirH1FHXWLiPw'

async function testConnection() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('Testando conexão com o Supabase...')
    
    // Teste 1: Verificar conexão básica
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
    
    if (settingsError) {
      console.error('Erro ao acessar site_settings:', settingsError)
    } else {
      console.log('site_settings OK:', settings)
    }

    // Teste 2: Verificar tabela de blog posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1)
    
    if (postsError) {
      console.error('Erro ao acessar blog_posts:', postsError)
    } else {
      console.log('blog_posts OK:', posts)
    }

    // Teste 3: Verificar status da conexão
    const { error: healthError } = await supabase.rpc('get_status')
    if (healthError) {
      console.error('Erro ao verificar status:', healthError)
    } else {
      console.log('Conexão saudável')
    }

  } catch (err) {
    console.error('Erro geral:', err)
  }
}

testConnection()