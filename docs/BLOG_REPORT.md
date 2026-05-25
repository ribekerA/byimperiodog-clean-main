// BLOG: INVENTÁRIO

# Blog Module Report

## Inventário (arquivos/rotas/libs)

- Páginas públicas do blog:
  - `app/(site)/blog/page.tsx`
  - `app/(site)/blog/head.tsx`
  - `app/(site)/blog/[slug]/page.tsx`
  - `app/(site)/blog/[slug]/head.tsx`
  - `app/(site)/blog/tag/[slug]/page.tsx`
  - `app/(site)/blog/mapa/page.tsx`
  - `app/(site)/blog/sitemap.xml/route.ts`
  - `app/blog/robots.ts`
  - `app/blog/sitemap.ts`
  - `app/blog/preview/[slug]/page.tsx`
  - `app/blog/rss.xml/route.ts`

- Aliases/rotas adicionadas (compatibilidade com especificação):
  - `app/blog/page.tsx` → wrapper de `app/(site)/blog/page.tsx`
  - `app/blog/[slug]/page.tsx` → wrapper de `app/(site)/blog/[slug]/page.tsx`
  - `app/blog/[slug]/head.tsx` → wrapper de `app/(site)/blog/[slug]/head.tsx`
  - `app/tags/[tag]/page.tsx` → wrapper de `app/(site)/blog/tag/[slug]/page.tsx`
  - `app/search/page.tsx` → wrapper de `app/(site)/search/page.tsx`
  - `app/rss.xml/route.ts` → wrapper de `app/blog/rss.xml/route.ts`

- APIs do blog (existentes):
  - `app/api/qa/route.ts`
  - `app/api/qa/embed-missing/route.ts`
  - `app/api/search/route.ts`
  - `app/api/search/reindex/route.ts`
  - `app/api/gamification/claim/route.ts`

- Libs do blog:
  - `src/lib/seo.core.ts`, `src/lib/seo.blog.ts`
  - `src/lib/meili.ts`, `src/lib/rag.ts`
  - `src/lib/embeddings.store.blog.ts`
  - `src/lib/gamification.blog.ts`
  - `src/lib/blog.breadcrumbs.ts`, `src/lib/jsonld.ts`

- Componentes do blog:
  - `src/components/blog/QABlock.tsx`
  - `src/components/blog/PostCard.tsx`
  - `src/components/blog/GamificationWidget.tsx`
  - `src/components/SeoJsonLd.tsx`, `src/components/SeoArticle.tsx`

## Problemas encontrados (parcial - foco em SEO A)

- Ausência dos entrypoints exigidos para o blog: `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `app/blog/[slug]/head.tsx`, `app/tags/[tag]/page.tsx`, `app/search/page.tsx`, `app/rss.xml/route.ts`.
- `app/blog/robots.ts` não desabilitava `/api/` nem parâmetros de busca.
- `app/blog/sitemap.ts` cobria posts e listagem, mas não tags.

## Mudanças realizadas (fase A: SEO)

- Adicionados wrappers de rotas compatíveis com a nova estrutura exigida (ver lista em Inventário → Aliases).
- Ajustado `app/blog/robots.ts` para incluir `Disallow: /api/` e padrões de parâmetros de busca.
- Expandido `app/blog/sitemap.ts` para incluir tags do blog quando disponíveis, mantendo fallbacks seguros.

## Feature flags / Fallbacks

- SEO sem dependência de ENV adicional. `SITE_ORIGIN` derivado de `NEXT_PUBLIC_SITE_URL` com fallback hardcoded seguro.
- Supabase em sitemap usa consultas brandas; falhas retornam listas vazias sem quebrar o build.

## Checklist de aceitação (parcial – A)

- ✅ Head por post com canonical absoluto, OG/Twitter e JSON-LD (BlogPosting + BreadcrumbList; FAQ via `SeoArticle` quando houver).
- ✅ `app/blog/sitemap.ts` cobre posts e listagem e adiciona tags quando existentes.
- ✅ `app/blog/robots.ts` com `Disallow: /api/` e parâmetros de busca.
- ✅ Entry points principais do blog criados (wrappers) sem exigir mudanças de `.env*`.

Outras etapas (B–G) serão tratadas nas próximas fases deste relatório.

