# Auditoria forense master — checkpoint de 23/09/2026

## Estado e limites

**Definition of Done: NÃO. Não houve commit, push ou deploy deste conjunto de alterações.**

Projeto: `ribekerA/byimperiodog-clean-main`, branch `main`, site https://byimperiodog.com.br.
HEAD inicial e HEAD local/remoto reconferido em 23/09: `0e1819c2a6421ac74270448cea5b08e14987e21e`.
O delta está no clone isolado `.codex-hotfix/byimperiodog-price`, dentro do workspace autorizado. O repositório original, com outras alterações do usuário, não foi sobrescrito.

Este relatório distingue código corrigido, teste local e funcionamento em produção. Build sem credenciais usa o fallback existente do projeto: **não comprova paridade com Supabase, RLS, uploads reais ou contratos de produção**.

As evidências de 14/09 foram preservadas em `.audit-evidence/2026-09-14-checkpoint/`. Evidências brutas de contas da etapa anterior continuam fora da árvore publicável, em `../../.audit-evidence/2026-09-13/`. Não versionar tokens, relatórios operacionais de contas ou dados de clientes.

## Correções realizadas no delta local

### P0 — autorização, contratos e separação de segredos

- Papel administrativo vem da sessão assinada. Cookie de papel, cabeçalhos de papel e cookies legados não concedem permissão. Papel ausente/desconhecido não vira proprietário.
- Escritas passam por permissão e proteção de origem; rotas de analytics administrativas usam o guard central.
- Documento de contrato exige autorização antes da consulta. Arquivos privados usam URL assinada de curta duração, sem URL pública.
- Formulário de contrato só aceita código válido, estado pendente e expiração futura; links sem expiração falham fechados. Novos códigos têm 32 caracteres hexadecimais.
- Contratos usam root layout separado, sem pixels/atribuição. Cabeçalhos específicos: no-referrer, no-store e noindex.
- Upload contratual tem teto de bytes no stream, validação do conteúdo de imagem/PDF, destino aleatório e prevenção de sobrescrita. PDF com ações conhecidas é recusado; isso não equivale a antivírus.
- A API recusa armazenamento contratual se o bucket não estiver privado. **O estado real do bucket e a capacidade da coluna de código ainda precisam ser confirmados antes do deploy.**
- `server-only` protege o módulo administrativo do Supabase. O build revelou uma importação indevida no CRM: uma constante foi extraída para módulo compartilhado sem banco.
- A menção restante a `SUPABASE_SERVICE_ROLE_KEY` no bundle era texto de ajuda em `/admin/reviews`, não o valor de uma chave. A inspeção diferencia menção nominal de assinatura de segredo; não foi demonstrado vazamento novo de credencial.
- A leitura de configurações públicas deixou de selecionar tokens CAPI desnecessários.

### P1 — preço, conversão, mídia e rastreamento

- Matriz Pix do domínio centralizada em site, referências estáticas, MDX e sugestão de cadastro. Cartão = Pix + R$ 700; até 3 parcelas sem juros sobre o valor do cartão.
- Motor de preço não inventa probabilidade de venda, sazonalidade ou prêmio por raridade e não grava reajuste automático. Divergências individuais do banco precisam de revisão; não foram sobrescritas.
- Formulário e chat só confirmam conversão após resposta válida do backend com identificador. Falha de captura não simula sucesso.
- Consentimento tratado como booleano, remoção de identificadores ao revogar e isolamento de rastreamento fora do host de produção.
- GCLID, WBRAID e GBRAID são tipos distintos. **Persistência de braids no CRM ainda não implantada**, pois o esquema real não foi confirmado.
- No celular, contexto/preço/contato precedem a galeria. Banner e CTA fixo respeitam sua área ocupada.
- Em 23/09, um teste reproduziu a remontagem da imagem do cartão ao detectar touch. `TiltCard` passou a manter a mesma estrutura e apenas desativar os efeitos. O teste falhou antes da correção (duas montagens), passou depois e verifica a preservação do mesmo nó ao alternar ponteiros. Isso não prova sozinho ganho de Lighthouse.
- Galeria ampliada saiu do contexto de empilhamento do cabeçalho, com diálogo em portal, controle de foco e fechamento acessível. Fotos mantêm o animal inteiro.
- Imagens de uploads administrativos são efetivamente decodificadas, com limite de pixels, além de MIME/tamanho. Caminhos de upload do blog usam UUID e papéis permitidos; upload não cria bucket público automaticamente.
- Leitura de JSON/multipart limitada durante o stream, inclusive sem Content-Length. Extensões de vídeo deixaram de cair no fallback genérico `.bin`.
- **Validação profunda/antimalware de vídeo e transação completa entre Storage e banco continuam pendentes.**

### P2 — SEO, imagens editoriais e afirmações factuais

- OG, Twitter, Article.image e primaryImageOfPage compartilham a mesma capa real e dimensões medidas. Sitemap de posts reutiliza essa origem e escapa XML.
- `max-image-preview:large` já existia e foi preservado.
- Conferência física: 31 capas, 31 dimensões coerentes, todas com largura ≥1200 px e área >300 mil pixels. Não houve ampliação artificial, recorte novo nem geração de imagens.
- Artigos preto/creme deixaram de apresentar pigmento como gene, aparência como prova de ancestralidade, receitas cosméticas e afirmações não sustentadas sobre raridade/temperamento. Referências: [UC Davis — genética](https://vgl.ucdavis.edu/resources/dog-coat-color), [intensidade](https://vgl.ucdavis.edu/test/intensity-dog) e [FCI nº 97](https://www.fci.be/Nomenclature/Standards/097g05-en.pdf).
- Sugestões do cadastro não inventam vacinação, registro, convívio com crianças, kit incluso ou temperamento. A antiga pontuação da foto, derivada apenas da quantidade de imagens, foi substituída por checklist manual.
- Dependências do editor e processamento de imagens foram atualizadas; dependência sem uso removida. Auditoria de vulnerabilidades é uma consulta datada, não garantia permanente.
- Nenhuma promessa de primeiro lugar, nota 10 no Google Ads, elegibilidade garantida no Discover ou citação por IA.

## O que foi preservado

- Nomes, URLs e mídias reais das fêmeas branca e preta recebidas pelo usuário; nenhuma mídia deste catálogo foi apagada nesta auditoria.
- Estrutura visual e navegação existentes, sem redesign.
- Referências visuais separadas de inventário disponível; wolf sable segue fora da divulgação.
- Canonicals principais, sitemap de imagens existente, regras privadas repetidas por crawler e max-image-preview já corretos.
- Política prévia de liberação de treinamento de IA, sem assumir que isso melhora ranking.
- Nenhum aumento de orçamento, alteração de lances, ativação de campanha ou envio de lead/mensagem de teste.

## Preços oficiais adotados

Fonte: instrução master do usuário, recebida em setembro de 2026. Não é pesquisa de preço de mercado.

| Cor | Macho Pix | Macho cartão | Fêmea Pix | Fêmea cartão |
| --- | ---: | ---: | ---: | ---: |
| Particolor | R$ 5.500 | R$ 6.200 | R$ 6.500 | R$ 7.200 |
| Laranja | R$ 6.500 | R$ 7.200 | R$ 7.500 | R$ 8.200 |
| Creme | R$ 7.500 | R$ 8.200 | R$ 8.500 | R$ 9.200 |
| Preto | R$ 8.500 | R$ 9.200 | R$ 9.500 | R$ 10.200 |
| Branco | R$ 9.500 | R$ 10.200 | R$ 10.500 | R$ 11.200 |

Fixture independente cobre as 10 combinações; teste no navegador confere a tabela renderizada. A instrução anterior de branca a R$ 8.500 foi substituída pela master. **Prévia antiga de anúncio a R$ 8.500 não deve ser aplicada.** Preços de registros individuais, anúncios e caches de produção ainda exigem reconciliação após acesso e publicação.

## Tabela de segurança

PASS abaixo indica somente o escopo de teste descrito, não certificação do sistema inteiro.

| Área | Status | Evidência / limite |
| --- | --- | --- |
| ADMIN | PASS | Sessão assinada, papéis e recusas locais testados; acesso real de cada papel pendente. |
| API | BLOCKED | Smokes locais de API admin sem sessão passaram; inventário estático não prova segurança de todos os métodos ou efeitos no banco. |
| CONTRACT | BLOCKED | Código endurecido e testes locais; bucket, RLS, expiração e coluna de código reais não confirmados. |
| PREVIEW | PASS | URLs privadas da amostra recusam acesso sem sessão. |
| SUPABASE | BLOCKED | Credencial canônica consultada anteriormente respondeu 401; não determina o estado da credencial de produção. |
| RLS | BLOCKED | Não testada com sessões anon/autenticada reais nem políticas remotas. |
| SECRETS | BLOCKED | Fronteira de build e assinaturas conhecidas verificadas; rotação de segredos históricos e configurações remotas não comprovadas. |
| UPLOADS | FAIL | Imagens/PDF reforçados; vídeo ainda depende de validação profunda e não há transação única Storage/banco. |
| HEADERS | PASS | Básicos observados em produção e privados adicionados localmente; CSP não ativa e cabeçalhos privados pós-deploy pendentes. |
| SESSIONS | PASS | Testes de assinatura, expiração e papel; nenhuma sessão real forjada em produção. |
| RATE LIMIT | FAIL | Barreiras em memória não garantem limite distribuído entre instâncias; camada remota precisa ser validada. |

## Navegadores e acessibilidade

Rodada de 14/09: **63 verificações PASS**, 7 perfis × 7 páginas e 14 verificações adicionais de largura. Falhas iniciais da galeria foram corrigidas. Firefox e reprodução WebKit exigiram execução fora da restrição do ambiente; a repetição passou. Não atribuir falha do ambiente a Safari real.

Em 23/09, a rodada completa em localhost teve 62 PASS / 1 FAIL. Repetição isolada do WebKit em 127.0.0.1 teve 7 PASS, mas a segunda matriz completa em 127.0.0.1 apresentou **61 PASS / 2 FAIL**, em WebKit desktop e móvel na página branca. Erros JavaScript de pré-carregamento RSC continuam intermitentes; imagem, preço, diálogo e reprodução passaram nesses casos. **Causa não comprovada; não foi removida a asserção nem declarada correção.** Evidências anteriores preservadas em `results-localhost-20260923.json` e `results-webkit-isolated-20260923.json`. Essas rodadas precedem a alteração adicional do TiltCard; revalidação está indicada abaixo.

Após o ajuste do TiltCard e novo build, **28/28 verificações móveis PASS**: Chromium e WebKit emulados, 7 páginas cada e 14 verificações adicionais de largura. Evidência: `.audit-evidence/forensic-browser/results-filtered.json`. Isso valida a amostra móvel do último build, mas **não encerra a investigação do erro intermitente nem substitui uma nova matriz completa/Safari real**.

Páginas: início, catálogo, branca fêmea, tabela de preços, blog, artigo de preços e contato.
Verificações: HTTP, H1, canonical, robots, JSON-LD parseável, imagens visíveis, ausência de overflow, links WhatsApp, consentimento, menu, galeria, foco, vídeo, formulário interceptado e axe WCAG A/AA.

| Navegador/dispositivo | Status | O que foi executado |
| --- | --- | --- |
| Chromium | PASS | Engine Playwright desktop e emulação móvel. |
| Chrome | PASS | Canal instalado no Windows, headless desktop. |
| Edge | PASS | Canal instalado no Windows, headless desktop. |
| Firefox | PASS | Engine Playwright, desktop. |
| WebKit | FAIL | Erros intermitentes de pré-carregamento na rodada completa de 23/09. Engine Windows, não Safari. |
| Safari real | BLOCKED | Sem dispositivo/macOS real disponível nesta validação. |
| Chrome Android | BLOCKED | Emulação Chromium não equivale a Chrome no Android real. |
| iPhone | BLOCKED | Não testados Safari real, teclado virtual e safe-area em aparelho físico. |
| iPad | BLOCKED | Larguras de tablet emuladas; não aparelho real. |
| Opera | BLOCKED | Não executado; compartilhar Chromium não é aprovação automática. |

Larguras: 320, 360, 375, 390, 412, 430, 820 e 1180 px. Paisagem/tablet cobertos por viewport; teclado virtual real permanece bloqueado. WhatsApp foi validado como link, sem enviar mensagens nem confirmar abertura do aplicativo em aparelho físico.

## Rastreamento e Google Ads

Ações externas da etapa anterior, não repetidas nesta retomada: GTM versão 18 com consentimento de marketing exigido para Pinterest; GA4 com fuso de São Paulo e sem valor fictício padrão de US$ 1 no clique de WhatsApp.

Verificação de consentimento anterior interceptou coletores: rejeição sem tags, analytics sem Pinterest, marketing permitindo Pinterest. Isso não prova conversão de venda real nem ausência global de duplicações entre todas as integrações.

Nenhum anúncio foi modificado nesta etapa. Os números de Ads/GA4/GSC coletados antes são baseline histórico, não retrato de 23/09. É necessário atualizar a consulta, reconciliar preços e associar campanha → intenção → página → contato → qualificação → reserva/venda. Clique WhatsApp não é venda. Não importar conversões offline antes de definir eventos reais, valores e deduplicação.

## Crawler, Discover e imagens

Documentação consultada na rodada de 14/09:

- [OpenAI](https://developers.openai.com/api/docs/bots): OAI-SearchBot para busca, GPTBot para treinamento e ChatGPT-User para ações solicitadas pelo usuário. A skill openai-docs orientou a consulta oficial e a separação das finalidades.
- [Anthropic](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler): Claude-SearchBot, Claude-User e ClaudeBot documentados; removido identificador legado não sustentado pela documentação consultada.
- [Perplexity](https://docs.perplexity.ai/docs/resources/perplexity-crawlers): busca separada de recuperação iniciada por usuário.
- [Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers): controle de treino/grounding Gemini/Vertex, não do ranking na Busca ou AI Overviews.
- Nenhum identificador de crawler xAI inventado. Não encontrar documentação não prova inexistência de crawler.
- [Discover](https://developers.google.com/search/docs/appearance/google-discover): imagens grandes e elegibilidade não garantem distribuição. [Imagens na Busca](https://developers.google.com/search/docs/appearance/google-images): capa representativa, URL consistente e marcação coerente.

Robots não é autenticação; especialmente recuperação solicitada por usuário pode não seguir suas regras. Áreas privadas precisam continuar inacessíveis sem autorização, independentemente do User-Agent.

## Verificações e evidências

- Última suíte concluída em 14/09: 544 PASS, 3 ignorados; 74 arquivos PASS e 1 ignorado.
- Build de 14/09: PASS, 148 páginas pré-geradas. TypeScript e guards de conteúdo/preço passaram.
- HTTP de 14/09: 122/122 PASS, incluindo tabela e inspeção de assinaturas conhecidas no bundle.
- Imagens: 31/31 capas fisicamente conferidas.
- Rodada inicial de 23/09: **544 testes PASS, 3 ignorados; build PASS (148 páginas); HTTP 122/122 PASS; imagens 31/31 PASS; npm audit de produção zero vulnerabilidades reportadas.** ESLint do delta: zero erros, um aviso por arquivo gerado já ignorado na configuração.
- Após a correção de estabilidade do TiltCard: **545 testes PASS, 3 ignorados; 75 arquivos PASS e 1 ignorado. Build PASS novamente, 148 páginas; TypeScript e guards aprovados; HTTP novamente 122/122 PASS.** ESLint dos arquivos adicionais sem erros ou avisos. Medição pós-correção registrada abaixo.
- Navegação de 23/09: matrizes completas com 62/1 e 61/2 (PASS/FAIL); repetição isolada WebKit 7 PASS. Erros de pré-carregamento ainda não encerrados, conforme seção de navegadores.
- Última amostra pós-correção: 28/28 verificações móveis PASS. Sem commit, push, deploy ou alteração de conta de anúncios nesta retomada.
- Não foram criados contatos reais, curtidas artificiais, contratos fictícios em produção ou mensagens a clientes.
- Avaliação axe não substitui teste manual com leitor de tela.

Comandos de reprodução: `npm run build`, `npx vitest run --coverage.enabled=false --maxWorkers=4`, `npx next start -H 127.0.0.1 -p 3109`, `npx tsx scripts/verify-forensic-http.mts`, `npx tsx scripts/verify-forensic-browser.mts`, `npx tsx scripts/verify-editorial-assets.mts`. Para HTTP/navegadores, definir `AUDIT_ORIGIN=http://127.0.0.1:3109`. O script `scripts/lighthouse-local.mts` exige `LIGHTHOUSE_CLI` apontando para o CLI local de Lighthouse; aceita `AUDIT_RUN` para preservar rodadas anteriores. Não fornecer credenciais reais aos testes com fixtures.

### Produção e desempenho

GETs públicos em 14/09 e reconferidos em 23/09: HTTP→HTTPS 301; www→sem-www 301; home/robots/sitemap-index 200; caminho inexistente 404. HSTS de um ano, DENY e nosniff presentes; CSP ausente.

**Não há smoke pós-deploy nem paridade comprovada: o delta não foi publicado.**
Lighthouse 12.8.2, Chrome headless, build local de produção, perfil móvel padrão com simulação de limitação de CPU/rede. Uma execução por página, antes do ajuste adicional no TiltCard; não é mediana, resultado de produção nem evidência de Core Web Vitals de campo:

| Página | Desempenho /100 | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: |
| Catálogo | 77 | 5,28 s | 0 | 198 ms |
| Branca fêmea | 78 | 3,67 s | 0 | 478 ms |
| Preços | 90 | 3,04 s | 0 | 227 ms |

Evidências: `.audit-evidence/lh-controlled-2026-09-23-{catalogo,branca,precos}.json`. O primeiro comando de Lighthouse falhou ao limpar seu próprio diretório temporário (EPERM). A execução concluída usou navegador isolado controlado por Playwright, sem acessar o perfil pessoal nem apagar diretórios do usuário.

No catálogo, a imagem do primeiro cartão foi o elemento LCP; cerca de 4,50 s foram atribuídos à fase de atraso de renderização. O teste de componente confirmou a remontagem ao detectar touch, mas não permite atribuir todo esse atraso a uma causa.

Nova execução após corrigir a estrutura do cartão e reconstruir o build:

| Página | Desempenho /100 | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: |
| Catálogo | 76 | 5,38 s | 0 | 232 ms |
| Branca fêmea | 79 | 3,64 s | 0 | 423 ms |
| Preços | 91 | 3,09 s | 0 | 190 ms |

Evidências: `.audit-evidence/lh-controlled-2026-09-23-tilt-stable-{catalogo,branca,precos}.json`. **Não ficou comprovada melhora de velocidade.** No catálogo desta segunda coleta, a fase de atraso de renderização foi 27 ms, mas a de carregamento foi 4,88 s; a distribuição mudou, não o resultado final de LCP. Reconstrução/cache e execução única impedem tratar isso como experimento causal controlado. O defeito de remontagem foi corrigido e coberto por teste; a otimização de desempenho continua aberta. Próximos passos: medir séries comparáveis frias/aquecidas, investigar entrega da imagem LCP e custo do JavaScript antes de novas mudanças. Core Web Vitals de campo, INP real e desempenho em rede/dispositivo reais precisam ser acompanhados após deploy.

## Definition of Done — resposta explícita

SIM refere-se ao escopo local indicado; NÃO inclui trabalho ainda bloqueado ou sem evidência suficiente.

| Pergunta | SIM/NÃO | Evidência ou pendência |
| --- | --- | --- |
| HEAD atual correto? | SIM | Local e remoto reconferidos em 23/09. |
| Preço Pix correto? | SIM | Matriz da instrução master no código. |
| Cartão Pix+700? | SIM | Função única e fixture independente. |
| Todos os 10 preços testados? | SIM | Unitário e HTML renderizado. |
| Nenhum preço velho relevante? | NÃO | Banco/anúncios/produção não reconciliados. |
| Admin protegido? | SIM | Guard local e casos negativos; produção pós-deploy pendente. |
| API admin protegida? | SIM | Rotas locais da amostra recusam sessão ausente; não atesta efeitos de todos os métodos. |
| Contract protegido? | NÃO | Código local pronto; bucket/RLS/esquema remoto bloqueados. |
| Preview protegido? | SIM | Casos negativos locais. |
| RLS testada? | NÃO | Falta acesso remoto autorizado válido. |
| Service role fora do client? | SIM | Guard server-only e busca por assinatura; texto de ajuda não é chave. |
| Nenhum secret? | NÃO | Ausência absoluta e rotação histórica não comprovadas. |
| Uploads seguros? | NÃO | Pendências de vídeo, storage e integração real. |
| Auth server-side? | SIM | Sessão verificada nos guards corrigidos. |
| Headers seguros? | NÃO | Básicos verificados; CSP e pós-deploy privados pendentes. |
| www redireciona? | SIM | 301 reconferido em 23/09. |
| Canonical correto? | SIM | Páginas locais da amostra. |
| HTTPS correto? | SIM | Redirect e TLS reconferidos em 23/09. |
| Sitemap correto? | NÃO | Fontes locais verificadas; cobertura de posts remotos depende do banco. |
| Robots correto? | SIM | Política local e documentação consultada; não substitui auth. |
| Googlebot acessa público? | SIM | Permitido; entrega real ao Google via WAF/logs não comprovada. |
| Googlebot-Image acessa público? | SIM | Permitido e arquivos locais válidos; logs reais pendentes. |
| OAI-SearchBot tratado? | SIM | Grupo específico com exclusões privadas. |
| Claude Search tratado? | SIM | Identificador documentado. |
| Perplexity tratado? | SIM | Busca e ação de usuário distinguidas. |
| Nenhum crawler inventado? | SIM | Nenhum novo identificador sem fonte. |
| Google-Extended documentado? | SIM | Não apresentado como controle do Search. |
| max-image-preview:large? | SIM | Existente e preservado. |
| Imagens editoriais automatizadas? | SIM | Contrato comum; não geração artificial. |
| og:image correto? | SIM | 31 capas locais consistentes. |
| Article.image correto? | SIM | Mesmo ImageObject. |
| ImageObject correto? | SIM | Dimensões medidas, sem inventar dados remotos. |
| primaryImage aplicável? | SIM | WebPage associado ao Article. |
| Image sitemap correto? | SIM | Fotos existentes preservadas e posts com mesma capa/escape XML. |
| Imagens ≥1200 quando possível? | SIM | 31/31 capas locais, sem upscale. |
| LCP preservado? | NÃO | Catálogo local 5,28 s antes / 5,38 s após; não há ganho confirmado nem validação em produção. |
| Vídeos corretos? | NÃO | Amostra reproduziu; auditoria de todos os arquivos/novos uploads incompleta. |
| Structured data factual? | NÃO | Fonte local melhorada; dados remotos e todas as afirmações ainda não certificados. |
| Product/Offer factual? | NÃO | Referências separadas; ofertas de inventário real dependem de banco. |
| Reference separado de inventory? | SIM | Política preservada, sem declarar disponibilidade fictícia. |
| Catálogo com fonte única? | NÃO | Tabela central local; estoque/preço individual remoto ainda não reconciliado. |
| Sem fake claim? | NÃO | Correções aplicadas aos pontos encontrados; revisão completa dos demais textos pendente. |
| Sem fake review? | NÃO | Nenhuma criada; registros remotos não auditados. |
| Search Console usado? | SIM | Baseline da etapa anterior; consulta atual pós-deploy pendente. |
| Regional sem doorway? | SIM | Nenhuma expansão automática criada. |
| Chrome testado? | SIM | Canal Windows. |
| Edge testado? | SIM | Canal Windows. |
| Firefox testado? | SIM | Engine Playwright. |
| WebKit testado? | SIM | Engine Windows, não Safari real. |
| Safari real ou bloqueado? | SIM | Explicitamente BLOCKED. |
| iPhone/mobile testado? | NÃO | Apenas emulação móvel. |
| Android testado? | NÃO | Sem aparelho real. |
| Opera coberto? | NÃO | Sem execução específica. |
| Safe-area correta? | NÃO | CSS local; aparelho real pendente. |
| Teclado mobile correto? | NÃO | Teclado virtual real não testado. |
| WhatsApp cross-browser? | NÃO | Links verificados; aplicativo/dispositivos reais pendentes. |
| Sem horizontal overflow? | SIM | Viewports da matriz local. |
| Acessibilidade preservada? | SIM | Axe e foco da amostra; leitor de tela/manual completo pendente. |
| Tracking sem duplicação? | NÃO | Consentimento testado; todas as plataformas e vendas reais não reconciliadas. |
| Consent Mode preservado? | SIM | Código e teste anterior; publicação final pendente. |
| Atribuição correta? | NÃO | Braids no CRM e jornada completa pendentes. |
| Build passou? | SIM | Build e guards concluídos novamente em 23/09. |
| E2E passou? | NÃO | Rodadas de 23/09 com falhas intermitentes em WebKit; não encerradas pela repetição isolada aprovada. |
| Production parity comprovada? | NÃO | Sem deploy e sem verificação de banco. |
| Produção smoke pós-deploy? | NÃO | Nenhum deploy deste delta. |

## Bloqueios e ordem de continuação

1. **Banco/credenciais:** a leitura da fonte alternativa `.env.local.local` foi recusada pelo controle de acesso. Não contornar, copiar por outro caminho ou publicar segredos. Precisa de autorização explícita para usar esse arquivo na validação, ou credencial válida fornecida pelo mecanismo seguro apropriado. Risco: declarar segurança ou preço remoto sem verificar.
2. **Contratos/RLS:** confirmar bucket privado, políticas, objetos antigos, expiração e comprimento do código; testar fluxos de modo controlado com dados autorizados. Nenhuma exclusão em massa. Risco: implantação pode recusar envios se a infraestrutura não satisfizer as novas proteções.
3. **Vídeos/rate limit:** definir validação de conteúdo e limite distribuído, com infraestrutura/custos aprovados antes de contratar serviços. Não instalar scanner ou serviço pago sem autorização.
4. **Desempenho/navegadores:** investigar LCP do catálogo e erros intermitentes de pré-carregamento no WebKit; completar Safari/iPhone/iPad/Android/Opera reais e teclado virtual. A emulação não encerra essa pendência.
5. **Comercial/Ads:** confirmar preços individuais, atualizar análise das contas e apresentar mudanças exatas de anúncios/objetivos antes de aplicação que envolva nova autorização.
6. **Publicação única:** revisar diff final, confirmar os P0, commit e push somente do delta autorizado, acompanhar deploy e smoke de produção; depois verificar indexação e medição. Não usar a aprovação genérica de continuação para contornar bloqueio explícito de acesso.

## Arquivos alterados

Lista detalhada no anexo `forensic-master-2026-09-23-files.md`. Remoções em `app/(public)/contract` são movimentações para `app/(private)/contract`, preservando URLs e funcionalidade sob proteção; não são exclusão de contratos ou dados de clientes.
