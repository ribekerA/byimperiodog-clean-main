# Blog By Imperio Dog

## Visão Geral
Implementação de blog com Next.js (App Router), Contentlayer (MDX) e fallback Supabase para posts gerados por IA. Suporte a SEO 2025 (JSON-LD, OG dinâmico), TOC com scroll-spy, recomendações, FAQ estruturado e endpoints de IA auxiliares.

## Estrutura
- Contentlayer: `content/posts/*.mdx`
- Rotas principais:
  - `/blog` listagem + busca + tag
  - `/blog/[slug]` post
  - `/api/ai/*` endpoints IA (seo, captions, recommend)
  - `/api/search` busca híbrida simples (FTS + vetor se RPCs configuradas)
  - `/og` geração de imagem OG dinâmica

## Criar Post MDX
1. Adicionar arquivo em `content/posts/nome-do-post.mdx` com frontmatter:
```
---
title: "Título"
description: "Resumo curto"
date: "2025-09-07"
cover: "/path/capa.jpg"
tags: ["spitz", "filhote"]
category: "Cuidados"
author: "Equipe"
---
```
2. Conteúdo usa MDX. Headings H2/H3 viram TOC.
3. `readingTime` calculado automaticamente.

## Geração OG
`/og?title=Titulo&subtitle=Sub&category=Cat` retorna imagem 1200x630.

## Endpoints IA
- `POST /api/ai/seo` -> { seo_title, seo_description, alt_cover, og_text, internal_links }
- `POST /api/ai/captions` -> { captions[] }
- `POST /api/ai/recommend` -> { related[] } (simples supabase)

## Busca
`GET /api/search?q=spitz`
Se funções RPC `blog_search_ft` e `blog_search_vector` existirem, combina scores.

## Switch futuro CMS (Sanity)
Defina `CMS_DRIVER=sanity` (não implementado ainda – placeholder; manter Contentlayer como padrão).

## Tarefas Futuras
- Enriquecer IA (outline -> draft -> enrich) consolidando pipeline.
- Implementar categorias e autores dinâmicos (tabelas dedicadas) + páginas /categorias /autores.
- Melhorar recomendações com embeddings reais.
- Adicionar schema Article + FAQ via componente isolado (já parcial).

## Acessibilidade & Performance
- TOC usa IntersectionObserver (light) e respeita layout estático.
- Imagens: usar `next/image` (ajustar fallback para capas supabase se necessário).

## Changelog
Ver arquivo CHANGELOG_BLOG.md (a criar) ou diff git.
