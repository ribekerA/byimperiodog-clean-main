# Dependências – Auditoria Inicial (Fase 3)

## Resumo
Esta auditoria classifica dependências sinalizadas pelo `depcheck` e análise manual em quatro grupos:
1. Manter (uso direto ou plano claro)
2. Otimizar (substituir / reduzir overlap)
3. Adiar (placeholder futuro, decidir em fase posterior)
4. Remover (sem uso real)

## Achados do depcheck
Unused (reportado): @contentlayer/core, @sanity/client, @supabase/ssr, bcryptjs, date-fns, embla-* (3 pacotes), fuse.js, groq, next-safe-action, openai, react-parallax-tilt, shiki, tsparticles (+ engine + slim), @tailwindcss/line-clamp, @testing-library/user-event, @vitest/coverage-v8, autoprefixer, axe-core, cross-env, postcss.
Missing: eslint plugins (de fato usados no config), contentlayer, meilisearch, clsx, server-only, src (falso positivo de caminho), etc.

## Classificação Proposta
### 1. Manter
- cross-env: usado em script `dev`.
- postcss, autoprefixer, @tailwindcss/line-clamp: toolchain CSS (line-clamp pode ser removida se não se usa utilidade). Verificar uso real de `line-clamp-` classes.
- axe-core: usada em script de contraste? (atualmente script usa lógica custom; manter até Fase 7 A11y).
- @testing-library/user-event: útil para futuros testes de interação (mesmo se não usado ainda).
- @vitest/coverage-v8: manter se cobertura será ativada; caso contrário mover para Adiar/Remover.
- date-fns: verificar se `src/lib/date` já substituiu completamente; se sim mover para Remover.
- shiki / rehype-pretty-code / shikiji: pipeline de syntax highlight (confirmar apenas 1 necessária; hoje coexistem shiki e shikiji – redundância).
- embla-carousel + react wrapper + autoplay: se carrossel visível (confirmar componente usando). Senão mover para Adiar.
- tsparticles-slim + react-tsparticles: usados em `Hero.tsx` (slim load). Pacotes extras `tsparticles` e `tsparticles-engine` parecem redundantes.
- openai: usado em rotas AI fallback (ver README-openai e scripts embeddings).
- @supabase/supabase-js: usado amplamente.

### 2. Otimizar
- chart.js + react-chartjs-2 + recharts: decidir um stack único (preferir Recharts ou Chart.js). A remoção de um reduz bundle.
- shiki vs shikiji: manter apenas um (avaliar compat com pretty-code plugin).
- tsparticles / tsparticles-engine vs tsparticles-slim: manter apenas pares necessários ao `loadSlim` (provavelmente remover `tsparticles` completo e `tsparticles-engine`).

### 3. Adiar
- @sanity/client + groq: planejamento futuro CMS (placeholder). Pode remover agora para enxugar bootstrap e readicionar depois.
- @contentlayer/core: se Contentlayer efetivamente habilitado em config; manter por enquanto (há config `contentlayer.config.ts`).
- bcryptjs: se não há autenticação real implementada (só stub), pode remover agora.
- fuse.js: se busca textual atual usa Meilisearch ou supabase FTS; avaliar uso real. Se inexistente -> Remover.
- next-safe-action: avaliar se endpoints usam wrapper; grep não mostrou uso direto.
- react-parallax-tilt: grep não mostrou uso (verificar componente de parallax alternativo existente). Provável remoção.
- @supabase/ssr: grep não mostrou uso; se não planeja SSR helpers, remover.

### 4. Remover (Candidatos Imediatos)
- tsparticles (full) e tsparticles-engine (se `loadSlim` basta com react-tsparticles + tsparticles-slim).
- fuse.js (se nenhuma função de fuzzy search referenciando). 
- react-parallax-tilt (sem uso aparente).
- next-safe-action (sem uso aparente).
- @supabase/ssr (sem uso aparente).
- bcryptjs (sem auth real implementada; reduzir superfície de segurança).
- date-fns (se `src/lib/format/date.ts` cobre casos — confirmar).
- @tailwindcss/line-clamp (se não há classes `line-clamp-` grep).
- @vitest/coverage-v8 (se cobertura não será medida no curto prazo). 

## Ações Recomendadas (Próxima Iteração)
1. Grep de classes `line-clamp-` para confirmar uso.
2. Grep de `from 'fuse.js'`, `from 'next-safe-action'`, `from 'react-parallax-tilt'`, `from '@supabase/ssr'`, `from 'date-fns'`.
3. Verificar inicialização highlight (se `shiki` ou `shikiji` realmente usados) e eliminar duplicação.
4. Verificar charts em produção e escolher stack (documentar decisão).
5. Produzir tabela impacto (bundle approx via pacote sizes). 

## Decisão Necessária
Aprova remoção dos candidatos do grupo 4 agora? (sim/não, com ajustes).

Responda com: 
- "aprovo remoções grupo 4" 
- ou liste quais manter.

---
### Execução (15-09-2025)
Removidos do package.json: bcryptjs, fuse.js, next-safe-action, react-parallax-tilt, tsparticles, tsparticles-engine, @supabase/ssr.
Mantidos (avaliar depois): @sanity/client, groq, date-fns, @vitest/coverage-v8, @tailwindcss/line-clamp.
Racional:
- date-fns permanece até confirmar 100% cobertura util local.
- line-clamp em uso (vários componentes). 
- coverage-v8 pode ser ativado futuramente.
