-- Funções / RPC auxiliares para busca híbrida
-- Execute no Supabase (SQL editor) após garantir extensão pg_trgm e/ou vector se necessário.

-- 1. Full-text search simples retornando rank
create or replace function public.blog_search_ft(q text, limit_rows int default 20)
returns table(id uuid, slug text, title text, excerpt text, rank real) language sql stable as $$
  select p.id, p.slug, p.title, p.excerpt,
         ts_rank_cd(setweight(to_tsvector('portuguese', coalesce(p.title,'')),'A') ||
                    setweight(to_tsvector('portuguese', coalesce(p.excerpt,'')),'B') ||
                    setweight(to_tsvector('portuguese', coalesce(p.content_mdx,'')),'C'), plainto_tsquery('portuguese', q)) as rank
  from blog_posts p
  where p.status = 'published'
    and ( setweight(to_tsvector('portuguese', coalesce(p.title,'')),'A') ||
          setweight(to_tsvector('portuguese', coalesce(p.excerpt,'')),'B') ||
          setweight(to_tsvector('portuguese', coalesce(p.content_mdx,'')),'C') ) @@ plainto_tsquery('portuguese', q)
  order by rank desc
  limit limit_rows;
$$;

-- 2. Vetor (pgvector) search (assume tabela blog_post_embeddings com col embedding vector(1536))
-- Requer: create extension if not exists vector;
-- Ajuste a dimensão conforme o modelo de embeddings.
create or replace function public.blog_search_vector(query_embedding vector(1536), match_count int default 20)
returns table(post_id uuid, slug text, title text, similarity float4) language plpgsql stable as $$
begin
  return query
  select e.post_id, p.slug, p.title,
         1 - (e.embedding <=> query_embedding) as similarity
  from blog_post_embeddings e
  join blog_posts p on p.id = e.post_id
  where p.status = 'published'
  order by e.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Índices recomendados
-- create index if not exists blog_posts_search_idx on blog_posts using gin (to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content_mdx,'')));
-- create index if not exists blog_post_embeddings_embedding_idx on blog_post_embeddings using ivfflat (embedding vector_ops) with (lists = 100);

-- OBS: Após criar estas funções, o endpoint /api/search combinará ambos os resultados.
