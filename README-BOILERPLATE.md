# Boilerplate Blog IA Spitz Alemão Anão (By Imperio Dog)

Este template entrega base para blog premium com IA, Contentlayer e opção futura Sanity.

## Principais Tecnologias
- Next.js 14 App Router (RSC por padrão)
- Contentlayer (MDX) com remark/rehype (slug + autolink + pretty code + GFM)
- Tailwind + @tailwindcss/typography
- OpenAI (geração de conteúdo)
- Supabase (dados + embeddings futuro)

## Scripts
- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run seed` (placeholder, cria estrutura)
- `npm run embeddings:index` (placeholder)
- `npm run seo:audit` (placeholder)

## Próximos Passos
1. Adicionar migrations para tabelas: `blog_post_embeddings`, `analytics_events`, `web_vitals`.
2. Implementar endpoints IA completos conforme escopo detalhado.
3. Adicionar switch SANITY: variável `ENABLE_SANITY=1` e clients/groq.
4. Implementar coleta Web Vitals (INP/LCP/CLS) via script client + endpoint.
5. Implementar JSON-LD (Organization, WebSite, BlogPosting, BreadcrumbList).
6. Implementar sitemap shardável.
7. Criar componentes avançados (QuizMatcher, CompareBlock, PetTimeline, ShareButtons, LeadForm).

## ENV Base
```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://www.byimperiodog.com.br
```

## Observações
- Código criado para evolução incremental; endpoints IA adicionais ainda não gerados neste commit.
- Ajustar tipos Contentlayer se necessário para evitar any implícito.
