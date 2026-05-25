import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from 'vitest'

const supabaseUrl = 'https://npmnuihgydadihktglrd.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbW51aWhneWRhZGloa3RnbHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5MDA4NiwiZXhwIjoyMDcxMjY2MDg2fQ.IaBdH-IqdwNHNyDMREpYtRtwMEp5LIOirH1FHXWLiPw'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

describe('Testes de Conexão com Banco de Dados', () => {
  it('deve conectar ao Supabase', async () => {
    const { data, error } = await supabase.from('site_settings').select('*').limit(1)
    if (error) console.error('Erro de conexão:', error)
    expect(error).toBeNull()
    expect(data).toBeDefined()
  }, 10000)

  it('deve verificar a tabela de blog posts', async () => {
    const { data, error } = await supabase.from('blog_posts').select('*').limit(1)
    if (error) console.error('Erro na tabela blog_posts:', error)
    expect(error).toBeNull()
    expect(data).toBeDefined()
  }, 10000)

  it('deve verificar a tabela de análises', async () => {
    const { data, error } = await supabase.from('analytics_events').select('*').limit(1)
    if (error) console.error('Erro na tabela analytics_events:', error)
    expect(error).toBeNull()
    expect(data).toBeDefined()
  }, 10000)
})