# PROJECT_AUDIT (v1)

## 1) Árvore de Pastas (nível 3)
- app/
  - (site)/: páginas públicas e blog
    - blog/, categorias/, autores/, filhotes/, etc.
  - (admin)/admin/: painel (auth/protected) e páginas administrativas
    - (auth)/, (protected)/, puppies/, blog/, settings/
  - api/: rotas HTTP (admin, blog, search, qa, analytics, leads, pixels)
  - robots.ts, sitemap.ts, og/, rss.xml/
- src/
  - components/: UI e features
    - Navbar.tsx, Footer.tsx, Hero.tsx, Testimonials.tsx, WhatsAppButton.tsx
    - blog/: PostCard.tsx, Toc.tsx, GamificationWidget.tsx
    - dashboard/: Sidebar.tsx, Header.tsx, DataTable.tsx, Main.tsx
    - ui/: button.tsx, dialog.tsx, input.tsx, toast.tsx, tooltip.tsx
  - lib/: utilitários e integrações
    - seo.core.ts, seo.blog.ts, jsonld.ts, route.ts
    - content.ts, internalLinks.ts, topicClusters.ts
    - supabasePublic.ts, supabaseAdmin.ts, meili.ts, rateLimit.ts
    - rag.ts, embeddings.store.blog.ts, analytics.ts, track.ts
    - adminAuth.ts, adminFetch.ts, settings.ts, getSettings.ts
  - types/: declarações auxiliares (blog, meilisearch, contentlayer)
- design-system/
  - tokens.css, theme-provider.tsx, motion.ts
- public/
  - imagens, logos, ícones
- scripts/
  - seed, seo-audit, embeddings-index, apply-migrations, utilitários
- docs/
  - relatórios e auditorias (PROJECT_AUDIT.md, BLOG_REPORT.md)

## 2) Dependências entre módulos (alto nível)
- Páginas (app/*) → componentes (src/components/*) → utilitários (src/lib/*)
- SEO: páginas importam `seo.core.ts` e helpers (`jsonld.ts`, `seo.blog.ts`)
- Busca: API `/api/search` → `meili.ts` com fallback; páginas usam `lib/route.ts`
- Blog: páginas e API → `content.ts`, `internalLinks.ts`, `topicClusters.ts`
- Admin: páginas → `adminAuth.ts`, `adminFetch.ts`, `settings.ts`, `supabase*`
- Análises/Telemetria: `analytics.ts`, `track.ts` opcionais, condicionados por ENV
- Integrações externas: `supabase*`, `meili.ts` (lazy import), pixels (GTM/GA/FB/TT)

## 3) Problemas e riscos identificados
- Landmarks duplicados: `app/layout.tsx` marcava wrapper com `role="main"` e `app/(site)/layout.tsx` usa `<main>` → corrigido para existir apenas um landmark principal por rota.
- Skip link não focava conteúdo: wrapper não era focável → adicionado `tabIndex={-1}` no alvo do skip link e no `<main>` do site.
- Possível overflow horizontal em tabelas/grades do dashboard em telas < 390px → mapear e aplicar CardTable/stack (pendente).
- Integrações: `supabasePublic.ts` lança erro se ENV ausente; evitar chamadas em ambientes sem configuração ou substituir por adaptadores no-op (planejado).
- Scripts de tracking: múltiplos pixels podem afetar LCP em mobile → manter condicionais e estratégia afterInteractive; validar prioridade de imagens hero (pendente revisão por rota).
- Acessibilidade: revisar aria-label em ícones isolados, foco visível consistente em botões custom e estados completos (loading/empty/error) em todas as listas (parcialmente presente).
- SEO: garantir canônicos absolutos, breadcrumbs e JSON-LD específicos por rota de conteúdo longo (TOC com landmarks; pendente checagem final por rota).

## 4) Plano de refatoração (priorizado)
1. A11y/layout baseline: único landmark principal por rota; skip-link funcional (feito).
2. Navbar/rodapé mobile-first: validar foco, aria-expanded, scroll-lock, contrastes (revisado/ajustado).
3. Tabelas e listas responsivas (dashboard): CardTable < md; evitar overflow (pendente).
4. Perf CWV: otimizar LCP de heros, usar `next/image` com `sizes`, lazy de ilhas, reduzir JS (pendente análise de bundle).
5. SEO técnico por rota: canônico absoluto, OG/Twitter, JSON-LD (FAQ/Authors), sitemaps segmentados (pendente).
6. Adapters no-op: Supabase/Meili/AI com fallbacks sem quebrar build/dev (parcial; Meili ok, Supabase admin com stub; público a revisar por uso).
7. Testes/CI: smoke Playwright (mobile/desktop) rotas críticas; unit de `seo.core`, `rag.ts`, `route.ts` (pendente).
8. Limpeza: remover duplicidades, consolidar componentes e estilos ociosos (pendente inventário fino).

## 5) Estado atual por tópico
- Responsividade: páginas públicas usam containers fluídos (`max-w-7xl px-4 sm:px-6 lg:px-8`); Navbar com menu móvel acessível; Footer responsivo. Dashboard requer pass nas tabelas/grades.
- Acessibilidade: skip links presentes (site/admin), foco e leitura por SR melhorados; revisar ícones/botões isolados.
- Performance: RSC por padrão; ilhas usadas em componentes interativos; pixels carregados condicionalmente; falta revisão de `next/image` sizes em heros.
- SEO: base de metadata centralizada; JSON-LD de Organization/WebSite no root; por rota ainda a complementar.
- Dados/Adapters: MeiliSearch lazy + fallback; Supabase admin possui stub; público exige ENV (planejar no-op quando não usado).

## 6) Checklist
- [x] Único landmark principal por rota (site/admin)
- [x] Skip link funcional (foco) e containers base
- [x] Navbar móvel com aria-expanded/controls e scroll-lock
- [ ] CardTable/stack para dashboard em < md
- [ ] Revisão `next/image` (sizes/priority) em heros
- [ ] SEO por rota (canônico/OG/Twitter/JSON-LD FAQ/Authors)
- [ ] Testes: Playwright smoke + units
- [ ] Limpeza final + bundle analysis

## 7) Itens removidos/simplificados (até aqui)
- Nenhum arquivo removido nesta iteração. Ajustes focados em a11y/layout e documentação.

## 8) Próximas ações imediatas
- Refatorar DataTable/grades no dashboard para layout em cartões no mobile.
- Revisar páginas longas de blog para TOC/breadcrumbs e JSON-LD específico.
- Mapear pontos de imagens grandes e ajustar `sizes`/`priority` para LCP.

—
Documento atualizado para v1. Próxima entrega: ajustes de responsividade no dashboard e SEO por rota.

## 9) Incremento: Sitemaps Segmentados, Tipografia Fluida, Autor JSON-LD, Related, Testes (Resumo)
- Sitemaps segmentados + índice implementados.
- RSS enriquecido com autor e categorias.
- Escala tipográfica fluida via CSS vars + Tailwind mapping.
- JSON-LD Person injetado em página de autor.
- Related posts agora server-side com `scoreRelatedPost` extraído (facilita teste determinístico).
- Vitest configurado (arquivos + testes iniciais), instalação local necessária para execução.
- Próximo: configurar Playwright e finalizar mocks Supabase para testes mais amplos.

