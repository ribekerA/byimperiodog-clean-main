-- migration/01_create_embeddings_table.sql
-- A extensão pgvector deve ser habilitada pelo administrador do Supabase

-- Criar tabela de embeddings
CREATE TABLE IF NOT EXISTS public.blog_post_embeddings (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'db',
  embedding text, -- temporariamente como text até habilitar pgvector
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, source)
);

-- Adicionar permissões RLS
ALTER TABLE public.blog_post_embeddings ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Permitir leitura pública de embeddings" ON public.blog_post_embeddings
  FOR SELECT
  USING (true);

-- Política para escrita apenas pelo serviço
CREATE POLICY "Permitir escrita apenas pelo serviço" ON public.blog_post_embeddings
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Política para atualização apenas pelo serviço
CREATE POLICY "Permitir atualização apenas pelo serviço" ON public.blog_post_embeddings
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Política para deleção apenas pelo serviço
CREATE POLICY "Permitir deleção apenas pelo serviço" ON public.blog_post_embeddings
  FOR DELETE
  USING (auth.role() = 'service_role');