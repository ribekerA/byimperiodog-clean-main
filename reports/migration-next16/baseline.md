# Baseline local — migração Next.js 16

Data: 2026-08-22
Branch local: `chore/next16-react19-node24`
Commit-base: `0973f1134c961e8e75e566e60aa38db1c167cad6`
Publicação: nenhuma (sem commit, push ou deploy)

## Ambiente e dependências

- Node.js: `20.19.0`
- npm: `10.8.2`
- Next.js: `14.2.4`
- React / React DOM: `18.3.1`
- TypeScript: `5.9.2`
- ESLint: `8.57.1`
- Instalação limpa: `npm ci` concluído, 1.432 pacotes instalados
- Auditoria completa do `npm ci`: 59 ocorrências (1 baixa, 30 moderadas, 23 altas, 5 críticas)
- Auditoria de produção (`npm audit --omit=dev`): 45 ocorrências (1 baixa, 28 moderadas, 14 altas, 2 críticas)

## Checks locais

| Check | Resultado do baseline |
| --- | --- |
| `npm run typecheck` | Falhou com heap padrão (~2 GB), por OOM |
| `NODE_OPTIONS=--max-old-space-size=4096 npm run typecheck` | Passou |
| `npm test` | 42 arquivos passaram, 1 pulado; 280 testes passaram, 3 pulados |
| `npm run lint` | Falhou: 483 erros e 476 avisos em 275 arquivos |
| Content guard | Passou |
| Quality gate estrito | Passou, 30 artigos |
| Encoding | Passou |
| Palavras banidas | Passou |
| `npm run build` com heap de 4 GB | Passou; 166/166 páginas geradas |

Principais dívidas preexistentes do lint: 452 `no-explicit-any`, 177 `import/order`, 75 variáveis não usadas, 64 blocos vazios e 45 escapes desnecessários.

## Build e rotas

- First Load JS compartilhado informado pelo Next: `87,7 kB`
- Middleware: `28,9 kB`
- Home: `21,3 kB` da rota, `165 kB` no primeiro carregamento
- Blog: `7,28 kB` da rota, `107 kB` no primeiro carregamento
- Post: `10,3 kB` da rota, `140 kB` no primeiro carregamento
- Filhotes: `157 B` da rota, `148 kB` no primeiro carregamento
- Detalhe de filhote: `14,4 kB` da rota, `157 kB` no primeiro carregamento
- O coletor existente registrou `264.956 bytes` de JS compartilhado do Pages Router e `totalAppJs: 0`; este último é uma limitação do coletor com o manifesto atual.

O prebuild atualizou apenas `@puppy` em `_generated-lastmod.ts`, de `2026-08-22T12:00:02.000Z` para `2026-08-22T12:16:47.000Z`. O novo horário corresponde ao último commit real dos arquivos agregados de filhotes; o mapa versionado estava atrasado.

## HTTP, SEO e sitemap

- 77 URLs públicas únicas auditadas
- 77 respostas HTTP `200`
- Nenhum título, description ou canonical ausente
- Todas as páginas auditadas têm exatamente um H1
- Nenhum JSON-LD inválido
- 30 URLs repetidas entre o sitemap principal e o sitemap específico de posts
- `/admin` e `/admin/dashboard`: `307` para `/admin/login`
- `/admin/login`: `200`
- `/api/settings/tracking`: `500` no ambiente local sem backend válido

O validador legado marcou as três URLs de admin como abertas porque segue redirects e avalia o `200` final da tela de login. A checagem manual sem seguir redirect confirma a proteção.

## E2E Chromium

- 3 testes passaram
- 14 testes falharam
- Uma falha é expectativa desatualizada de título (`Imperio` sem acento versus `Império`)
- As demais dependem da tela/campo de login legado e da API de tracking, indisponível no ambiente local atual

Essas falhas fazem parte do baseline e não serão atribuídas à migração sem mudança de comportamento relativa.

## Lighthouse 12.8.2 — mobile local

| Página | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT | Bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 47 | 97 | 100 | 100 | 7.248 ms | 0,0027 | 852 ms | 26.181.428 |
| Filhotes | 60 | 93 | 100 | 100 | 7.705 ms | 0,0017 | 416 ms | 2.371.989 |
| Blog | 53 | 97 | 96 | 100 | 5.370 ms | 0,0048 | 919 ms | 1.331.795 |

## Artefatos preservados

- `baseline-build-stats.json`: manifesto e tamanhos do build atual
- `baseline-seo-routes.json`: status e metadados das 77 URLs
- `baseline-lighthouse-*-mobile.json`: relatórios Lighthouse brutos
- `screenshots/baseline-*.png`: home, filhotes e blog em desktop; home e filhotes em mobile

As capturas visuais usam rolagem progressiva antes do screenshot para ativar seções carregadas por `IntersectionObserver`/animações de viewport.
