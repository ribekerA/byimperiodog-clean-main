# Runbook operacional — GTM, GA4, Google Ads e WhatsApp

Atualizado em 27/08/2026. Este roteiro parte do workspace 15 já configurado e testado. Não publicar GTM, não fazer deploy e não alterar campanhas sem aprovação humana explícita.

## Inventário confirmado

| Plataforma | Identificação |
|---|---|
| GTM | conta `By Imperio Dog`, container `GTM-NM5P94W8`, workspace 15 |
| GTM publicado | versão 14 |
| Backup | `docs/analytics/gtm-GTM-NM5P94W8-version-14-backup-2026-08-27.json` |
| GA4 | conta/propriedade `339-484-5796` / `WEB Analytics` |
| Web stream | `By Imperio Dog - Site`, `G-WZ9RQKW48Z` |
| Google tag observada | `GT-M6QS4CHS` |
| Google Ads | conta ativa `316-551-9817`, `AW-16465652074` |
| Conversão do site | `Lead | WhatsApp | Site`, label `kx_fCODZyuQcEOrSt6s9` |
| Campanha | `Pesquisa | Spitz Branco Fêmea` |

Não copiar cookies, tokens, senha ou 2FA. Não clicar no próprio anúncio.

## Arquitetura canônica

Um clique válido no WhatsApp produz no site:

```js
{
  event: "whatsapp_click",
  channel: "whatsapp",
  cta_location: "hero",
  page_path: "/",
  content_type: "home"
  // item_id: somente quando houver slug interno do filhote
}
```

Esse único Custom Event aciona, no GTM:

1. `GA4 | Event | whatsapp_click`;
2. `Google Ads | Conversion | Lead WhatsApp Site`.

Não enviar nome, telefone, e-mail, mensagem, endereço, GCLID, GBRAID ou WBRAID no payload.

## Estado do workspace 15

### Trigger

| Campo | Valor |
|---|---|
| Nome | `CE | whatsapp_click` |
| Tipo | Custom Event |
| Event name | `whatsapp_click` |

### Variáveis

- `DLV | channel` → `channel`;
- `DLV | cta_location` → `cta_location`;
- `DLV | page_path` → `page_path`;
- `DLV | content_type` → `content_type`;
- `DLV | item_id` → `item_id`.

### Evento GA4

| Campo | Valor |
|---|---|
| Nome | `GA4 | Event | whatsapp_click` |
| Measurement ID | `G-WZ9RQKW48Z` |
| Event name | `whatsapp_click` |
| Trigger | `CE | whatsapp_click` |
| Parâmetros | as cinco DLVs acima |

### Conversão direta Google Ads

| Campo | Valor |
|---|---|
| Nome | `Google Ads | Conversion | Lead WhatsApp Site` |
| Conversion ID | `16465652074` |
| Conversion Label | `kx_fCODZyuQcEOrSt6s9` |
| Value | vazio |
| Transaction ID | vazio |
| Trigger | `CE | whatsapp_click` |

### Page view SPA

`GA4 – Page View SPA` usa somente `History Change – SPA`. O código direto de `TrackingScripts` fica desativado quando GTM está ativo.

### Legados pausados

- `[LEGADO - NÃO USAR] GA4 – click_whatsapp`;
- `[LEGADO - NÃO USAR] GA4 – click_whatsapp (Número)`;
- `[LEGADO - NÃO USAR] GA4 – click_whatsapp todos`;
- `[LEGADO - NÃO USAR] GA4 - whatsapp_from_puppy_modal`.

Não excluir tags, triggers nem ações de conversão antigas; preservar histórico.

## Validação local reproduzível

1. Executar `npm test`.
2. Executar `npm run typecheck`.
3. Executar `npm run build`.
4. Iniciar `npx next start -p 3001`.
5. Abrir `http://localhost:3001`.
6. Antes do consentimento, confirmar 0 scripts `gtm.js`.
7. Aceitar todos e confirmar 1 script para `GTM-NM5P94W8`.
8. No GTM, clicar **Visualizar** e conectar a `http://127.0.0.1:3001/`.
9. Clicar uma vez em um CTA válido sem abrir anúncio.
10. Confirmar 1 `whatsapp_click`, 1 incremento na tag GA4 e 1 incremento na tag Ads.
11. Navegar internamente e confirmar 1 History Change e 1 Page View SPA.
12. Conferir a camada de dados e confirmar ausência de PII.

Resultado de referência em 27/08/2026:

- GA4 Event: 2 → 3 após um clique;
- Ads Conversion: 2 → 3 após o mesmo clique;
- SPA `/ → /filhotes`: 1 History Change e 1 Page View SPA.

## Google Ads

### Conversão do site

`Lead | WhatsApp | Site` deve permanecer:

- origem Site;
- Principal;
- contagem Uma;
- sem valor;
- janela de clique 30 dias;
- atribuição baseada em dados;
- incluída nas metas da conta.

`Pixel Clicou Botão Whatsapp` e `Contato` devem permanecer Secundárias e fora das metas enquanto a nova arquitetura é estabilizada.

### Recurso nativo de mensagens

O recurso oficial de WhatsApp está aprovado e associado à campanha `Pesquisa | Spitz Branco Fêmea`. A meta `Leads a partir de mensagens`/`Mensagens dos seus anúncios` ainda não aparece no seletor.

Procedimento:

1. aguardar propagação do Google Ads;
2. reabrir as metas específicas da campanha;
3. se a meta nativa aparecer, selecioná-la como caminho separado;
4. não criar conversão de site falsa nem duplicar o recurso para contornar a ausência;
5. não misturar a conversão nativa do anúncio com a conversão do clique no site.

Codificação automática está ativa. Nunca testar clicando no próprio anúncio.

## GA4

`whatsapp_click` já foi criado pela opção **Criar com código** e marcado como evento principal. Não criar um evento derivado com o mesmo nome.

Se futuramente houver importação do GA4 para o Ads, mantê-la Secundária. A tag direta do Ads e a importação do GA4 não podem ser simultaneamente principais para o mesmo clique.

## Publicação aprovada

Somente após conferência do diff e autorização explícita:

1. criar commit único do código aprovado;
2. fazer um único push/deploy;
3. publicar uma única versão do GTM, com nome e descrição de rollback;
4. repetir Tag Assistant em `https://www.byimperiodog.com.br`;
5. confirmar GA4 DebugView/Realtime;
6. verificar Diagnostics da ação `Lead | WhatsApp | Site`;
7. aguardar 24–48 horas de processamento;
8. validar com tráfego legítimo, sem clique próprio em anúncio.

## Rollback

- GTM: republicar a versão 14 registrada no backup.
- Ads: tornar a nova ação Secundária ou removê-la das metas, sem excluir histórico.
- GA4: desmarcar `whatsapp_click` como evento principal.
- Site: usar `git revert` no commit aprovado e fazer um único redeploy.

## Critério de aceite pós-publicação

O trabalho só passa de **APROVADO COM BLOQUEIO HUMANO** para **APROVADO** quando:

- o código estiver implantado;
- o workspace GTM estiver publicado;
- o Preview/Tag Assistant no domínio real mostrar um disparo por clique;
- o GA4 receber `whatsapp_click` uma vez;
- o diagnóstico da conversão do Ads deixar de depender da ausência de tráfego/tag;
- não houver PII nem duplicidade.
