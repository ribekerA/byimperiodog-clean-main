Blog - By Império Dog

Visão geral
- Páginas: `/blog` (lista), `/blog/[slug]` (post), e `/blog/tag/[slug]` (listagem por tag).
- Conteúdo principal em Supabase + MDX (renderizado com `next-mdx-remote`).
- Foco editorial: Spitz Alemão (Lulu da Pomerânia) — todo o fluxo de IA e SEO favorece esse tema.

Fluxo profissional (Admin)
- Editor do blog: `/admin/blog` e `/admin/blog/editor`.
- IA integrada: botão “IA: Gerar Artigo + Capa” cria um artigo com MDX, SEO básico e imagem de capa (OpenAI opcional).
- SEO assistido: em “SEO”, gere título/description via IA e rode Checklist (palavras, H2, links internos, capa etc.).
- Publicação/Agendamento: status, data/hora; endpoint automático para publicar os “due”.
- Comentários: aprovação em `/admin/blog/comments`.

Como publicar manualmente (Supabase)
1) Tabela `blog_posts`: preencha `slug`, `title`, `excerpt?`, `cover_url?`, `content_mdx`, `status` e `published_at`.
2) Opcional: `seo_title?`, `seo_description?`, `og_image_url?`.
3) ISR com `revalidate=60` atualiza as páginas.

Medição e pixels
- GA4/Ads/Meta/TikTok/Pinterest/Hotjar/Clarity via variáveis e/ou GTM em `app/layout.tsx`.
- Helper unificado: `src/lib/track.ts` (page_view e eventos) + `src/components/AnalyticsClient.tsx`.

SEO e estrutura
- Metadados por post: `src/lib/seo.ts` com overrides de `seo_overrides`.
- JSON-LD: `SeoArticle` inclui Article e FAQ gerado automaticamente ao detectar seção “Perguntas Frequentes” (H2 + H3/parágrafos).
- Sitemap e RSS: `app/(site)/blog/sitemap.xml/route.ts` e `app/blog/rss.xml/route.ts`.
- Tag pages: `app/(site)/blog/tag/[slug]/page.tsx` (melhor navegação/indexação).

IA focada em Spitz
- Escrita: `app/api/admin/blog/ai/write/route.ts` força palavras‑chave e valida menções a Spitz/Lulu; gera capa (OpenAI opcional) e salva como rascunho/publicado.
- Outline/Expand/SEO: rotas em `app/api/admin/blog/ai/*` com stubs seguros, funcionam sem chave; se `OPENAI_API_KEY` presente, usam GPT (conteúdo pt-BR).

Variáveis de ambiente essenciais
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` (admin), `OPENAI_API_KEY` (opcional para IA), IDs de pixels (GTM/GA4/FB/TT/Hotjar/Clarity/etc.).

Componentes relevantes
- Lista: `app/(site)/blog/page.tsx`.
- Post: `app/(site)/blog/[slug]/page.tsx` (MDX + extração de FAQ para schema).
- MDX map: `src/components/MDXContent.tsx`.
- SEO por post: `src/components/SeoArticle.tsx`.
- Pixels/Tracking: `app/layout.tsx`, `src/components/MarketingPixels.tsx`, `src/lib/track.ts`.

