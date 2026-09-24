# Auditoria Google Ads ultra-enxuta — 24/09/2026

## Escopo e regra de segurança

Auditoria baseada no snapshot da conta coletado em 23/09/2026, no histórico de 24/08 a 22/09, no GA4, no Search Console e no código local. Nenhuma campanha, anúncio, orçamento, lance, conversão ou página foi alterada nesta etapa.

## Resumo executivo

- Existem três campanhas Search ativas/elegíveis, todas com orçamento de R$ 10/dia e anúncios aprovados com força `GOOD`: branca, canil e preta.
- Não houve entrega entre 14 e 23/09 no recorte coletado. Políticas dos anúncios não explicam isso, mas faltam evidências de faturamento, datas finais, agenda e diagnóstico de demanda para atribuir uma causa.
- Em 30 dias houve 182 cliques e custo de R$ 331,57, mas só 33 sessões pagas no GA4. Auto-tagging estava ligado. A diferença precisa de teste de GCLID/redirect/tag e análise respeitando consentimento; não é prova de fraude.
- O anúncio da fêmea preta continha R$ 8.500 em dois campos. Após prévia `validate_only` e autorização humana, ambos foram corrigidos para R$ 9.500 e confirmados novamente pela API em 24/09/2026; nenhum outro campo foi alterado.
- Houve 38 cliques de WhatsApp no GA4, 22 sem `cta_location`. O código local atual corrige a classificação, mas publicação e comportamento em produção ainda precisam ser comprovados.
- A landing branca recebeu 22 sessões, engajamento de 40,9% e nenhum evento principal. É o principal ponto de fricção pós-clique.
- Só existe uma conversão Ads no período. Não existe volume para decisões por sistema operacional, dispositivo, cidade ou suposta renda.

## Entrega em 21 pontos

1. **O que existe:** três campanhas Search ativas: branca, canil e preta; uma campanha branca/SP pausada.
2. **Problemas confirmados:** preço errado no RSA preto; grande diferença Ads/GA4; 22/38 eventos WhatsApp sem localização; página branca sem evento principal; CRM sem os estágios comerciais pedidos.
3. **Tracking:** auto-tagging funciona; clique WhatsApp foi registrado; reconciliação ponta a ponta e publicação da correção de `cta_location` ainda não foram provadas.
4. **Palavras atuais:** a branca usa frases como `spitz alemão branco`, `spitz alemão fêmea`, `lulu branca` e `lulu femea`; o canil usa `canil spitz alemão` e termos amplos locais; a preta possui vários exatos/frase, ainda com amostra mínima.
5. **Termos reais:** em 251 linhas disponíveis não houve `split`, `splits`, `splitz`, `spltiz` nem termos de ar-condicionado/BTU/marcas investigadas. Houve variante próxima como `spitz anao branco`.
6. **Proposta inicial:** começar somente com `[spitz alemão fêmea branca]`; testar `[comprar spitz alemão]` apenas se o primeiro termo não tiver volume suficiente. Não adicionar uma terceira palavra por erro de digitação.
7. **Negativas propostas:** após aparecerem em termos reais, usar frase para `ar condicionado`, `ar-condicionado`, `split inverter`, `9000 btu`, `12000 btu`, `18000 btu`; não negativar `split` isoladamente. Revisar também adoção, grátis, OLX, Mercado Livre, pelúcia e emprego antes de aplicar. Remover da lista atual a negativa exata `spitz alemão branco valor`, pois ela bloqueia intenção comercial.
8. **Geografia atual:** o snapshot contém o critério de localização, mas o nome da região não foi resolvido com segurança. A campanha branca usa `PRESENCE_OR_INTEREST`; canil e preta usam `PRESENCE`.
9. **Geografia proposta:** núcleo de Bragança Paulista e cidades logisticamente próximas somente após relatório Ads por localização e CRM por venda. Não há prova para declarar cidades vencedoras.
10. **Presence:** propor `PRESENCE` para a campanha branca. Reduz interesse remoto, mas também pode perder pessoas de fora que buscam a região; requer aprovação.
11. **Redes:** Search Partners e Display aparecem desativados no snapshot atual. Houve 14 cliques históricos classificados como Content, que precisam ser associados à campanha/data antes de concluir origem.
12. **Orçamento:** R$ 10/dia em cada campanha ativa. Não aumentar.
13. **Lance:** `TARGET_SPEND`/Maximizar cliques com teto de CPC de R$ 3. Não alterar nesta fase; a conta ainda não tem conversões qualificadas suficientes para lance por conversão.
14. **Conversão de otimização:** objetivo de contato no site está habilitado; `Lead | WhatsApp | Site` registrou uma conversão. Clique WhatsApp não é venda nem receita.
15. **Três RSAs propostos:** apresentados abaixo, somente para revisão.
16. **Melhor landing:** `/filhotes/spitz-alemao-anao-branco-femea`, por correspondência específica, desde que inventário e preço das duas fêmeas sejam confirmados.
17. **Melhorias indispensáveis:** indicar imediatamente quantidade real, preço individual confirmado, localização, fotos de cada filhote, CTA direto, prova documental factual e carregamento móvel mais rápido; preservar a URL, sem página duplicada.
18. **Riscos de desperdício:** termos amplos, keyword `lulu` contra a decisão comercial, negativa de “valor”, localização por interesse, página sem conversão e otimização para clique em vez de lead qualificado.
19. **Tráfego inválido:** não comprovado. Faltam colunas `Invalid clicks`, `Invalid interactions` e créditos de faturamento. Sessão curta, país ou ausência de conversão não constituem fraude.
20. **Dados faltantes:** faturamento/recusa de pagamento, datas finais, agenda, diagnósticos de keyword, volume de busca, relatório geográfico Ads, inválidos/créditos, logs de GCLID e vendas/qualificação no CRM.
21. **Aprovações humanas:** preço do RSA preto; remoção/adição de keywords e negativas; Presence; eventual pausa/consolidação; textos dos RSAs; landing; migração do CRM. Publicação e ativação continuam proibidas sem autorização específica.

## Prévia exata — correção do anúncio preto

Anúncio existente: `824511454007`.

- Headline: `R$ 8.500 no Pix` → `R$ 9.500 no Pix`
- Descrição: `Fêmea preta por R$ 8.500 no Pix. Registro oficial, consulta e hemograma inclusos.` → `Fêmea preta por R$ 9.500 no Pix. Registro oficial, consulta e hemograma inclusos.`

Nenhum outro campo deve mudar. Aplicação depende de autorização exata e de validação final da API antes da mutação.

## Três RSAs propostos para as fêmeas brancas

### RSA 1 — produto e intenção

Headlines: `Spitz Alemão Fêmea Branca`; `Conheça as Fêmeas Brancas`; `Filhote em Bragança Paulista`; `Fotos e Informações no Site`; `Atendimento Direto no WhatsApp`.

Descrições: `Veja fotos reais, preço confirmado e informações das fêmeas brancas no site.`; `By Império Dog em Bragança Paulista. Tire dúvidas diretamente pelo WhatsApp.`

### RSA 2 — correspondência e transparência

Headlines: `Spitz Alemão Anão Branco`; `Fêmeas Brancas Disponíveis`; `Preço e Fotos no Site`; `Canil em Bragança Paulista`; `Consulte a Disponibilidade`.

Descrições: `Confira cada fêmea, o valor atual e as condições informadas pela By Império Dog.`; `Acesse a página específica e fale com a equipe para confirmar a disponibilidade.`

### RSA 3 — marca e atendimento

Headlines: `By Império Dog Desde 2013`; `Spitz Alemão Fêmea Branca`; `Atendimento Direto`; `Conheça Antes de Reservar`; `Bragança Paulista SP`.

Descrições: `Conheça as fêmeas brancas com fotos reais e informações objetivas no site.`; `Confirme preço, documentação e disponibilidade atual diretamente com a equipe.`

Não usar `Lulu da Pomerânia` como keyword positiva. Os textos acima também evitam essa expressão até decisão explícita.

## Plano de reconciliação Ads → GA4 → WhatsApp → CRM

1. Exportar por dia/campanha: cliques, custo, cliques inválidos, interações inválidas e créditos.
2. Testar cada URL final com `?gclid=teste&utm_source=google&utm_medium=cpc` e verificar preservação após redirects.
3. Confirmar disparo da Google tag/GA4 somente após o estado de consentimento adequado, sem contornar a escolha do usuário.
4. Comparar páginas de destino do Ads com `landing page + query string`, campanha e source/medium no GA4.
5. Verificar GCLID, WBRAID e GBRAID como identificadores distintos; não preencher GCLID com outro identificador.
6. Fazer clique real controlado no WhatsApp e provar exatamente um `whatsapp_click`, um `cta_location` e, quando consentido, uma conversão Ads.
7. Criar migração de CRM com estágios `contato`, `qualificado`, `visita`, `reserva`, `venda` e desfechos `perdido`; registrar data e responsável de cada transição.
8. Importar para Ads apenas eventos comerciais confirmados e deduplicados. `whatsapp_click` permanece indicador intermediário.

## SEO orgânico

Trabalhar títulos e descrições das páginas existentes já posicionadas entre 4 e 8, especialmente consultas de preço/valor/preto. Melhorar a correspondência entre título, resposta inicial e tabela canônica; não criar páginas duplicadas, urgência falsa ou promessa de disponibilidade. Medir CTR por consulta/página e manter mudanças somente quando melhorarem cliques qualificados sem piorar posição ou conversão.

## Decisão

### MANTER

Search somente, auto-tagging, consentimento, URL específica, orçamento atual e distinção entre clique, lead e venda.

### CORRIGIR APÓS APROVAÇÃO

Preço preto, negativa de “valor”, Presence da branca, `cta_location` em produção e funil CRM.

### TESTAR

Uma keyword exata, preservação de GCLID, clique WhatsApp deduplicado, velocidade móvel e mensagem da landing.

### NÃO FAZER

Não aumentar orçamento, não usar ampla, não adicionar typo separado, não negativar `split` isolado, não bloquear usuários, não inferir renda por aparelho e não chamar tráfego de fraude sem evidência.

### DEPENDÊNCIA EXTERNA

Faturamento, agenda/datas, inválidos/créditos, relatório geográfico, publicação da versão local e confirmação operacional das duas fêmeas/preços.

### PRECISA DE APROVAÇÃO DA KAREN

Toda mutação externa, inclusive a substituição exata de R$ 8.500 por R$ 9.500 no anúncio preto.
