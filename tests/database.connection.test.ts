import { createClient } from '@supabase/supabase-js'
import { describe, it, expect } from 'vitest'

// Este arquivo trazia a URL de producao e uma chave service_role escritas no
// codigo. Como o repositorio e publico, qualquer pessoa podia ler a chave — e,
// de quebra, `npm test` conversava com o banco real ignorando RLS a cada
// execucao. Agora as credenciais vem do ambiente e, sem elas, os testes sao
// pulados: nenhuma suite toca em producao por acidente.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const temCredenciais = Boolean(supabaseUrl) && Boolean(serviceRoleKey)

const descreve = temCredenciais ? describe : describe.skip

// O corpo do describe roda mesmo quando ele esta pulado, entao o cliente so
// pode nascer dentro do teste: com credencial vazia, createClient lanca erro e
// derrubaria a coleta da suite inteira.
const cliente = () =>
  createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

descreve('Testes de Conexão com Banco de Dados', () => {

  it('deve conectar ao Supabase', async () => {
    const { data, error } = await cliente().from('site_settings').select('*').limit(1)
    if (error) console.error('Erro de conexão:', error)
    expect(error).toBeNull()
    expect(data).toBeDefined()
  }, 10000)

  it('deve verificar a tabela de blog posts', async () => {
    const { data, error } = await cliente().from('blog_posts').select('*').limit(1)
    if (error) console.error('Erro na tabela blog_posts:', error)
    expect(error).toBeNull()
    expect(data).toBeDefined()
  }, 10000)

  it('deve verificar a tabela de análises', async () => {
    const { data, error } = await cliente().from('analytics_events').select('*').limit(1)
    if (error) console.error('Erro na tabela analytics_events:', error)
    expect(error).toBeNull()
    expect(data).toBeDefined()
  }, 10000)
})
