# Auditoria competitiva — delta — By Império Dog

Referência da sessão: 03/11/2026. Fontes HTTP coletadas novamente nesta rodada; timestamps individuais em `public-current.json` e `public-extra.json`. Escopo: produção, main remota, main local e checkout com alterações anteriores. Nenhuma publicação, alteração de Ads, contratação, envio de contato ou formulário.

## Conclusão

A By Império Dog já possui a maior parte da arquitetura comercial necessária. Não há evidência para reconstruir catálogo, páginas de cores, guias ou regiões. As diferenças mais concretas são a visibilidade das avaliações na produção, a identificação individual oferecida nas fichas do concorrente e o histórico explicitamente separado de vendidos. São diferenças de informação e jornada; não demonstram causalidade de ranking.

O risco operacional mais importante é publicar o checkout atual sobre a main: ele contém mudanças anteriores extensas e preços diferentes dos valores públicos. A main remota já incorpora correções de outubro que faltam localmente. A auditoria preservou essas diferenças e isolou uma única correção nova de aplicação: acesso direto de “Como comprar” para “Como funciona a reserva”.

## 1. Baseline e trabalho já realizado

| Referência | SHA / estado |
|---|---|
| HEAD inicial e final desta rodada | `4e3f4b436530f5bfe7191343df265085ba6f7f79` — não foi criado commit |
| main local | `57bf859f176373d4a7c8ef5fb122ffb1c13de467` — desatualizada |
| origin/main consultada e atualizada com fetch | `629f2c2de378a964e74c41314b180e7d62b07a26` |
| Branch separada desta rodada | `codex/auditoria-delta-2026-11-03` |
| Origem da branch | Checkout existente, com alterações anteriores preservadas; não é uma branch limpa baseada na main remota |

Evidências: `git-baseline.json`, `initial-status.txt`, `divergence-files.txt`. O status foi registrado antes da única edição de aplicação desta rodada. O próprio diretório de relatório e script de coleta já aparecem nesse registro. Não houve reset, merge, rebase ou commit das alterações de outras tarefas.

Commits remotos recentes examinados: `629f2c2` (índice público/entrega), `b808cdd` (validação de deploy), `b5c717e` (auditoria técnica), `b813be0` (preço individual nas sugestões), `b7bfe59` (resíduos comerciais/editoriais), `e08fe1e` (ordem da vitrine). Documentos anteriores: `docs/auditoria-delta-2026-10-09.md`, `docs/auditoria-ia-delta-2026-10-09.md`, relatório local `reports/master-seo-2026-11-03/RELATORIO.md` e histórico `reports/reviews-design/README.md`. São evidências históricas, não substitutos da coleta atual.

O relatório local antigo dizia que a fonte Google estava pendente. Isso foi superado pelos prints fornecidos pela proprietária: existem 33 avaliações Google transcritas, resumo 4,9/35, 14 relatos anteriores e uma foto de família adicionada depois. A contagem de cards não é a quantidade de avaliações Google. A integração automática continua inexistente; a seção é manual, com data e link de conferência.

## 2. Matriz competitiva obrigatória

Estados: **JÁ CORRETO**, **LACUNA COMPROVADA**, **CORRIGIDO EM BRANCH**, **DEPENDE DE APROVAÇÃO**, **NÃO COMPROVADO**. Confiança alta significa observação direta de página/código; não certifica a veracidade de alegações do negócio ou a influência sobre posições.

| Item | By Império Dog hoje | Flor do Tijuco hoje | Evidência | Lacuna real | Ação mínima | Prioridade |
|---|---|---|---|---|---|---|
| Intenções comerciais | Raça, sinônimo, catálogo, preço, compra e regiões existentes | Home, raça, catálogo e páginas temáticas | [By raça](https://byimperiodog.com.br/spitz-alemao), [Lulu](https://byimperiodog.com.br/lulu-da-pomerania), [Flor raça](https://flordotijuco.com.br/sobre-a-raca/) — alta | **JÁ CORRETO** quanto à cobertura principal; ranking não medido | Reaproveitar páginas; priorização por demanda depende de GSC | P1 |
| Links internos | Home leva a raça, cores e fichas; ficha leva a compra. “Como comprar” não apontava à página de reserva | Menu comercial e CTAs de contato disponíveis | [Compra](https://byimperiodog.com.br/comprar-spitz-anao), [reserva](https://byimperiodog.com.br/reserve-seu-filhote), `local-verification.json` — alta | **CORRIGIDO EM BRANCH**: falta do acesso contextual demonstrada | Adicionado um link em RelatedPages, sem alterar contrato | P1 |
| Cores | Páginas preto/branco e coleções por cor existentes | Navegação para diversas cores | [By preto](https://byimperiodog.com.br/filhotes/cor/preto), [laranja](https://byimperiodog.com.br/filhotes/cor/laranja), [Flor preto](https://flordotijuco.com.br/spitz-alemao-preto/) — alta | **JÁ CORRETO**; variedade maior do concorrente não prova lacuna da oferta própria | Não multiplicar páginas nem anunciar cores sem oferta confirmada | P2 |
| Ficha individual | Fotos, vídeos, sexo, cor, preço e WhatsApp; página declara ser referência permanente | Ficha Bad Bunny exibe nome, nascimento, identificador de microchip, pais e vídeo | [By branca](https://byimperiodog.com.br/filhotes/spitz-alemao-anao-branco-femea), [Flor ficha](https://flordotijuco.com.br/filhote-spitz-alemao-bad-bunny/) — alta para presença | **LACUNA COMPROVADA** de identificação comparável; não comprova falta de documento real | Complementar somente dados recebidos do criador/fornecedor e vinculados ao animal | P2 / aprovação |
| Preço por animal | R$7.500 na branca e R$9.500 na preta na produção; comparações devem usar o mesmo slug | Ficha amostrada usa contato, sem preço numérico observado | Mesmas fichas e [preta](https://byimperiodog.com.br/filhotes/spitz-alemao-anao-preto-femea) — alta | **JÁ CORRETO** nas duas fichas públicas; diferença local é risco de regressão | Preservar preços publicados; reconciliar antes de qualquer deploy | P1 |
| Disponibilidade e vendidos | Confirma opções pelo atendimento; galeria permanente não é estoque ou registro de venda | Categoria explicitamente dedicada a vendidos e ficha com status anunciado | [By catálogo](https://byimperiodog.com.br/filhotes), [Flor vendidos](https://flordotijuco.com.br/category/filhote-vendido/) — alta | **DEPENDE DE APROVAÇÃO/DADOS**; atualidade do estoque externo não comprovada | Histórico somente com correspondência confirmada entre venda e animal | P2 |
| Raça e FAQ | Conteúdo textual, FAQ visível, documentação e processo | Guia de raça e perguntas comerciais | [By FAQ](https://byimperiodog.com.br/faq-do-tutor), [Flor FAQ](https://flordotijuco.com.br/duvidas-frequentes/) — alta | **JÁ CORRETO** em existência e acesso | Revisar fatos sensíveis pontualmente; não copiar respostas do concorrente | P2 |
| Fotos e vídeos | Ficha branca pública expõe cinco fotos e cinco vídeos; galeria, sitemaps de mídia existentes | Fotos e vídeo associados à ficha amostrada | Fichas acima e [vídeos By](https://byimperiodog.com.br/sitemaps/videos.xml) — alta | **JÁ CORRETO** quanto à presença; autenticidade/identidade não periciadas | Não substituir nem exigir material que o negócio não possui | P2 |
| Avaliações | Seção ampla pronta localmente; ausente da home pública examinada. Local manual 4,9/35 dos prints | Bloco Google/Trustindex perto do início; widget anuncia 128 avaliações | [By home](https://byimperiodog.com.br/), [Flor home](https://flordotijuco.com.br/), `mobile-browser.json`, `local-verification.json` — alta | **CORRIGIDO EM BRANCH** em implementação anterior; posição e publicação ainda pendentes | Reusar seção; proposta de posição abaixo; nenhuma duplicação | P2 / aprovação |
| Identidade e SEO local | Marca, sede Bragança, telefone e CNPJ publicados; regiões SP/MG/RJ existentes | Contatos e sede Cotia publicados | [By contato](https://byimperiodog.com.br/contato), [termos](https://byimperiodog.com.br/termos-de-uso), [Flor contato](https://flordotijuco.com.br/contato/) — alta | **JÁ CORRETO** em identificação pública; consistência integral com GBP atual **NÃO COMPROVADA** | Conferir perfil autenticado; nenhuma sede fictícia para Atibaia | P2 |
| Rastreamento e indexação | HTML, canonicals e sitemaps acessíveis; preço redireciona para catálogo | Robots e sitemap acessíveis; ficha amostrada tem canonical para outro animal | [By robots](https://byimperiodog.com.br/robots.txt), [índice](https://byimperiodog.com.br/sitemap-index.xml), ficha Flor — alta | Rastreamento técnico **JÁ CORRETO** na amostra; indexação efetiva **NÃO COMPROVADA** | Não refazer sitemap; conferir canonical escolhido no GSC quando disponível | P1 |
| Dados estruturados | LocalBusiness, Article, BreadcrumbList, CollectionPage presentes conforme rota; JSON parseável | WebPage/Organization em páginas amostradas; cobertura não uniforme | `schemas` nos JSONs de evidência — alta | **JÁ CORRETO** em sintaxe/presença, sem certificar todos os requisitos de rich results | Não adicionar estrelas de autoavaliação empresarial | P2 |
| Mobile e desempenho | Sem overflow nas três páginas públicas testadas; home longa | Sem overflow na home mobile testada | `mobile-browser.json`; PSI 429 para ambos — alta para layout | Superioridade de velocidade **NÃO COMPROVADA** | Medir CWV de campo e laboratório válido; não usar tempos HTTP como score | P2 |
| Backlinks | Sem ferramenta autenticada de índice de links | Relação pública entre dois domínios confirmada | [Lulu](https://luludapomerania.com.br/) encaminha ao [Flor](https://flordotijuco.com.br/) — alta para relação | Autoridade, volume e qualidade relativa **NÃO COMPROVADOS** | Não comprar links/domínios nem inferir ganho SEO dessa relação | P3 |
| Pesquisa com IA | HTML acessível e llms.txt existente | Conteúdo público acessível | [By llms](https://byimperiodog.com.br/llms.txt), [Google sobre IA](https://developers.google.com/search/docs/appearance/ai-features) | Presença/citações em AI Mode, Gemini e ChatGPT **NÃO COMPROVADAS** | Registrar consultas e citações observáveis, sem prometer inclusão | P3 |
| Mensuração comercial | Código e runbook de clique WhatsApp existentes; contato/venda reais não consultados | CTAs WhatsApp visíveis; dados internos indisponíveis | Links coletados + `docs/analytics/conversion-audit.md` — alta para implementação, baixa para resultado atual | **NÃO COMPROVADO** que cliques gerem reservas/vendas | Reconciliar funil por origem no CRM; não mudar Ads | P1 |

## 3. Cobertura das 14 consultas prioritárias

Cobertura não equivale a posição, demanda ou indexação. Nenhum acesso efetivo ao Search Console nesta sessão: as credenciais locais esperadas não estão configuradas e não há conector de Search Console disponível. Não foram expostos segredos. A main remota já melhorou a integração GSC para consulta/página e totais reais; não a reimplementei.

| Consulta / intenção | URL existente a aproveitar | Diagnóstico |
|---|---|---|
| Spitz Alemão Anão | `/spitz-alemao`, home | JÁ CORRETO: conteúdo e acesso |
| Lulu da Pomerânia | `/lulu-da-pomerania` | JÁ CORRETO; snippets antigos de tabelas não representam necessariamente a página atual |
| Filhotes de Spitz Alemão | `/filhotes`, `/filhote-de-spitz-alemao` | Catálogo verificado; página informativa já existente no código |
| Spitz Alemão Anão preço | `/filhotes`, `/blog/preco-spitz-alemao-anao` | `/preco-spitz-anao` termina no catálogo; manter destino comercial, não criar outra página |
| Spitz Alemão Anão São Paulo | `/filhotes/sao-paulo` | JÁ CORRETO: URL regional HTTP200, sede real preservada |
| Spitz Alemão Bragança Paulista | home, `/lulu-da-pomerania-braganca-paulista` | Cobertura local existente; não criar sinônimo duplicado |
| Lulu da Pomerânia Atibaia | página SP + casos reais autorizados | NÃO COMPROVADO haver demanda que justifique URL própria; aproveitar atendimento/caso real sem inventar filial |
| Spitz fêmea branca | `/filhotes/spitz-alemao-anao-branco-femea` | JÁ CORRETO: ficha dedicada e preço individual |
| Spitz fêmea preta | `/filhotes/spitz-alemao-anao-preto-femea` | JÁ CORRETO: ficha dedicada e preço individual |
| Spitz preto | `/spitz-alemao-preto`, `/filhotes/cor/preto` | Guia e coleção existentes; não concluir canibalização sem GSC |
| Spitz laranja | `/filhotes/cor/laranja` | Coleção comercial existente e ligada à home |
| Onde comprar Spitz Alemão Anão? | `/comprar-spitz-anao`, `/criador-spitz-confiavel` | Conteúdo existente; ligação à reserva corrigida nesta rodada |
| Como funciona a reserva? | `/reserve-seu-filhote` | Página HTTP200 e 50% do valor individual na produção; link contextual novo |
| Quais documentos acompanham o filhote? | `/blog/documentacao-registro-spitz-alemao`, FAQ e ficha | Conteúdo existente; aplicação universal das promessas exige confirmação comercial |

## 4. Vantagens observáveis do concorrente — três, não cinco inventadas

1. **Avaliações visíveis cedo na home pública.** Facilita encontrar prova social. A By já resolveu o componente localmente; falta conciliar posição e publicação. A contagem exibida pelo widget externo não foi auditada diretamente no perfil Google e não certifica a autenticidade de cada relato.
2. **Ficha com identidade individual mais detalhada.** A ficha Bad Bunny apresenta campos que ajudam a associar informação a um animal, inclusive nascimento e ascendência. Comprovada a presença desses campos, não a genética, saúde ou exatidão dos dados alegados. A By deve publicar somente o que receber e verificar com seus fornecedores.
3. **Arquivo explicitamente rotulado como vendidos.** O visitante consegue distinguir esse histórico do catálogo ativo. A By usa referências permanentes e informa consulta ao atendimento. Um histórico próprio exige registros reais; não basta renomear a galeria.

Não há evidência suficiente de duas vantagens adicionais em performance, backlinks, qualidade veterinária, conversão ou ranking. A By já exibe preços públicos nas fichas amostradas, o que é útil ao comprador. O concorrente também apresenta problemas: canonical da ficha Bad Bunny aponta a Waze; página de cor preta sem H1 na coleta. Não copiar esses padrões. A URL `/o-canil/`, testada por hipótese, deu 404; o menu aponta corretamente a `/somos-o-flor-do-tijuco/`, HTTP200. Portanto isso NÃO é registrado como link quebrado do concorrente.

### Segundo domínio

`luludapomerania.com.br` declara pertencer ao Canil Flor do Tijuco, utiliza o mesmo telefone (11) 99822-0003, referencia Cotia e encaminha ao catálogo/site principal. A home e o catálogo têm canonicals próprios, não redirecionamento integral para Flor. Também há link de Flor para Lulu. Isso comprova uma relação comercial declarada e interligação pública, não titularidade registral, autoridade herdada ou benefício de posicionamento. Os extensos blocos de localidades não são recomendação para a By.

## 5. Cinco oportunidades prioritárias

1. **Reconciliar alterações locais com a main antes de publicar.** Branca: produção/main R$7.500 versus local R$8.500. Preta: produção/main R$9.500 versus local R$8.500. São os mesmos slugs; fotos/lotes também diferem, portanto requer confirmação da proprietária ao conciliar. Não corrigir preço por regra de cor/sexo. Impacto: evitar regressão comercial; confiança alta. Prioridade P1, bloqueio de qualquer deploy do conjunto atual.
2. **Aprovar correções mínimas dos resíduos comerciais.** A frase da home e o CTA compartilhado do blog ainda generalizam preço por combinação. Impacto: reduzir contradição percebida antes do contato; confiança alta. P1, aprovação de texto.
3. **Levar a prova social já pronta à posição combinada.** No mobile local, começo do catálogo aproximadamente y=1.041 e avaliações y=8.680 numa página de 15.824 px, nesta execução de 390×844. O bloco fica depois de metade da página e depois da vitrine, sem resumo Google junto ao primeiro CTA. Impacto esperado na descoberta da prova social, sem taxa de conversão medida. P2, proposta estrutural sujeita à aprovação.
4. **Facilitar o próximo passo e acrescentar informações verificadas por animal.** Link compra→reserva já corrigido. Campos só quando conhecidos: identificação interna estável, nascimento confirmado, documentação aplicável e momento da confirmação de disponibilidade. Não impor microchip, pais, exames ou nome comercial. P1 para link, P2/dados para ficha.
5. **Medir consultas e resultados comerciais reais.** Usar a integração GSC já existente na main e associar origem a contato qualificado, reserva e venda. Sem esses dados não é possível escolher páginas pelo retorno nem afirmar que o concorrente converte melhor. P1, acesso de leitura e processo de registro.

## 6. Auditoria comercial e propostas para aprovação — NÃO APLICADAS

| Achado atual | Estado | Proposta mínima |
|---|---|---|
| Home pública: “Cada cor tem o seu valor de partida” | LACUNA COMPROVADA; permanece na main remota. Local tem redação anterior diferente, ainda ambígua | “Explore as cores e veja fotos e preços individuais dos filhotes.” |
| CTA dos dois artigos: valor de partida de cada combinação | LACUNA COMPROVADA no componente compartilhado `src/components/blog/BlogCTAs.tsx`, local/main/produção | “Veja fotos e preços individuais dos filhotes. Confirme as opções atuais no atendimento.” |
| Página Bragança: link com descrição de valor de partida | LACUNA COMPROVADA na produção | “Fotos reais e preços individuais dos filhotes.” |
| Tabelas fixas no corpo dos artigos antigos | JÁ CORRIGIDO na produção/main das páginas amostradas; snippets de busca ainda podem mostrar versões anteriores | Preservar correções; não reescrever artigos inteiros |
| Hero, institucional e rodapé usam linguagem de criação própria | DEPENDE DE APROVAÇÃO: presença comprovada, abrangência incompatível com tratar todos como criação própria | Hero: “Atendimento especializado em Spitz Alemão Anão desde 2013, com orientação na escolha e suporte após a entrega.” Procedência: “Trabalhamos com filhotes provenientes de criadores e fornecedores. Consulte a procedência e os documentos do filhote escolhido.” |
| Inclusões universais de registro/exames/documentação | DEPENDE DE APROVAÇÃO e confirmação por animal; não concluído que documentos estejam ausentes | “Confira na ficha e no contrato os documentos, exames e cuidados incluídos para o filhote escolhido.” |
| Entrega nacional | NÃO É ERRO por si só: main documenta confirmação da proprietária de entrega aérea em 09/10; llms público já informa condições | Preservar entrega aérea condicionada à rota, idade e condições do filhote. Não voltar ao texto antigo que negava esse serviço |
| Reserva de 50% | JÁ CORRETO na página pública atual | Preservar valor individual; não alterar desistência, cancelamento ou demais cláusulas |
| Estoque desatualizado | NÃO COMPROVADO: site informa consulta e referência permanente, sem base operacional acessível | Não inventar status. Implantar atualização somente se houver fonte e responsável |

O preço de R$8.500 também visto na página pública da fêmea preta pertence ao **card relacionado do macho preto**, não ao mesmo animal. Não foi classificado como inconsistência pública. Comparações por regex isolada sem contexto produziriam um falso achado.

Proposta de posicionamento, sem redesenho: resumo compacto com link para a seção perto do CTA inicial; seção ampla reutilizada após apresentação/diferenciais e antes da vitrine completa. Preservar conteúdo, dados e navegação por deslize. Não foi aplicada porque o item 10 do pedido exige aprovação para mudanças estruturais. A integração automática é uma etapa distinta e não foi configurada.

## 7. O que permaneceu correto e não foi refeito

- Hero aprovado, fotografias, vídeos, preços, ordem e slugs do catálogo, depoimentos e seção Google local.
- Páginas de raça, cores, região, FAQ, compra e documentação; não foram criadas novas páginas.
- Conteúdo principal entregue no HTML; URLs principais e mídia com sitemap; canonicals próprios nas páginas By amostradas.
- Breadcrumbs e links home→raça/cores/fichas. Profundidade observada no grafo amostral: raça, catálogo, cores e fichas a um clique; SP a dois; artigo de cores a três. Esses números são caminhos encontrados, não auditoria integral de todas as URLs.
- Nenhuma página foi chamada de órfã apenas por não ter link no recorte. A reserva consta do índice textual llms, mas faltava o link contextual na página de compra examinada.
- Identidade empresarial: CNPJ 22.587.478/0001-00 nos termos, sede Bragança Paulista e telefone (11) 96863-3239 no contato. Não houve validação cadastral externa. “Desde 2013” é dado fornecido pelo negócio, não certificação histórica independente.
- WhatsApp com número oficial e mensagem contextual nos caminhos públicos amostrados. Não houve clique externo nem envio de mensagem.
- Dados estruturados sem nova marcação `Review`/`AggregateRating` para autoavaliação da empresa. [Google limita estrelas de avaliações sobre a própria organização](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).

## 8. Correção efetivamente feita e validação

**Única mudança nova de aplicação:** `app/(public)/comprar-spitz-anao/page.tsx`: uma entrada em RelatedPages para `/reserve-seu-filhote`, com título “Como funciona a reserva”. Não muda termos, textos de desistência/cancelamento, formulário, preços ou política comercial. O patch isolado está em `reservation-link.patch`; aplicar apenas esse trecho ao conciliar com main, não substituir a página inteira por esta versão local antiga.

**Testes e evidências:**

- 5 arquivos de testes existentes, **84 testes aprovados**: sitemaps, schema/metadata, parser de catálogo, mensagens WhatsApp e fatos públicos. Log `baseline-tests.log`. Validam o checkout, não todo o código remoto nem veracidade comercial dos dados.
- 39 URLs na coleta principal e 8 na complementar: 47 observações, 46 respostas finais HTTP200 e um 404 da URL hipotética `/o-canil/`, corrigida na investigação pelo destino real do menu. Redirecionamentos são registrados pelo destino final.
- JSON-LD parseável na amostra, sem erros de JSON detectados; não equivale a aprovação no Rich Results Test ou elegibilidade de estrelas.
- Browser mobile 390×844 em home, catálogo e ficha branca da By, mais home do Flor: HTTP200, sem overflow horizontal. Analytics bloqueado, nenhum formulário enviado. `mobile-browser.json`.
- Verificação local do novo link: navega de compra para reserva, H1 presente, sem overflow. `local-verification.json`. Contagem de 33 cards Google preservada.
- PSI mobile: HTTP429 nos dois domínios (`psi-*.json`). **LCP/INP/CLS de campo e comparação de performance NÃO MEDIDOS.** Tempos de navegação no JSON são diagnósticos de uma sessão, não Lighthouse nem CWV.
- Não repetido build completo para uma entrada estática de link; a rota foi compilada e navegada no servidor local. Build anterior não é apresentado como teste desta rodada. Nenhum teste de infraestrutura privada, pagamento ou transcrição foi disparado.

## 9. Limites de inferência

Sem GSC, ferramenta confiável de backlinks, painel atual do GBP ou CRM de ambos os sites, não há base para afirmar superioridade de posição, autoridade ou conversão. A busca pública encontrou páginas das duas marcas; consulta com nome de marca não é teste neutro de ranking comercial. Não foram observadas respostas autenticadas do Google AI Mode, Gemini ou ChatGPT citando os negócios, e não se inferiu presença a partir de resultados comuns.

Não há requisito especial de schema ou arquivo para garantir presença nos recursos de IA do Google. [Documentação oficial](https://developers.google.com/search/docs/appearance/ai-features). O llms.txt é complementar; não garante recomendação. O protocolo de acompanhamento deve registrar consulta, data, localidade/dispositivo, URL citada e eventual ausência de resposta, sem transformar uma observação em promessa.

Não foram encontrados novos P0 de indisponibilidade ou segurança nesta verificação pública limitada. Isso não é pentest nem atestado de ausência de vulnerabilidade. Os resíduos comerciais demonstrados são tratados como P1 de clareza, sem declarar fraude ou ausência de documentos não examinados.

## 10. Plano de acompanhamento — 30, 60 e 90 dias

Contar a partir da publicação autorizada das mudanças escolhidas, registrando a data exata. Comparar períodos equivalentes de 28 dias e segmentar marca/não marca, mobile/desktop e páginas comerciais; considerar sazonalidade e mudanças simultâneas.

| Marco | Ação | Métricas / critério |
|---|---|---|
| Antes / dia 0 | Salvar baseline GSC e CRM, conciliar versão com main, aprovar textos/posição, registrar versão publicada | Impressões, cliques, CTR e posição por consulta/página; contatos orgânicos reais, qualificados, reservas, vendas; nenhuma meta numérica inventada sem baseline |
| 30 dias | Conferir cobertura/canonical das URLs alteradas no GSC, links e acesso às avaliações; revisar origem dos contatos | Erros técnicos corrigidos; proporção contato→qualificado; cliques para reserva e WhatsApp tratados como microconversões |
| 60 dias | Comparar consultas já com impressões e posições próximas da primeira página; revisar uma lacuna editorial por vez | Mudança de CTR e cliques por intenção, taxa qualificado→reserva, dúvidas recorrentes; só ampliar conteúdo com evidência |
| 90 dias | Conciliar vendas e receita atribuíveis, qualidade dos contatos e custo operacional | Reservas e vendas reais por origem, receita e cancelamentos conciliados; decidir continuidade sem atribuir causalidade a uma única mudança |

Funil: **visualização** = página carregada; **clique** = interação; **contato** = conversa efetivamente recebida; **lead qualificado** = critério comercial humano registrado; **reserva** = confirmação comercial e sinal conciliado; **venda** = registro financeiro concluído. Um evento WhatsApp não prova nenhuma etapa posterior. A configuração existente de Ads e conversões principais foi preservada integralmente.

## Entrega e aprovação pendente

Nada publicado, nenhum push/PR, nenhum serviço pago instalado, nenhuma campanha ou conversão principal alterada. Branch e SHAs acima. Arquivos de evidência são locais.

Para avançar além do link técnico já corrigido, a proprietária precisa aprovar as redações propostas e o reposicionamento da seção existente, conforme itens 7 e 10 do pedido. Publicação exige aprovação separada depois de conciliar a versão com main e confirmar os dados comerciais. Não é necessário recriar recursos já prontos.
