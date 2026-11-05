# Auditoria delta — pesquisa, IA e voz — 09/10/2026

## Escopo, baseline e matriz anterior à edição

Missão intitulada «11/10», executada em **09/10/2026**. Complementa, sem refazer, [a auditoria técnica do mesmo dia](auditoria-delta-2026-10-09.md). Main remoto confirmado em `b808cdde91746ff3c652a3d95ab72def03711ab4`; produção Netlify `6ac91c0c160bd00008116670`, mesmo SHA, ready, publicada às 16:55:01 UTC. CI e CodeQL desse baseline aprovados. Um deploy-preview com erro não corresponde ao deploy de produção e não foi alterado.

Worktree isolada: `audit/delta-20261009`. Cinco arquivos locais de proteção/compartilhamento de mídia do usuário preservados fora desta alteração. Nenhuma mudança em Google Ads, preços, estoque, reserva de 50%, desistência, devolução de 70% ou transferência de reserva. Etapa de voz/assistente limitada a diagnóstico e proposta; nenhuma chamada paga, instalação, integração ou faturamento ativado.

| Prioridade / estado | Arquivo ou URL e evidência anterior à edição | Impacto / severidade | Esforço / risco | Ação mínima |
| --- | --- | --- | --- | --- |
| P1 — corrigido | `/llms.txt`, HTTP200 em produção: «Fêmeas custam mais que machos em todas elas», «preço a partir de» e «o galeria» | Informação comercial generalizada contradiz preços individuais; não é vulnerabilidade | Baixo / baixo | Remover regra universal, preservar faixa derivada e links; corrigir concordância; testes |
| P1 — corrigido após confirmação | `src/domain/public-truth.ts` limitava transporte à contratação pelo tutor e bloqueava genericamente «fazemos entregas»; usuário confirmou entrega nacional aérea em 09/10 | Fonte de verdade e guard não refletiam serviço confirmado | Baixo / baixo | Registrar entrega aérea nacional e permitir sua comunicação; continuar bloqueando frota própria e garantias não comprovadas; atualizar llms e testes |
| P1 — requer aprovação da etapa 15 | `app/api/matchmaker/route.ts`: prompt ainda usa preços de partida por cor/sexo e equivalência preto/creme | Risco de orientação de preço incorreta, comprovado no código; resposta errada ao vivo NÃO demonstrada | Médio / médio | Propor revisão da fonte e validação determinística; não alterar o assistente automaticamente |
| P2 — diagnóstico | Áudio enviado a `/api/transcribe` e Groq; política pública sem menção específica identificada a áudio/transcrição/provedor | Transparência e controle de custo precisam de revisão; não é conclusão jurídica | Médio / médio | Validar tratamento e retenção com responsável; proposta abaixo |
| P3 — indício externo | Resultado do diretório Cylex menciona 24h; site informa 8h–22h; fetch direto do diretório retornou 403 | Potencial divergência local, atualidade não comprovada | Baixo / baixo, depende de acesso | Confirmar no perfil antes de qualquer edição |
| JÁ CORRETO | Robots separa rastreamento público de áreas privadas; HTML principal acessível | Preservar descoberta e segurança | Nenhum | Não liberar bots indiscriminadamente nem criar páginas artificiais |

## 1. Notas técnicas

Não há nota geral de SEO, segurança, IA, voz ou conversão: **NÃO MEDIDO como pontuação**. Lighthouse fornece notas de laboratório, não classificação comercial nem garantia de indexação. Resultados detalhados e condições de coleta estão no relatório anterior. Este delta modifica texto público e documentação de fatos, não layout ou scripts; não se atribuiu melhoria de CWV a essas mudanças.

## 2. Problemas comprovados

O arquivo público destinado a leitores e ferramentas (`/llms.txt`) continha regra universal de preço por sexo incompatível com a regra comercial confirmada: cada filhote tem valor próprio, mesmo com mesma cor e sexo. Também apresentava vacinação sem ressalva de idade. Esses textos foram observados na resposta HTTP atual, não em cache de busca.

O prompt do assistente existente ainda contém a lógica antiga por combinação de cor/sexo, embora também receba catálogo público com valores individuais. A presença das instruções conflitantes é comprovada; sua frequência de erro não foi medida, pois nenhuma consulta paga foi feita. É uma pendência distinta da correção de llms.

## 3. Melhorias efetivamente realizadas

- `app/llms.txt/route.ts`: corrigida concordância; preços explicitamente individuais; faixa publicada não apresentada como tabela por cor/sexo; disponibilidade confirmada no WhatsApp; vacinação e vermifugação conforme idade; entrega aérea nacional conforme confirmação do usuário, com condições combinadas antes da reserva.
- `src/domain/public-truth.ts`: registro e guard de transporte alinhados à confirmação de 09/10. A regra não bloqueia mais a simples comunicação de entrega; continua impedindo afirmações não comprovadas de frota própria, transporte aéreo próprio, acompanhamento ou segurança garantida. Teste específico cobre entrega aérea condicionada e preservação desses bloqueios. Não se atribuiu parceiro, frete grátis ou prazo fixo.
- `tests/llms-commercial-truth.test.ts`: dois testes de regressão de identidade, valores derivados, individualidade, logística, idade e ausência de áreas privadas no índice.
- Comentários do código deixam de sugerir que llms seja obrigatório ou garanta citação por IA. É índice complementar, não substituto de HTML, sitemap ou links.

Nenhum preço individual, imagem, capa, ordem, slug ou estado do catálogo foi alterado. A correção de transporte não limita o atendimento à região de Bragança Paulista.

## 4. JÁ CORRETO — NÃO MEXI

Domínio oficial non-www, identidade By Império Dog/Sementinhas de Amor, localização Bragança Paulista/SP, telefone público, preços individuais branca R$7.500 e preta R$9.500, reserva de 50%, cláusulas protegidas, caminhos de WhatsApp e consentimento. Capa e primeiras posições da vitrine preservadas. Não se recriou tabela por cor/sexo nem disponibilidade.

O HTML inicial já contém conteúdo principal, títulos e links. FAQ usa conteúdo público existente e apresentação acessível por texto. Páginas regionais existentes não foram multiplicadas. A exclusão deliberada de wolf-sable das listagens continua preservada. As correções anteriores de prioridade de imagem e contraste não foram refeitas.

## 5. PageSpeed, Lighthouse e CrUX

Evidência reutilizada do mesmo dia, Lighthouse 12.8.2, Chrome contra produção, mobile simulado e desktop. Para catálogo e artigo, abaixo estão as repetições pós-correção de 16:51–16:52 UTC; demais rotas são a coleta de 14:40–14:46 UTC anterior à publicação dos patches, não uma nova medição deste delta.

| Rota | Performance mobile / desktop | LCP ms mobile / desktop | CLS mobile / desktop | Acessibilidade mobile / desktop |
| --- | --- | --- | --- | --- |
| `/` | 86 / 100 | 3009 / 728 | 0 / 0 | 100 / 100 |
| `/filhotes` | 89 / 100 | 3198 / 633 | 0 / 0 | 100 / 100 |
| `/filhotes/spitz-alemao-anao-branco-femea` | 75 / 100 | 3729 / 667 | 0 / 0 | 100 / 100 |
| `/reserve-seu-filhote` | 81 / 100 | 2407 / 615 | 0,0568 / 0 | 100 / 100 |
| `/blog/preco-spitz-alemao-anao` | 84 / 99 | 3595 / 756 | 0 / 0 | 100 / 100 |
| `/filhotes/sao-paulo` | 87 / 100 | 2801 / 576 | 0 / 0 | 100 / 100 |

SEO laboratorial: 100 nas amostras. Boas práticas: 100, exceto ficha branca 96 na coleta anterior, associada ao endpoint de curtidas indisponível. PageSpeed API retornou HTTP429 nas 12 consultas anteriores. **CrUX e INP NÃO MEDIDOS**, não equivalentes a zero nem ausência comprovada de amostra. TBT não substitui INP. Sem dados para afirmar CWV de campo aprovados no p75. As metas de campo solicitadas permanecem LCP ≤2,5s, INP ≤200ms, CLS ≤0,1.

## 6. Indexação, rastreamento e SEO

Baseline anterior: 97 URLs, zero erros automatizados e 32 avisos contextuais; 18 rotas principais aprovadas; três 404 reais; HTTP/www redirecionados; quatro sitemaps HTTP200, sem datas futuras ou caminhos privados. Não se repetiu a varredura inteira apenas para produzir outro relatório. Build deste delta: gerador de lastmod examinou 36 rotas, **zero datas atualizadas**, sem atualização editorial fictícia.

Nova coleta direta às 21:57 UTC: 11 rotas públicas HTTP200 (home, catálogo, ficha branca, reserva, artigo de preço, SP, MG, RJ, contato, llms e robots). Conteúdo, marca, H1 e preço atual presentes. Seis requisições à home com User-Agent Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, PerplexityBot e GPTBot retornaram HTTP200. **Simular User-Agent não comprova acesso a partir dos IPs reais desses serviços, rastreamento efetivo ou inclusão em índice.**

Sem acesso confirmado às propriedades do Search Console ou Bing Webmaster Tools: cobertura, canonical escolhido, impressões e citações de IA desses painéis **NÃO MEDIDOS**. Nenhuma solicitação de indexação foi enviada.

### Finalidades dos rastreadores — regras existentes preservadas

| Serviço | Distinção relevante |
| --- | --- |
| Google | Googlebot participa de Search, incluindo recursos de IA. Google-Extended é controle por token de robots para usos específicos de Gemini, não User-Agent HTTP distinto nem controle de ranking Search. |
| OpenAI | OAI-SearchBot é pesquisa; GPTBot é treinamento, com controles independentes; ChatGPT-User atende requisições iniciadas por usuários e não deve ser confundido com indexador. |
| Perplexity | PerplexityBot serve descoberta de pesquisa; Perplexity-User realiza acessos por solicitação de usuários. Aceitar uma string de UA não valida acesso dos IPs oficiais. |
| Bing/Copilot | Rastreamento e relatório de citações são coisas distintas. Bing Webmaster Tools documenta métricas de visibilidade em IA; não houve acesso a esses dados da propriedade. |

Fontes oficiais: [Google — recursos de IA](https://developers.google.com/search/docs/appearance/ai-features), [Google — crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers), [OpenAI — bots](https://developers.openai.com/api/docs/bots), [Perplexity — crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), [Bing — visibilidade em IA](https://blogs.bing.com/search/2026/6/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare/). Documentação consultada em 09/10/2026. Não há requisito técnico adicional de Google para llms.txt ou schema especial de IA; estar elegível não garante exibição.

## 7. Segurança e infraestrutura

Mantidas correções já publicadas Next 16.3.8/sharp 0.35.5. Resultado anterior de npm audit de produção: oito pacotes afetados, cinco advisories altos e três moderados, zero críticos; não é prova de exploração e não foi feito novo scan de advisories neste delta. Pendências da cadeia Tailwind/glob/seletores exigem análise sem migração forçada. HSTS/nosniff/frame/referrer observados anteriormente; CSP requer inventário e rollout cuidadoso. RLS e Storage efetivos em produção não verificados. Curtidas HTTP503: causa de configuração/banco continua não comprovada.

Na inspeção de IA: chat limitado a 20 requisições/minuto/IP, payload de 64KB, até 40 mensagens de 4.000 caracteres e saída de 700 tokens; transcrição a 10/minuto/IP e áudio de 8MB. Limites em memória não são teto financeiro global entre instâncias. Há validação de tamanho/tipo no código, mas duração real e validação robusta de arquivo merecem revisão; não houve exploração ou upload. Assistente não recebeu ferramentas administrativas nem documentos de clientes nesta auditoria.

## 8. WhatsApp e conversões

Preservada instrumentação que passou na auditoria anterior: seis simulações de clique (home/ficha/reserva × consentimento) produziram exatamente um `whatsapp_click` com autorização e zero sem autorização, sem PII observada. Requisições externas e gravações foram interceptadas: nenhum lead ou conversão real gerado.

Isso não prova ingestão no GA4/Google Ads nem a configuração interna do contêiner GTM. **28 cliques versus oito sessões continua sem causa comprovada**. Não se refez tracking aprovado nem se mexeu em campanhas. A confirmação final deste delta inclui nova checagem pública pós-deploy, registrada no encerramento.

## 9. Testes e evidências

Executados neste delta: **553 testes unitários aprovados**, três ignorados preexistentes (77 arquivos aprovados/um ignorado), incluindo a regra de entrega confirmada; antes desse último ajuste, 33 testes direcionados de fatos/llms também passaram. TypeScript e dois builds de 148 páginas aprovados, incluindo o build final com o guard atualizado; guards de preço, conteúdo, catálogo, mídia e palavras-chave aprovados. Playwright smoke/regressões: 23 aprovados, dois ignorados legados. Lint do projeto aprovado excluindo somente `.audit-evidence/**`, scripts temporários não versionados; nenhum arquivo de aplicação foi excluído. Lint direcionado dos quatro arquivos de código/teste novamente aprovado após o último ajuste. Importação do novo teste corrigida após apontamento do lint, sem silenciar regra. Encoding, palavras banidas e `git diff --check` aprovados.

Reutilizados, não apresentados como nova execução: 119 verificações forenses HTTP e 21 de navegador da auditoria anterior; auditoria SEO e Lighthouse descritos acima. Novo teste de produção do chat: componente e botão de voz presentes; zero solicitações de microfone e zero POST sem interação, com chamadas externas/gravações bloqueadas. Não se testou resposta paga nem gravação real.

Evidências locais não versionadas: `.audit-evidence/ai/current.json`, snapshots de 11 respostas e screenshot do chat; relatórios anteriores em `.audit-evidence/`. Não contêm necessidade de publicar segredos ou dados de clientes. Leitor de tela físico, todos os navegadores e sessão real de áudio **NÃO TESTADOS**.

## 10. Git e produção

Alteração mínima isolada, sem incluir os cinco arquivos locais do usuário. O commit deste relatório inclui as correções de llms, fonte de verdade e testes. Seu SHA, confirmação de push, estado Netlify e checagens pós-deploy são informados no encerramento após ocorrerem; este texto não atribui publicação a uma ação futura. Sem confirmação correspondente, o estado correto é **DEPLOY NÃO COMPROVADO**.

## 11. Riscos e aprovações necessárias

Revisão do assistente existente é prioritária, mas não foi aplicada por ser etapa de diagnóstico/proposta. Autorizar separadamente: prompt/fonte de preço, estratégia de custo global, aviso de áudio, política de retenção e eventual mudança de serviço. Nenhuma aprovação genérica anterior foi usada para habilitar novas despesas. Conteúdos veterinários e jurídicos incertos devem ser revisados por profissionais, sem alterar as cláusulas protegidas.

## 12. Impacto esperado

Reduzir contradição comercial em texto público e refletir o transporte aéreo nacional confirmado. Facilitar entendimento por leitores e sistemas que consultem esse arquivo. **Não há aumento de vendas, posição ou citações por IA medido ou garantido.**

## 13. Visibilidade em IA e buscas conversacionais

Consultas reais em ferramenta de busca web em 09/10/2026, aproximadamente 21:59 UTC. Não são testes autenticados nas interfaces de Google AI Mode, Gemini, ChatGPT Search, Perplexity ou Copilot. «URL retornada» abaixo significa link no resultado consultado, não citação em resposta generativa.

| Consulta | Marca observada | URLs retornadas no domínio oficial |
| --- | --- | --- |
| Onde encontro Spitz Alemão Anão em Bragança Paulista? | Sim | `/`, `/lulu-da-pomerania-braganca-paulista`, `/filhotes/sao-paulo`, `/contato` |
| Tem Lulu da Pomerânia fêmea branca By Império Dog? | Sim | `/lulu-da-pomerania`, `/`, `/pomeranian` e conteúdo de cores |
| Quanto custa um Spitz Alemão Anão By Império Dog? | Sim | `/`, `/blog/preco-spitz-alemao-anao`, `/filhotes/sexo/femea` |

Resultados incluíram fragmentos antigos com branca R$8.500, enquanto HTML atual mostra R$7.500. É divergência entre índice consultado e produção atual, **não prova de defeito atual no preço do site**. Não reescrever conteúdo correto nem forçar atualização em massa. Não se inferiu estoque por uma consulta.

Google AI Overviews/AI Mode, Gemini, ChatGPT Search, Perplexity e Copilot: **citação efetiva NÃO MEDIDA**. Preparação técnica, indexabilidade, presença em resultados e citação são quatro estados distintos. Uma busca isolada não mede participação futura.

### Intenções faladas cobertas por páginas existentes

| Intenção | Fonte atual apropriada | Limite |
| --- | --- | --- |
| Onde encontrar Spitz em Bragança? | Home, contato e página de Bragança | Sede real, não filiais inventadas |
| Tem fêmea branca? | Catálogo e ficha individual | Confirmar disponibilidade atual |
| Quanto custa? | Ficha individual e artigo de preço | Sem tabela universal por cor/sexo |
| Onde comprar em SP? | `/filhotes/sao-paulo` e `/comprar-spitz-anao` | Logística combinada |
| Diferença entre branco e laranja? | Conteúdo de cores e raça | Não inferir temperamento por cor |
| Entrega em outros estados? | FAQ, conteúdo de entrega e llms atualizado | Sim, via aérea; combinar rota, requisitos, prazo e custo |
| Qual canil há em Bragança? | Marca, contato, sobre e página local | Não inventar ranking ou certificação |

Não criar uma página por pergunta nem microfone apenas por SEO. Respostas claras, HTML e links existentes são a base. Melhor oportunidade editorial futura: registros próprios verificáveis de rotina, desenvolvimento da pelagem e logística, com revisão responsável, não repetição de palavras-chave.

## 14. Voz interna: diagnóstico do que já existe

**Não é necessário instalar um novo chat para começar: já há chat automatizado com modo de voz na home.** `HomeClientOnly.tsx` carrega o componente por proximidade da viewport; `AiMatchmakerChat.tsx` oferece texto e botão de voz. Usa `getUserMedia` + `MediaRecorder`, envia áudio a `/api/transcribe` e usa `speechSynthesis` do navegador para leitura. Não usa SpeechRecognition como motor de transcrição atual. Há fallback para questionário quando a IA falha.

Backend atual: `app/api/matchmaker/route.ts` usa SDK compatível OpenAI contra Groq, modelo `llama-3.3-70b-versatile`; transcrição Groq `whisper-large-v3-turbo`, português. Não significa que a API da OpenAI esteja sendo faturada. Chaves, saldo, latência, custo real e qualidade das respostas em produção não foram testados.

Pontos positivos observados: identificação como chat automatizado, alternativa por texto, acionamento explícito de voz, zero pedido automático de microfone no teste de montagem. Pendências: validar comportamento de parada/reinício, permissões negadas, Safari/iOS e Android reais; formatos de gravação; leitor de tela; comunicação de envio de áudio a terceiro; retenção de texto/áudio; prevenção de respostas comerciais incorretas.

## 15. Proposta técnica e financeira — NÃO IMPLEMENTADA

**Recomendação: não adicionar outra integração agora. Revisar a existente em uma etapa autorizada, começando por verdade comercial e controle de custo.** Não substituir WhatsApp nem adicionar popup/áudio automático.

Arquitetura mínima sugerida:

1. Catálogo público + FAQ/fatos aprovados alimentam um resolvedor somente leitura. Preço e status vêm do item/slug, nunca de inferência de cor/sexo.
2. Intenções comuns retornam cards, links e respostas determinísticas com fonte; quando não houver dado confiável, WhatsApp oficial. Reserva não é confirmada pelo chat.
3. Se mantida geração, modelo apenas redige informação validada; preço/estado são validados no servidor antes de exibição. Nenhum acesso a painel, clientes, contratos, ferramentas de escrita ou chaves no navegador.
4. Voz permanece opcional, iniciada pelo usuário, com texto equivalente e indicação clara de gravação/envio. Parar deve encerrar captura e síntese. Sem uso como requisito para navegar/comprar.

Alternativa sem IA generativa: pesquisa por texto, filtros reais e FAQ. Pode eliminar custo incremental de modelo nessa jornada; não torna desenvolvimento/hospedagem gratuitos. Reconhecimento nativo do navegador é alternativa a estudar, não promessa de execução local ou compatibilidade universal: [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) documenta disponibilidade limitada e possíveis serviços remotos.

Custos consultados em 09/10: Groq lista `whisper-large-v3-turbo` a US$0,04/hora de áudio; isso não é orçamento total, não inclui chat, infraestrutura, câmbio, impostos ou regras de cobrança. `llama-3.3-70b-versatile` aparece com condição Enterprise/Contact Sales na documentação consultada; **custo real da conta não confirmado**, não estimado por tabela antiga. Fontes: [modelos Groq](https://console.groq.com/docs/models) e [transcrição Groq](https://console.groq.com/docs/speech-to-text). Desenvolvimento inicial depende de escopo e não foi cotado. Nenhum gasto novo aprovado ou ativado por esta proposta.

Antes de implementação: definir teto financeiro global e alertas, limite por sessão/IP, duração de áudio, timeout, resposta de fallback, política de retenção/minimização e revisão de LGPD. Não enviar PII a analytics; mapear provedores e transferências com responsável. Política atual contém disposições gerais, mas não foi identificada descrição específica do fluxo de áudio/Groq: revisão de transparência, não parecer de ilegalidade.

Desempenho: manter carregamento tardio existente e medir bytes, CPU, LCP/INP antes/depois; impacto da voz em sessão real ainda não medido. Manutenção: atualizar a mesma fonte de catálogo/FAQ, testes de mudanças de preço/status, verificar modelos e limites do provedor.

Plano de testes: preço individual de dois filhotes de mesma cor/sexo; vendido/reservado; falta de dado; prompt injection; ausência de acesso privado/escrita; limite/custo; falha do provedor; suporte/negação de microfone; parar gravação; Safari/iOS/Android; teclado/leitor de tela; áudio não automático; WhatsApp e consentimento sem duplicação. Reversão proposta: flag para voltar ao texto/FAQ e rollback do deploy, sem migração destrutiva. Implementar somente após aprovação do escopo.

## 16. SEO local e presença digital

Site/código: By Império Dog, Spitz Alemão Anão/Lulu da Pomerânia, Bragança Paulista/SP, WhatsApp +55 11 96863-3239 e contato@byimperiodog.com.br consistentes nas fontes inspecionadas. «Desde 2013» vem da fonte de negócio existente; não houve comprovação documental externa nesta etapa. Sementinhas de Amor já integra a identidade; preservada.

Google Business Profile, Instagram e Facebook: acesso direto pela ferramenta não permitiu confirmar dados atuais completos nem administração. **NÃO VERIFICADOS externamente**, não declarados errados. `sameAs` existente não foi ampliado com relações não verificadas.

O [diretório Cylex](https://www.cylex.com.br/braganca-paulista/by-imperio-dog-13703942.html) apareceu com nome/cidade/telefone correspondentes, mas 24h, categoria de creche e ausência de atendimento presencial que precisam ser confirmados com o negócio. O site informa 8h–22h e visita combinada. Como fetch direto retornou 403 e a versão acessível pela busca pode estar em cache, tratar como **indício, não divergência atual comprovada**. Nenhum perfil foi editado.

Páginas SP/MG/RJ existentes usam estrutura compartilhada e orientações logísticas; mantêm sede em Bragança. Não há justificativa para criar dezenas de páginas municipais repetidas. Melhorar futuramente com evidências reais de atendimento/logística, sem endereços fictícios, avaliações inventadas ou promessa de entrega irrestrita.

## 17. Próximas ações priorizadas

| Prioridade | Ação | Custo / risco | Condição |
| --- | --- | --- | --- |
| P1 | Alinhar assistente a preço individual e validar respostas | Desenvolvimento; risco médio de comportamento | Aprovação específica da etapa 15 |
| P1 | Mapear privacidade de áudio e teto global de uso | Desenvolvimento/revisão; custo real a confirmar | Aprovar política e orçamento antes de alterar |
| P1 | Confirmar ingestão de eventos e origem da divergência cliques/sessões | Diagnóstico, sem refazer tags | Acesso efetivo GA4/GTM/Ads, sem mudar campanhas |
| P2 | Investigar LCP mobile com dados de campo/amostras repetidas | Diagnóstico; evitar regressão visual | PSI/CrUX/GSC acessíveis |
| P2 | Diagnosticar curtidas, validar RLS/Storage e avaliar transitivas/CSP | Risco médio; não migrar cegamente | Acesso mínimo necessário e plano de regressão |
| P3 | Confirmar horários/categoria nos perfis externos | Baixo; depende de autorização | Verificar estado atual e serviço real |
| P3 | Conteúdo original e acompanhamento de citações por IA | Trabalho editorial, benefício não garantido | Fontes reais, medições periódicas sem manipulação |

Conclusão: corrigidos apenas textos públicos comprovadamente inconsistentes e a fonte de logística confirmada pelo usuário. Base técnica existente preservada. Visibilidade generativa e eficácia comercial não foram inventadas; a proposta de voz/IA permanece sem implementação automática.
