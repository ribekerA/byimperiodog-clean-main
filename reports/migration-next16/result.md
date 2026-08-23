# Resultado local — Next.js 16, React 19 e Node 24

Data: 2026-08-23

## Proteção do site publicado

- Todo o trabalho foi realizado somente no repositório local.
- Branch local: `chore/next16-react19-node24`.
- O `HEAD` permaneceu em `0973f1134c961e8e75e566e60aa38db1c167cad6`.
- Nenhum commit, push, Pull Request, Deploy Preview ou deploy de produção foi executado.
- O site publicado não foi alterado.
- Alterações anteriores que já estavam no worktree foram preservadas.

## Versões centrais resolvidas

| Item | Antes | Depois |
| --- | ---: | ---: |
| Node.js | 20.19.0 | 24.19.0 |
| npm | linha do Node 20 | 11.17.0 |
| Next.js / eslint-config-next | 14.2.4 | 16.3.2 |
| React / React DOM | 18.3.1 | 19.2.8 |
| TypeScript | 5.6.x | 5.9.3 |
| ESLint | 8.57.x | 9.39.5 |
| next-mdx-remote | 5.x | 6.0.0 |
| Tailwind CSS | 3.4.x | 3.4.19 |
| Sharp | 0.33.x | 0.35.3 |
| Supabase JS | linha 2 antiga | 2.112.3 |
| Supabase CLI | linha 2 antiga | 2.115.0 |
| Playwright / @playwright/test | 1.55.x | 1.62.1 / 1.62.1 |

`.nvmrc` e `.node-version` usam a linha 24, `package.json` exige `>=24 <25`,
`@types/node` permanece na linha 24 e `netlify.toml` usa `NODE_VERSION = "24"`.

## Adaptações de compatibilidade

- APIs assíncronas do Next (`params`, `searchParams`, `cookies()` e
  `headers()`) foram migradas e validadas por TypeScript.
- `middleware.ts` passou a `proxy.ts`, preservando autenticação, redirects,
  headers e matchers.
- Rotas incompatíveis com o runtime Edge foram movidas para Node.js apenas
  quando necessário.
- Fronteiras Client Component explícitas corrigiram os carregamentos dinâmicos
  que podiam resolver para `undefined` no React 19.
- `revalidateTag` passou a usar o perfil atual `max`.
- O lint foi migrado para flat config do ESLint 9; usos de `next lint`,
  `--no-lint` e a opção removida `eslint` do `next.config` foram eliminados.
- O build padrão agora é `next build` com Turbopack. Webpack permanece apenas
  como comparação manual por `next build --webpack`.
- `next-mdx-remote` 6 foi incluído em `transpilePackages`, conforme a exigência
  do pacote para Turbopack.
- O runtime do Contentlayer foi removido após busca de imports estáticos,
  dinâmicos e aliases. Os 30 artigos continuam sendo gerados diretamente em
  `src/lib/_generated-posts.ts` pelo script já usado no projeto.
- O alias Webpack de `contentlayer/generated`, o `contentlayer.config.ts`, o
  lock Deno obsoleto e os pacotes Contentlayer sem uso foram removidos.
- `experimental.optimizePackageImports` ficou restrito a dependências diretas.
- A configuração explícita do plugin legado da Netlify foi removida; o projeto
  fica preparado para a detecção automática do adaptador OpenNext atual.
- Formatos AVIF/WebP, qualidade de imagens, URLs públicas, textos comerciais,
  preços, identidade visual e conteúdo dos 30 artigos foram preservados.
- Os tipos do Sharp foram adaptados à API 0.35 sem alterar o processamento.

Referências oficiais consultadas:

- https://nextjs.org/docs/app/guides/upgrading/version-16
- https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
- https://nextjs.org/docs/app/api-reference/cli/next
- https://www.npmjs.com/package/next-mdx-remote
- https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/

## Validação final local

| Verificação | Resultado |
| --- | --- |
| `npm ci` com Node 24 | passou; 1.040 pacotes instalados exatamente do lockfile |
| TypeScript | passou, 0 erros |
| ESLint 9 | passou, 0 erros; 1.109 avisos legados documentados |
| Build padrão Turbopack | passou; compilou em 20,7 s; 133/133 páginas |
| Build comparativo Webpack | passou; compilou em 103 s; 133/133 páginas |
| Testes unitários | 43 arquivos passaram, 1 ignorado; 284 testes passaram, 3 ignorados |
| E2E Chromium | 18/18 passaram; sem gravação real no Supabase |
| Depoimentos | 14/14 cartões com foto e nome na ordem definida pelo canil |
| Rotas do sitemap | 77/77 responderam 200 |
| Metadados | nenhum `title`, `description` ou `canonical` ausente |
| Estrutura SEO | H1 e JSON-LD válidos em 77/77 páginas |
| Admin anônimo | `/admin` e `/admin/dashboard` retornam 307 para o login |
| Validador de rotas | 18/18 passaram, sem erro ou aviso |
| Encoding | passou, sem mojibake |
| Palavras banidas | passou |
| Content guard | passou |
| Quality gate estrito | 30 artigos, sem erro ou aviso |
| `git diff --check` | passou |
| `npm audit --omit=dev` | 0 vulnerabilidades conhecidas na árvore de produção |

Os avisos `site_settings read error` vistos durante build e E2E são o fallback
esperado do ambiente local sem credenciais válidas do Supabase. O build,
metadata, conteúdo e rotas foram concluídos normalmente. Chamadas de gravação
administrativa permaneceram mockadas ou bloqueadas por autenticação.

## Desempenho observado durante a migração

O agregado de JavaScript cliente encontrado nos manifestos caiu de 2.179.599
bytes em 125 arquivos para 1.691.832 bytes em 111 arquivos (-22,4%). Como o
formato dos manifestos mudou entre Next 14 e 16, a comparação principal foi
feita com Lighthouse 12.8.2 e a mesma revisão de Chrome.

| Rota | Performance antes → depois | LCP antes → depois | TBT antes → depois |
| --- | ---: | ---: | ---: |
| `/` | 47 → 49 | 7.248 ms → 6.773 ms | 852 ms → 710 ms |
| `/filhotes` | 60 → 61 | 7.705 ms → 6.865 ms | 416 ms → 394 ms |
| `/blog` | 53 → 55 | 5.370 ms → 5.025 ms | 919 ms → 834 ms |

Acessibilidade, boas práticas e SEO não regrediram. O CLS permaneceu em 0,0027
na home, 0,0017 em `/filhotes` e 0,0048 no blog. O build final também confirmou
o benefício do Turbopack: 20,7 s de compilação contra 103 s no Webpack nesta
máquina.

## Segurança de dependências

O `npm audit fix --package-lock-only` foi executado sem `--force` e aplicou
somente correções compatíveis. O resultado caiu de 15 alertas para 5:

- Produção: 0 vulnerabilidades.
- Desenvolvimento/testes: 5 (2 moderadas, 1 alta e 2 críticas).
- As cinco restantes vêm de Vitest 2/Vite e Happy DOM 18.
- A correção indicada pelo npm exige Vitest 4 e Happy DOM 20, ambos upgrades de
  major explicitamente separados pelo escopo da migração.
- `npm audit fix --force` e `--legacy-peer-deps` não foram usados.

O npm 11 também solicita revisão explícita de scripts de instalação de cinco
pacotes. Eles não foram aprovados em massa; instalação, testes, Sharp, build e
Playwright passaram nesse estado.

## Matriz de majors adiadas

| Pacote | Atual | Disponível | Risco principal | Recomendação |
| --- | ---: | ---: | --- | --- |
| Tailwind CSS | 3.4.19 | 4.3.3 | pipeline CSS/configuração e regressão visual | PR própria com comparação visual |
| TypeScript | 5.9.3 | 7.0.2 | tipos, decorators e compatibilidade de ferramentas | após estabilizar Next 16 |
| ESLint | 9.39.5 | 10.9.0 | config/plugins; o prompt exige ESLint 9 | após reduzir os avisos legados |
| OpenAI | 5.23.2 | 7.5.0 | mudanças do cliente e respostas | PR própria com testes das rotas de IA |
| Zod | 3.25.76 | 4.4.3 | schemas, coerção e formato de erros | PR própria com testes de formulários/APIs |
| Vitest / coverage-v8 | 2.1.9 | 4.1.11 | Vite/configuração/mocks | prioridade alta; elimina alertas do ambiente de teste |
| Happy DOM | 18.0.1 | 20.11.6 | comportamento DOM dos testes | migrar junto com Vitest 4 |
| Framer Motion | 12.23.12 | 13.1.1 | animações e tipagem | PR visual própria |
| Lucide React | 0.540.0 | 1.33.0 | nomes/exports de ícones | PR pequena com build e smoke visual |
| TanStack Table | 8.21.3 | 9.1.2 | API de tabelas do admin | PR própria com E2E do admin |
| Sanity Client | 6.29.1 | 8.2.0 | API/queries e runtime | somente se a integração continuar ativa |

## Dívida de lint preservada

O baseline tinha 483 erros e 476 avisos. Depois do flat config, autofix seguro e
correções estruturais, o lint bloqueante chegou a 0 erros. Permanecem 1.109
avisos, principalmente `no-explicit-any`, variáveis não usadas e regras novas
do React Hooks/Compiler. Regras estruturais como `rules-of-hooks`, imports e
erros de parser continuam bloqueantes. React Compiler, Cache Components e PPR
não foram habilitados.

## Artefatos locais

- `baseline.md`: estado anterior detalhado.
- `baseline-seo-routes.json`, `migrated-seo-routes.json` e
  `final-next16-seo-routes.json`: auditorias das URLs.
- `baseline-lighthouse-*-mobile.json` e `migrated-lighthouse-*-mobile.json`:
  medições completas de desempenho.
- `baseline-build-stats.json` e `migrated-build-stats.json`: manifestos e bytes.
- `final-eslint.json`: relatório integral do lint.
- `screenshots/final-next16-*`: capturas finais desktop e mobile.
- `../route-validation.json`: relatório das rotas públicas e administrativas.

## Ações externas bloqueadas por decisão do usuário

- Criar commit, push ou Pull Request.
- Gerar Deploy Preview na Netlify.
- Confirmar na interface da Netlify o runtime Node 24 e o adaptador OpenNext.
- Confirmar as variáveis e segredos do ambiente de preview.
- Executar testes de gravação contra um Supabase real de desenvolvimento.

## Plano de publicação e rollback futuro

1. Revisar localmente o diff por grupos e só então autorizar commits pequenos.
2. Abrir Pull Request e validar exclusivamente por Deploy Preview.
3. Confirmar Node 24, adaptador OpenNext, variáveis, headers, redirects,
   formulários, WhatsApp, analytics e funções no preview.
4. Manter identificado o deploy de produção atual antes de publicar.
5. Se houver regressão, restaurar imediatamente o deploy anterior na Netlify e
   reverter apenas os commits da migração.

Até autorização explícita, o ponto seguro continua sendo o estado local atual,
sem qualquer efeito sobre o site publicado.
