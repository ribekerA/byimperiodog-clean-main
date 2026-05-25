-- pgvector extension (certifique-se de habilitar):
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de embeddings de posts
CREATE TABLE IF NOT EXISTS public.blog_post_embeddings (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'db', -- db | mdx | other
  embedding vector(1536), -- tamanho do modelo text-embedding-3-small
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, source)
);

-- Índice para busca vetorial aproximada (ajuste dependendo da estratégia)
-- CREATE INDEX IF NOT EXISTS blog_post_embeddings_embedding_idx ON public.blog_post_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Função para buscar vetorial (requer OPENAI HTTP ou pré-cálculo do vetor de consulta externo)
-- Exemplo de função (pseudocode) a ser adaptada em plpgsql + http extension se desejar gerar embedding on-the-fly
-- CREATE OR REPLACE FUNCTION public.blog_search_vector(query_text text)
-- RETURNS TABLE(post_id uuid, slug text, title text, excerpt text, similarity float)
-- LANGUAGE sql STABLE AS $$
--   SELECT e.post_id, p.slug, p.title, p.excerpt,
--     1 - (e.embedding <=> (SELECT embedding FROM query_embedding LIMIT 1)) AS similarity
--   FROM blog_post_embeddings e
--   JOIN blog_posts p ON p.id = e.post_id
--   WHERE p.status = 'published'
--   ORDER BY similarity DESC
--   LIMIT 25;
-- $$;

-- Observação: Necessário criar mecanismo para gerar embedding da query (query_embedding CTE) antes do SELECT acima.
