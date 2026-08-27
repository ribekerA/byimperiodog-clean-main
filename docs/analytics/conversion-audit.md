# Auditoria forense — Google Ads, GTM, GA4 e WhatsApp

Data: 27/08/2026
Projeto: By Império Dog
Estado: código implantado, GTM versão 16 publicada e domínio de produção validado

## 1. Situação encontrada

O domínio publicado não carregava GTM, GA4 nem Google Ads, mesmo após o aceite do banner. A API pública de tracking retornava IDs nulos. Por isso os links de WhatsApp funcionavam para o visitante, mas o clique não tinha um caminho técnico ativo até o Google Ads.

No código havia ainda duas rotas conceituais para o mesmo clique (`whatsapp_click` e `ads_conversion_sent`) e risco de `page_view` SPA duplicado: o site chamava `gtag` nas navegações enquanto o GTM também tinha um acionador History Change.

O acesso autenticado confirmou:

- GTM real: `GTM-NM5P94W8`, versão publicada 16;
- GA4 real: `G-WZ9RQKW48Z`, propriedade `WEB Analytics`;
- Google Ads ativo: `316-551-9817`, conta `Karen Cristina Ferreira`;
- Conversion ID: `AW-16465652074`;
- Conversion Label: `kx_fCODZyuQcEOrSt6s9`;
- Google tag vinculada ao GA4: `GT-M6QS4CHS`;
- Google tag da conta Ads: `GT-T9C34H7P`, carregada indiretamente pela tag de conversão apenas no clique; não deve ser instalada diretamente;
- a antiga tag-base separada `AW-16465652074` ativava também o GA4 legado `G-NQJJ8H969T` e duplicava `page_view`; ela foi removida na versão 16.

## 2. Causa raiz

1. A configuração pública efetiva não entregava o ID do GTM ao layout do site.
2. O fallback `NEXT_PUBLIC_GTM_ID`, embora presente localmente com o contêiner correto, era ignorado por `resolveActiveEnvironment`.
3. O evento do site não alimentava uma única arquitetura canônica no GTM.
4. Tags antigas de WhatsApp permaneciam executáveis e poderiam duplicar a medição.
5. O `page_view` SPA tinha dois possíveis emissores.
6. A ação de conversão do Ads estava com nome e janela de clique fora do padrão definido para esta implementação.
7. A tag-base separada do Ads carregava uma configuração remota conectada ao GA4 antigo `G-NQJJ8H969T`, criando um segundo `page_view`.

## 3. Correções executadas

### Site

- Todos os CTAs válidos para o número oficial emitem um único objeto `dataLayer` com `event: "whatsapp_click"`.
- O payload contém apenas `channel`, `cta_location`, `page_path`, `content_type` e, quando aplicável, `item_id`.
- Links de compartilhamento sem destinatário não contam como lead.
- Referências `[ref: ...]` foram removidas das mensagens de filhotes.
- O catálogo foi ordenado do menor para o maior preço.
- Os valores de filhote são exibidos sem “A partir de”.
- Preços confirmados: Particolor macho R$ 5.500; Laranja macho R$ 5.500; Branco macho R$ 6.500; Branco fêmea R$ 7.500.
- Com GTM ativo, `TrackingScripts` não envia `page_view` por `gtag`; o History Change do GTM é a fonte única.
- `resolveActiveEnvironment` usa o ID do banco como fonte principal e aceita `GTM_ID`/`NEXT_PUBLIC_GTM_ID` validado como fallback.

### GTM — versões 15 e 16 publicadas

- Backup da versão publicada 14 exportado antes das alterações.
- Criado `CE | whatsapp_click`, Custom Event exato `whatsapp_click`.
- Criadas cinco variáveis DLV v2: `channel`, `cta_location`, `page_path`, `content_type` e `item_id`.
- Criada `GA4 | Event | whatsapp_click` para `G-WZ9RQKW48Z`.
- Criada `Google Ads | Conversion | Lead WhatsApp Site` para `16465652074/kx_fCODZyuQcEOrSt6s9`.
- `GA4 – Page View SPA` ficou somente com `History Change – SPA`.
- Quatro tags antigas de WhatsApp foram pausadas e renomeadas com `[LEGADO - NÃO USAR]`.
- A versão 15 publicou a arquitetura canônica e os legados sem capacidade de disparo no clique validado.
- A validação em produção revelou que a tag-base separada `Google Ads – Tag base` carregava o GA4 antigo `G-NQJJ8H969T`.
- A versão corretiva 16 removeu somente essa tag-base redundante.
- A Google tag canônica `G-WZ9RQKW48Z`, o Conversion Linker e a conversão direta do Ads foram preservados.

### GA4

- `whatsapp_click` foi criado pela opção **Criar com código** e marcado como evento principal.
- Nenhum evento derivado foi criado; o código que envia o evento continua sendo o site/GTM.
- O vínculo com Google Ads e os sinais de consentimento estavam ativos.

### Google Ads

- `Clique WhatsApp` foi consolidada como `Lead | WhatsApp | Site`.
- Origem Site, Principal, contagem Uma, sem valor, janela de clique 30 dias e atribuição baseada em dados.
- Codificação automática confirmada como ativa.
- O recurso oficial de mensagem do WhatsApp já aprovado foi associado à campanha `Pesquisa | Spitz Branco Fêmea`.
- Nenhum orçamento, lance, palavra-chave, localização ou anúncio foi modificado.

## 4. Arquivos envolvidos

Principais arquivos de tracking:

- `src/components/PixelsByConsent.tsx`
- `src/components/TrackingScripts.tsx`
- `src/components/tracking/WhatsAppClickTracker.tsx`
- `src/lib/conversions.ts`
- `src/lib/events.ts`
- `src/lib/pixels.ts`
- `src/lib/tracking.ts`
- `src/hooks/useWhatsAppLink.ts`
- `tests/components/pixelsByConsent.test.tsx`
- `tests/components/trackingScripts.test.tsx`
- `tests/components/whatsappClickTracker.test.tsx`
- `tests/lib/conversions.test.ts`
- `tests/lib/pixels.test.ts`
- `tests/e2e/whatsapp-tracking.spec.ts`

Principais arquivos de catálogo/preços:

- `content/puppies-static.ts`
- `src/domain/pricing.ts`
- `src/components/catalog/StaticCatalog.tsx`
- `src/components/catalog/StaticPuppyCard.tsx`
- `src/components/catalog/PuppyDetailPanel.tsx`
- `src/components/catalog/PuppyStickyFloatingCTA.tsx`
- `src/components/color-page/ColorPageContent.tsx`
- `app/(public)/filhotes/[slug]/page.tsx`
- `app/(public)/filhotes/sexo/[sexo]/page.tsx`
- `app/(public)/page.tsx`
- `tests/pricing-guard.test.ts`
- `tests/e2e/smoke.spec.ts`

Backup permanente:

- `docs/analytics/gtm-GTM-NM5P94W8-version-14-backup-2026-08-27.json`

Arquivos mortos removidos após comprovação de ausência de uso:

- `src/components/MarketingPixels.tsx`
- `src/components/WhatsAppButton.tsx`
- `src/components/blog/WhatsAppFloat.tsx`

`src/lib/rum/web-vitals.ts` já estava alterado antes desta tarefa e foi preservado sem edição.

## 5. Tags e IDs ativos no desenho final

| Item | Identificador | Estado |
|---|---|---|
| Container GTM | `GTM-NM5P94W8` | versão 16 ativa em produção |
| GA4 | `G-WZ9RQKW48Z` | única Google tag base carregada em todas as páginas |
| Google tag observada | `GT-M6QS4CHS` | destino associado |
| Google tag Ads | `GT-T9C34H7P` | carregada indiretamente pela conversão; não instalar diretamente |
| Google Ads | `AW-16465652074` | destino da conversão, sem segunda tag-base All Pages |
| Conversão Ads | `16465652074/kx_fCODZyuQcEOrSt6s9` | tag direta validada no Preview e em produção |
| Evento canônico | `whatsapp_click` | 1 evento por clique |
| Evento principal GA4 | `whatsapp_click` | cadastrado antecipadamente |
| Page view SPA | `GA4 – Page View SPA` | apenas `History Change – SPA` |
| Conversion Linker | `Google Ads – Vinculador de conversões` | preservado |

## 6. Legados

No GTM, ficaram pausadas e claramente identificadas:

- `[LEGADO - NÃO USAR] GA4 – click_whatsapp`;
- `[LEGADO - NÃO USAR] GA4 – click_whatsapp (Número)`;
- `[LEGADO - NÃO USAR] GA4 – click_whatsapp todos`;
- `[LEGADO - NÃO USAR] GA4 - whatsapp_from_puppy_modal`.

No Ads:

- `Pixel Clicou Botão Whatsapp`: Secundária, contagem Uma, janela 90 dias, fora das metas da conta;
- `Contato`: Secundária e fora das metas da conta;
- o histórico foi preservado; nenhuma ação antiga foi excluída.

## 7. Evidências de teste

| Evidência | Resultado |
|---|---|
| Testes direcionados finais | 32/32 aprovados |
| Suíte unitária completa | 59 arquivos aprovados e 1 ignorado; 460 testes aprovados e 3 ignorados |
| TypeScript | aprovado |
| Lint dos arquivos tocados | 0 erros; 15 avisos preexistentes em `TrackingScripts.tsx` |
| Build | aprovado; 136 páginas geradas |
| Guardas de catálogo, vitrine, conteúdo e verdade pública | aprovadas |
| Servidor atualizado | `http://localhost:3001` |
| GTM antes do consentimento | 0 scripts |
| GTM após o aceite | 1 script e requisição para `GTM-NM5P94W8` |
| Clique local | exatamente 1 `whatsapp_click`, sem PII |
| Preview: GA4 Event | incremento de 2 para 3 após um clique |
| Preview: Ads Conversion | incremento de 2 para 3 após o mesmo clique |
| Preview: navegação SPA | 1 History Change e 1 Page View SPA |
| Catálogo | preços `[5500, 5500, 6500, 6500, 7500, 7500, 7500, 7500, 8500, 8500]` |
| `[ref:]` e “A partir de” | ausentes nas páginas verificadas |
| CI remoto | aprovado, incluindo 17 smokes públicos |
| CodeQL | aprovado |
| Produção: catálogo | `5500, 5500, 6500, 6500, 7500, 7500, 7500, 7500, 8500, 8500` |
| Produção: GTM publicado | 1 `gtm.js` e 1 `gtag/js`, somente `G-WZ9RQKW48Z` em All Pages |
| Produção: clique | 1 `whatsapp_click`; GA4 e Ads dispararam 1 vez no Tag Assistant |
| Produção: coleta de teste | requisições interceptadas e respondidas localmente, sem gravar conversão artificial |
| Produção: GA4 legado | `G-NQJJ8H969T` ausente após a versão 16 |

O build registrou `site_settings read error: fetch failed` no ambiente de rede restrita. O fallback previsto foi usado e o build terminou com sucesso.

## 8. Configurações externas concluídas

- GTM: versões 15 e 16 publicadas, versão 16 ativa, backup da versão 14 preservado e Preview de produção aprovado.
- GA4: `whatsapp_click` registrado como evento principal.
- Ads: ação direta normalizada e recurso de mensagem associado à campanha.
- Ads: codificação automática ativa.
- Consentimento: `analytics_storage`, `ad_storage`, `ad_user_data` e `ad_personalization` confirmados ativos no vínculo.

## 9. Bloqueios restantes

1. A ação `Lead | WhatsApp | Site` ainda pode mostrar diagnóstico transitório até que eventos legítimos sejam processados pelo Google Ads.
2. Mesmo com o recurso de mensagem aprovado e associado à campanha, a meta nativa `Leads a partir de mensagens`/`Mensagens dos seus anúncios` ainda não aparece no seletor. Isso depende de propagação ou elegibilidade do Google Ads; não foi criada uma conversão falsa para contornar.
3. Os 1.147 avisos de lint são dívida preexistente sem erro bloqueante e serão tratados em tarefa separada, por etapas.

## 10. Próximas ações autorizáveis

1. Aguardar 24–48 horas para o diagnóstico do Ads processar tráfego legítimo.
2. Reabrir as metas da campanha e verificar se a meta nativa de mensagens passou a aparecer.
3. Confirmar `whatsapp_click` no GA4 Realtime quando houver um contato legítimo.
4. Executar o saneamento de lint como tarefa separada, por etapas.

## 11. Critério de aceite

**APROVADO COM BLOQUEIO HUMANO.**

O código, o deploy, o GTM e o Tag Assistant no domínio real estão tecnicamente aprovados. A classificação permanece com bloqueio humano somente porque o diagnóstico do Ads depende de tráfego legítimo/processamento e a meta nativa de mensagens ainda depende da elegibilidade/propagação da plataforma.

## Rollback

- Código: usar `git revert` nos commits publicados, preservando alterações posteriores.
- GTM: republicar a versão 15 para reverter somente a remoção da tag-base; usar a versão 14/backup para rollback integral da reconstrução.
- Ads: tornar `Lead | WhatsApp | Site` Secundária ou retirá-la da meta, sem excluir a ação.
- GA4: desmarcar `whatsapp_click` como evento principal, se necessário.
