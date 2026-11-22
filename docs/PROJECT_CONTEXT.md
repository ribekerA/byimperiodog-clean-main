# Contexto do projeto By Imperio Dog

## Fonte de verdade
- Repositório: `ribekerA/byimperiodog-clean-main`, branch `main`; clone local deste agente.
- Ao iniciar trabalho, confira `git status`, `git log -1` e instruções locais. Código atual prevalece sobre inventários e roadmaps antigos.
- Produto: site comercial de criação/venda de Spitz Alemão, com catálogo de filhotes, captação de leads, conteúdo/blog, contratos e painel interno.

## Stack observada no código
- Next.js 16.4.6 App Router, React 19.3, TypeScript 6.0, Tailwind 3.4; Node >=24 <25, npm 11. Stack atualizada nesta branch local; migração para Tailwind 4 foi avaliada e adiada porque a ferramenta oficial não conseguiu resolver a configuração TypeScript do projeto no Windows.
- Supabase como armazenamento/autenticação/integridade de dados; integrações Google Ads/Analytics/Search Console, Meta, TikTok, WhatsApp, ZapSign, Sanity e OpenAI aparecem no código/dependências.
- Testes com Vitest 5/Vite 8, Testing Library e Playwright. Não presuma que serviços/credenciais estão configurados localmente.

## Mapa de código
- `app/(public)`: páginas públicas, home, catálogo, páginas SEO, blog, galeria, guias, conteúdo institucional.
- `app/(admin)/admin`: painel autenticado para dashboard, leads/CRM, filhotes/catálogo, blog, conteúdo, analytics, contratos, configurações, SEO, tracking, Ads, avaliações, web stories e integrações.
- `app/(private)/contract`: experiência privada de contratos.
- `app/api`: APIs públicas e administrativas. As rotas `/api/admin/**` são superfície sensível; conferir sessão/permissões, validação, rate limits e uso de service role antes de alterar.
- `src/lib`: integrações e lógica de domínio (Supabase, autenticação/RBAC, SEO, tracking/consent, WhatsApp, webhooks, conteúdo, busca, pricing).
- `src/components`: componentes públicos, admin, design system e formulários.
- `sql/`, `supabase/`: esquema e migrações; verificar ordem/aplicação no ambiente antes de depender de mudanças de banco.
- `scripts/`: geração de assets/conteúdo e guardrails de build/SEO/catalog/truth.
- `docs/`, `reports/`: auditorias, decisões e histórico; podem estar defasados, valide cada recomendação no código atual.

## Comandos definidos
- `npm run dev` (porta 3000), `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run check:all`.
- `predev` gera fotos de clientes, Contentlayer e tamanhos de imagem. `prebuild` roda auditorias/guardrails e gera conteúdo/assets; build pode portanto falhar por dados/ambiente esperados pelos guardrails.
- Leia `.env.example`, `README-dev.md`, `README_ENV.md` antes de preparar ambiente; nunca expor valores de `.env`.

## Regras para mudanças
- Preservar idioma/conteúdo em português e posicionamento comercial verdadeiro; validar alegações públicas contra dados/fonte, não inventar disponibilidade, preço, pedigree ou garantia.
- Para páginas públicas, checar SEO técnico, canonical, metadata, JSON-LD, sitemap, mobile/performance e acessibilidade no padrão existente.
- Para formulários/APIs, validar no servidor com schema, limitar abuso e manter consentimento LGPD; nunca confiar em validação/client state como controle de segurança.
- Para painel admin, manter autenticação/autorização e evitar indexação; mudanças em banco precisam incluir migração compatível e atualizar tipos gerados quando aplicável.
- Imagens de animais/proprietários e depoimentos têm impacto de confiança; respeitar assets e textos existentes.
- Antes de editar, rastrear página -> componentes -> lib/API -> dados. Fazer mudança mínima e verificar a parte afetada. Não executar build/testes sem solicitação explícita do usuário.

## Primeiros arquivos úteis
`package.json`, `README.md`, `README-dev.md`, `README_ENV.md`, `docs/INVENTORY.md`, `docs/ROADMAP.md`, `proxy.ts`, `next.config.mjs`, e os diretórios de rota/API ligados à tarefa.
