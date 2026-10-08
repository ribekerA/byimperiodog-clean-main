# Auditoria final delta-only — 08/10/2026

## CONFIRMED BUG / DIVERGENCE

Baseline: main local/remoto e produção Netlify no SHA `e08fe1efdd6f9f38e55d87d07a18c813f950ad4f`, deploy `6ab87d5493a9a500089247ea`, estado `ready`. Conferência via API Netlify e GET direto, não cache de busca.

| Evidência | Fonte/URL | Correção |
| --- | --- | --- |
| Produção branca ainda R$ 8.500; solicitação confirmada R$ 7.500 | `/filhotes/spitz-alemao-anao-branco-femea`, `src/domain/pricing.ts` | Publicar correção local anterior e capa04 correspondente à foto enviada |
| Reserva pública omitia percentual; exemplo interno ainda30% | `/reserve-seu-filhote`, agente WhatsApp, README de domínio | 50% do valor individual, sem substituir percentuais não relacionados |
| Guia afirmava diferença fixa de R$1.000; home ainda mostrava preço genérico por cor; catálogo derivava valores da matriz | `content/guides/index.ts`, `ColorGallery.tsx`, `pricing.ts` | Preço individual por slug; todos os demais valores numéricos preservados; falta de cadastro gera erro, não preço inferido |
| Resíduos de tabela/ranking em conteúdo antigo e respostas compartilhadas | Lulu, preto, creme, preço, cores, escolha de canil, wolf-sable, filtros | Publicar correções anteriores e retirar somente resíduos encontrados; URLs e intenções SEO preservadas |
| Promessas absolutas de transporte contrariavam FAQ condicional | SP/MG/RJ | Consulta conforme destino, idade e condições; cidades e páginas preservadas |
| Castração após primeiro cio/sem efeito no temperamento, ciclo fixo e banho preventivo universal | `catalog-utils.ts`, guias, Lulu e Spitz | Avaliação veterinária individual; sem protocolo prescrito pela IA |
| Referência preto macho ainda parecia oferta no título/texto | Ficha preto macho e `puppy-search-copy.ts` | Identificação explícita de referência; não inventar vendido/disponível |
| Auditoria de produção:19 ocorrências de vitrine tratada como estoque | Ficha compartilhada, `search-topics.ts` e respostas antigas | Vitrine + confirmação humana; auditoria local posterior97URLs/0erros |
| CI antigo cobrava ordem só por preço, não destaques aprovados | `tests/e2e/smoke.spec.ts` | Testar primeiras posições branco/preto e demais em ordem de preço |

## CORRIGIDO AGORA

Correções anteriores pendentes de publicação preservadas; resíduos adicionais corrigidos conforme tabela. Scripts forenses atualizados para preço branco7500, ausência de tabela e canonical do redirect `/preco-spitz-anao`→`/filhotes`, mantendo verificações de segurança.

Conferência adicional do administrador: `PuppyForm.tsx` e `pricing-engine.ts` ainda sugeriam valor por cor/sexo e o chamavam de tabela Pix. A sugestão foi desativada; a análise interna usa somente o preço individual já cadastrado e recusa valor ausente/inválido. Não houve gravação em banco, desconto ou alteração de preço cadastrado.

## JÁ ESTAVA CORRETO — NÃO ALTERADO

Canonical non-www, robots/sitemaps, redirect HTTP e www301,404 real, autenticação/contratos, infraestrutura de consentimento, campanha/orçamento/lances, SEO nacional, fatos operacionais confirmados, preço preta9500 e ordem dos destaques. Ficha preto macho já não tinha Product/Offer/InStock próprio; não confundir Offer geral do catálogo com oferta desse animal.

## FALTA DEPLOY

Este documento é pré-publicação. SHA final, push e confirmação do deploy serão informados na entrega com evidência da API Netlify e GET pós-deploy; não se presume publicação por ter criado commit.

## CONFIRMAR COM KAREN

Espera2–6meses; saldo parcelado/na entrega; reembolso70% fora das hipóteses legais; transferência de ninhada; kit/exames e termos contratuais. Valores não foram alterados. Confirmar estoque real por indivíduo: auditor de catálogo avisa que os registros não possuem status explícito. Nenhum status foi inventado.

## REVISÃO VETERINÁRIA/JURÍDICA RECOMENDADA

Validar quantidades/percentuais de alimentação, limites de temperatura, duração de exercício e calendários rígidos ainda presentes em guias/artigos; não houve reescrita indiscriminada. Validar a garantia genética/congênita e condições de reserva contra contrato operacional vigente, sem anunciar garantia vitalícia de saúde.

Fontes consultadas para qualificar reprodução/castração: [AAHA — avaliação individual](https://www.aaha.org/pediatric-neutering/) e [Merck Veterinary Manual — reprodução canina](https://www.merckvetmanual.com/dog-owners/reproductive-disorders-of-dogs/management-of-reproduction-in-dogs). Não substituem revisão profissional.

## EXTERNAL ACCESS REQUIRED

RLS/storage/políticas efetivas do Supabase não comprovadas por ambiente local sem credenciais; inspeção/testes de aplicação não comprovam configuração de banco. CWV de campo (LCP/INP/CLS) não medidos nesta rodada: não atribuir aprovação de desempenho apenas ao build ou smoke.

## SEGURANÇA

Nenhuma nova vulnerabilidade comprovada nesta auditoria.119 checks locais passaram:109 APIs admin anônimas,6 páginas privadas, assinaturas conhecidas de segredos no bundle,2 preços renderizados e metadados editoriais. GET em produção: APIs admin puppies/settings/contracts401; contrato inválido404/documento307, noindex/no-store/no-referrer. Ausência de assinaturas conhecidas não prova ausência absoluta de segredos.

## SEO TÉCNICO

97URLs de produção responderam;19 falhas de verdade de estoque corrigidas localmente;97URLs locais/0erros/32avisos. Avisos de tamanho de metadados/imagem ausente não justificaram reescrita por checklist. HTTP/www301 direto; robots200;sitemap-index200;404real. HSTS,nosniff,frameDENY,Referrer-Policy presentes; CSP não observado nos headers públicos, sem mudança por checklist. Não foram inventadas datas editoriais.

## TESTES

- `npm run typecheck`: passou.
- `npx vitest run --coverage.enabled=false`:546passaram,3ignorados.
- `npm run lint -- --ignore-pattern '.audit-evidence/**'`: passou. Comando sem exclusão acusa3erros em coletor antigo ignorado, fora do código entregue.
- `npm run build` com `NEXT_DIST_DIR=.next-build`: passou,148páginas; guards de catálogo/vitrine/conteúdo/verdade/qualidade passaram.
- `node scripts/check-encoding.mjs`, banned-words, `git diff --check`: passaram.
- `npm run route:validate` contra produção:18/18passaram.
- `npm run seo:audit` local:97URLs/0erros/32avisos.
- `verify-forensic-http.mts`:119/119passaram.
- Playwright direcionado: ordem dos destaques e preços/schema passaram.
- `verify-forensic-browser.mts`:21/21passaram em Chromium desktop e mobile, incluindo7larguras adicionais; galeria,5vídeos, contato com API interceptada e axe sem violações nas rotas testadas.
- Guard adicional de preço ausente:18/18testes de preço passaram após adicionar a proteção contra preço inferido.
- Delta administrativo: typecheck e20testes de preço/engine passaram; lint direcionado e build conferidos antes do push complementar.
- Consentimento real, com toda coleta interceptada: antes da escolha0tags opcionais; rejeição+reload0; preferências e aceitação por categorias+reload passaram. Não comprova conversões efetivas no GA4/Ads.

## GIT

SHA inicial `e08fe1efdd6f9f38e55d87d07a18c813f950ad4f`. Commit limitado a correções comerciais/editoriais/testes e derivados pertinentes. Trabalho anterior de proteção/compartilhamento de mídia, CSS/layout e `next-env.d.ts` gerado pelo diretório isolado não integra este delta e permanece preservado localmente.

## PRODUÇÃO

Fluxo existente: push de main → Netlify, site `7bd02368-137b-4cc8-8fbe-f56b0f9eb54e`. Não criar infraestrutura nem contratar serviços. Conferência pós-publicação pendente na criação deste documento.
