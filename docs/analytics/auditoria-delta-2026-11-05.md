# Auditoria delta — 05/11/2026

Baseline dos dados: **08/10/2026 a 04/11/2026** (28 dias).
Fontes: 16 exports de GA4 (propriedade "WEB Analytics" 339-484-5796), Google Search Console, Perfil da Empresa, e inspeção do site no ar (`byimperiodog.com.br`, que reflete `main`).

**Nenhum código foi modificado. Nada foi publicado.** Este documento é diagnóstico e plano; a seção D espera aprovação.

> **As duas visões do Search Console não são somáveis e não foram somadas.**
> Visão por consulta: **102 cliques / 18.884 impressões** / CTR 0,54% / posição 7,40 / 1.560 consultas.
> Visão por página de destino: **540 cliques / 67.304 impressões** / CTR 0,80% / posição 6,49 / 91 linhas.
> São populações diferentes (a visão por consulta omite consultas de baixo volume). Cada número abaixo diz de qual visão veio.

---

## A — O que já estava certo (preservado, não tocado)

1. **Títulos e meta descriptions das páginas prioritárias.** Todos bem formados, entre 55 e 68 caracteres, com descrições de 137–162. Conferidos no ar: `/` (65), `/filhotes` (66), `/blog/preco-spitz-alemao-anao` (59), `/blog/cores-spitz-alemao-anao-qual-mais-cara` (59), `/blog/spitz-alemao-anao-peso-desenvolvimento` (55), `/blog/alimentacao-spitz-alemao-anao` (63), `/blog/nomes-lulu-da-pomerania` (65), `/pomeranian` (68). **Não há problema de título a corrigir.**

2. **Sitemap saudável.** `sitemap.xml` responde 200 com 93 URLs e **19 valores distintos de `lastmod`**. A regressão de lastmod (datas todas iguais ao horário do build) **não está no ar**.

3. **Páginas geo indexáveis.** `/filhotes/sao-paulo`, `/filhotes/rio-de-janeiro`, `/filhotes/minas-gerais` e `/canil-spitz-alemao-interior-sp`: HTTP 200, `robots: index, follow, max-image-preview:large, max-snippet:-1`, títulos próprios, presentes no sitemap.

4. **Os CTAs já existem — a hipótese "falta CTA no blog" está descartada.** Contagem de links no HTML no ar (contato / para `/filhotes`): preco 6/11 · cores 6/15 · peso 6/5 · alimentacao 6/5 · nomes 6/11 · pomeranian 5/7 · filhotes 13/48. Os 6 links de contato de `/blog/preco-spitz-alemao-anao` carregam mensagens pré-preenchidas contextuais.

5. **O botão flutuante do WhatsApp funciona e é alcançável** em qualquer altura da página — ver a ressalva B3. Medido em 375×812: `fixed`, 56×56, visível e clicável com o banner dispensado.

6. **A arquitetura de medição do clique está certa.** `src/components/tracking/WhatsAppClickTracker.tsx` usa **um único ouvinte delegado em fase de captura**. É a decisão correta: evita contagem dupla entre pai e filho, sobrevive aos `stopPropagation()` dos cards de filhote, e o `try/catch` garante que medição quebrada nunca impeça o WhatsApp de abrir. O defeito em B2 é de uma condição, não desta arquitetura.

7. **`getAdsWhatsAppLabel()` devolve `null` até haver label real** — e `null` ali significa "não dispara", nunca "usa o label de lead no lugar". Correto.

8. **Consent Mode está de pé.** O HTML da home só expõe `GTM-NM5P94W8`; nenhum `G-` ou `AW-` aparece antes do consentimento.

9. **O roteamento interno para a página que vende funciona.** `/filhotes` teve 272 visualizações contra apenas 24 sessões de entrada — ou seja, quem chega ao site encontra a vitrine. E ela **converte a 25%**, a melhor taxa do site (GA4, página de destino).

---

## B — Problemas provados

| # | Problema | Evidência | Onde |
|---|---|---|---|
| **B1** | O botão "Compartilhar no WhatsApp" do blog **não compartilha** — abre conversa com o próprio canil | `shareOnWhatsApp` chama `buildWhatsAppLink`, que monta `https://wa.me/5511968633239?text=<título> - <url>`. Fica numa fileira com Facebook, X, Pinterest, Threads e copiar-link, que compartilham de verdade | `src/components/blog/ShareButtons.tsx:45-55` → `src/lib/whatsapp.ts:37-51` |
| **B2** | Esse mesmo toque é contado como **clique de contato** | O guarda `ehLinkDeContato` só roda no ramo `<a>`. O botão é `<button data-wa-cta="true" data-wa-placement="blog">`, cai na linha 166 e passa. Um toque dispara `trackShare` **e** `whatsapp_click` com `cta_location: "blog"` | `src/components/tracking/WhatsAppClickTracker.tsx:161-167` |
| **B2b** | O comentário que documenta essa proteção descreve **arquivo morto** | As linhas 57-65 dizem que `ShareButtons` aponta para `wa.me/?text=` sem número. Isso é verdade em `src/components/ShareButtons.tsx:65` — **que não é importado em lugar nenhum**. O arquivo vivo é `src/components/blog/ShareButtons.tsx` | `WhatsAppClickTracker.tsx:57-65`; `src/components/ShareButtons.tsx` (órfão) |
| **B3** | O banner de cookies **cobre** o botão flutuante do WhatsApp no mobile | Medido em 375×812: banner `fixed`, **z-index 9999**, 221px de altura = **27% da viewport**, colado no rodapé (top 591). Botão flutuante `fixed`, **z-index 9998**, top 732–788 — dentro desse retângulo. `elementFromPoint` no centro do botão devolve uma `div` do banner. Dispensado o banner, o botão fica alcançável | `src/components/ConsentBanner.tsx:88` (z-[9999]) vs `src/components/WhatsAppFloat.tsx:214` (z-[9998]) |
| **B4** | **O container GTM no ar não é o que está no repositório** | O backup v14 tem **três tags** mandando `click_whatsapp` no mesmo gatilho LINK_CLICK de `wa.me`. Um clique geraria ~3 eventos; 51 cliques dariam ~153. No GA4 do período, `click_whatsapp` **não aparece** entre os 10 maiores (logo ≤5 disparos), enquanto `whatsapp_click` — o nome que o código manda — marca 51. Por eliminação, o container vivo diverge | `docs/analytics/gtm-GTM-NM5P94W8-version-14-backup-2026-08-27.json` (10 semanas de idade) |
| **B5** | `view_puppy` caiu **73 → 26 (−64%)** enquanto o tráfego caiu −12% | O gatilho é `VISÃO – Modal Filhote Aberto` (ELEMENT_VISIBILITY), mas filhote **virou página real** (9 páginas em `/filhotes/…`). Existe um gatilho órfão `VIEW – Filhote` (PAGEVIEW, path contém `/filhotes`) **sem tag nenhuma**. Leitura mais provável: artefato da migração modal→página, **não** queda de interesse — mas isso **se prova no DebugView, não se afirma aqui** | mesmo backup; comparação com `docs/traffic-and-active-google-ads-2026-09-23.md` |
| **B6** | `GA4 – generate_lead` dispara em **FORM_SUBMISSION sem filtro** | Qualquer formulário do site serve — newsletter, filtro, o que for | mesmo backup |
| **B7** | A conversão de WhatsApp no Ads dispara em regex larga | `Google Ads – Conversão Clique WhatsApp`, conversionId `16465652074`, gatilho `(wa\.me\|whatsapp\.com\|whatsapp:)`. Combinado com B1/B2, **compartilhar um artigo pode escrever conversão de lead na conta do Ads** | mesmo backup — **a confirmar no container vivo** |
| **B8** | Inversão tráfego × conversão | `/blog/alimentacao` (62 cliques), `/blog/nomes` (57) e `/blog/peso` (57) somam **176 cliques orgânicos e 0 key events**. Servem intenção de dono, não de comprador. Enquanto isso `/filhotes` converte a **25%** e **não aparece** no top 10 orgânico (24 sessões de entrada) | GSC visão por página; GA4 página de destino |
| **B9** | CTR de intenção de preço ~10× abaixo da curva da posição | `/blog/preco-spitz-alemao-anao`: **10.172 impressões, posição 6,51, CTR 0,37%**. Mesma assinatura na consulta "spitz alemão anão valor": 1.061 impressões, posição 5,43, **CTR 0,57%**. Causa mais provável: **absorção na SERP** (AI Overviews / People Also Ask em "quanto custa / valor") | GSC, as duas visões |
| **B10** | Paid Search praticamente morto | **3 sessões, 0 key events, R$ 0,00** registrado no GA4 — contra 182 cliques e R$ 331,57 no período 24/08–22/09 | GA4 aquisição; `docs/traffic-and-active-google-ads-2026-09-23.md` |
| **B11** | Canal de lead invisível ao funil | Perfil da Empresa: **63 interações, 15 ligações telefônicas, 48 cliques para o site**. As 15 ligações não passam por evento nenhum do site | Visão geral do Perfil da Empresa |
| **B12** | Um dos exports está **fora do período** | `https___byimperiodog.com.br_-Performance-on-Search-2025-11-03 - Consultas.pdf` é de **2025**, um ano antes da baseline. **Não foi misturado** a nenhum número acima | export do GSC |

### Contexto que dá peso aos itens acima

- **92,1% do tráfego é mobile** (iOS 142, Android 125; desktop 23 sessões). B3 atinge quase todo mundo.
- **64,6% mulheres**, 25-34 a faixa maior; Brasil 272, São Paulo 76, Bragança Paulista 14.
- **AI Assistant já é o canal que mais converte**: 23 sessões, **21,74% de taxa de key event** (chatgpt.com, 23 sessões) — contra 11,52% do Organic Search.
- **1 lead novo no período, 0 qualificado, 0 convertido.** R$ 0,00 de receita, 0 transações.
- Retenção: 285 novos contra 29 recorrentes; cai depois do dia 1.
- `/pomeranian` aparece com ~2,9 mil impressões mas **não figura na lista de cliques**.

---

## C — Correções executadas

**P1, opção (a) — aprovada por você em 05/11/2026 ("Compartilhar de verdade").** Aplicada na working tree, **não publicada**. Nada mais da seção D foi tocado.

| Arquivo | O que mudou |
| --- | --- |
| `src/components/blog/ShareButtons.tsx` | O botão passa a abrir `https://wa.me/?text=` **sem número** — o seletor de contatos do WhatsApp, destinatário escolhido por quem clica. Os `utm_source=whatsapp&utm_medium=share&utm_campaign=blog_post` seguem no link compartilhado. Removidos `data-wa-cta="true"` e `data-wa-placement="blog"`; ficaram o `aria-label` e o `data-track-event="share_whatsapp"`. Não usa a janela de 600x560 dos outros sharers: ela é ruim no celular, que é 92,1% do tráfego |
| `src/components/tracking/WhatsAppClickTracker.tsx` | O ramo sem href virou `ehBotaoDeContato`: `data-wa-cta="true"` só conta como contato se o elemento **não** declarar `data-track-event` começando em `share`. Anotação e disparo passaram a usar uma única porta, `ehGatilhoDeContato` — antes eram duas decisões que podiam discordar. Comentário corrigido: descrevia `ShareButtons.tsx`, não `blog/ShareButtons.tsx` |
| `src/components/ShareButtons.tsx` | **Removido.** Órfão: não era importado em lugar nenhum, e era exatamente o arquivo que alguém consertaria por engano |
| `tests/components/whatsappClickTracker.test.tsx` | Dois testes novos, montando o componente real |

**O que não mudou:** o botão flutuante segue com `data-wa-cta="true"`, `cta_location: "floating_button"` e anotação `whatsapp-click` — o CTA de contato de verdade está intacto. Nenhuma conversão do Ads, nenhuma tag do GTM, nenhum texto comercial e nenhum preço foram tocados.

### Prova

O teste F que já existia cobria o link de compartilhamento em `<a>`, e por isso **não pegava** este defeito: o botão do blog é `<button>`. Os dois testes novos foram validados reintroduzindo o bug — três mutações, uma por vez:

| Mutação | Resultado |
| --- | --- |
| `ehBotaoDeContato` volta a aceitar qualquer `data-wa-cta` | falha — `whatsapp_click` sai 1 vez |
| `data-wa-cta="true"` de volta no botão de compartilhar | falha — o botão aparece anotado como `whatsapp-click` |
| destino volta a apontar para o número do canil | falha — `startsWith("https://wa.me/?text=")` |

Nas três, **os 12 testes antigos continuaram verdes** — é a medida de quanto a suíte anterior era cega exatamente aqui. Depois de cada rodada os arquivos foram restaurados por backup e conferidos idênticos.

---

## D — Plano priorizado

> **P1 está executada** (opção **a**, aprovada em 05/11/2026). O registro do que mudou está na seção C. **P2 a P5 seguem pendentes de aprovação** e nada delas foi tocado.

### P1 — Separar compartilhar de contato *(comercial + medição; maior impacto)* — **feita**

O problema é um só e tem duas pontas. **A decisão de produto é sua**, porque muda o que o botão faz:

- **(a) Virar compartilhamento de verdade** — o botão passa a usar `wa.me/?text=` sem número, como os outros da fileira. Coerente com o rótulo "Compartilhar", mas o canil perde uma porta de entrada.
- **(b) Assumir que é CTA de contato** — mantém o destino, muda o rótulo para algo como "Falar com a criadora" e **sai da fileira de compartilhar**. Honesto com o visitante, e o número de contato continua.

Arquivos, qualquer que seja a escolha:

- `src/components/blog/ShareButtons.tsx:94-98` — remover `data-wa-cta="true"` (na opção **a**) ou mover o botão para fora do bloco de compartilhamento e trocar o `aria-label` (opção **b**).
- `src/components/tracking/WhatsAppClickTracker.tsx:159-167` — fechar o ramo `!ehAncora` para que um botão só conte como contato quando declarar isso (por exemplo, ignorar quem tem `data-track-event` começando em `share_`). Hoje qualquer `data-wa-cta="true"` entra.
- `src/components/tracking/WhatsAppClickTracker.tsx:57-65` — corrigir o comentário, que descreve o arquivo errado.
- `src/components/ShareButtons.tsx` — **propor remoção**: não é importado em lugar nenhum e é exatamente o arquivo que alguém "consertaria" por engano.

### P2 — Banner de cookies deixa de cobrir o botão do WhatsApp *(mobile, 92% do tráfego)*

- `src/components/WhatsAppFloat.tsx:214` e `src/components/ConsentBanner.tsx:88` — enquanto o banner estiver aberto, subir o botão acima dele ou deslocá-lo; com o banner fechado, nada muda.
- Correção pequena e de baixo risco, sem efeito em conteúdo ou preço.

### P3 — Reconciliar GTM com o código *(não é mudança de código do site)*

Nada aqui mexe em conversão principal do Ads sem sua autorização expressa.

1. **Exportar o container vivo** e commitar em `docs/analytics/` — hoje o arquivo que decide se um clique vira conversão no Ads **não está versionado com o site**, e a única cópia tem 10 semanas.
2. **GTM Preview + GA4 DebugView**, checagens nomeadas:
   - `/filhotes` e `/filhotes/<slug>`: `view_puppy` dispara? Se não, trocar o gatilho de ELEMENT_VISIBILITY pelo órfão `VIEW – Filhote`, ou por `page_view` com path.
   - Um toque no botão flutuante → **quantos eventos?** O esperado é **1**.
   - Um toque no "compartilhar" do blog → hoje o esperado são **2** (`share` + `whatsapp_click`). Depois de P1, **1**.
   - `Google Ads – Conversão Clique WhatsApp` ainda existe? Com que gatilho?
   - `GA4 – generate_lead`: pôr filtro de formulário.

### P4 — Entrada orgânica na página que converte

`/filhotes` converte a 25% e recebe 24 sessões de entrada. As consultas transacionais e geo já convertem a 9–15% de CTR, mas com volume pequeno: "canil spitz alemao sao paulo" (20 impressões, posição 1,80, **15%**), "canil de spitz alemão em são paulo" (21, 4,81, **9,52%**), "comprar spitz alemão anão" (15, 9,47, **13,33%**). É aí que há margem real — não no volume informacional.

### P5 — Ponte editorial nos 3 artigos de intenção de dono *(alteração editorial — depende de aprovação)*

176 cliques e 0 conversão. **Não transformar em página de venda** — isso perderia o tráfego que eles têm. A proposta é um link contextual para `/filhotes` no ponto em que a dúvida do artigo vira decisão. Texto exato a submeter antes de aplicar.

---

## E — O que NÃO fazer

- **Não reescrever o título de `/blog/preco-spitz-alemao-anao` esperando recuperar CTR.** Os títulos estão bem formados (A1) e a assinatura de B9 é de absorção na SERP. Mudar o título não traz esse clique de volta, e prometer que traz seria inventar.
- Não criar schema de estrelas de autoavaliação da empresa.
- Não reconstruir o componente de avaliações que já existe.
- Não liberar indiscriminadamente todos os bots.
- Não afirmar que `llms.txt`, JSON-LD ou qualquer arquivo garante recomendação por IA.
- Não instalar CRM, pixel, ferramenta de terceiros ou integração paga.
- Não alterar conversões principais ou configurações do Google Ads sem autorização.
- Não transformar os 3 artigos de intenção de dono em páginas de venda.
- Não somar as duas visões do Search Console.
- Não tratar clique de WhatsApp como venda.

---

## F — Indicadores para 30 dias

| Indicador | Hoje | O que esperar |
|---|---|---|
| `whatsapp_click` por `cta_location`, com `blog` separado de `floating_button` | 51 no total, `blog` contaminado por compartilhamento | Separação limpa; o número de `blog` **deve cair** |
| Conversões de WhatsApp no Ads | contaminadas por B1/B2/B7 | **Queda esperada — isso é correção, não perda** |
| `view_puppy` | 26 (era 73) | Se era artefato, volta à ordem de 70; se ficar em 26, o interesse caiu de verdade |
| Sessões de entrada orgânica em `/filhotes` | 24 | Subir, sem derrubar a taxa de 25% |
| Taxa de key event de `/filhotes` | 25% | Manter |
| CTR de `/blog/preco` | 0,37% | Acompanhar para **confirmar ou refutar** absorção na SERP — não é meta |
| Ligações do Perfil da Empresa | 15 | Contar como canal separado, nunca somado ao funil do site |
| Leads | 1 novo, 0 qualificado | Base de comparação |

---

## G — Estado técnico

- **Branch:** `codex/auditoria-delta-2026-11-03`
- **SHA no diagnóstico:** `889f639` — a seção B foi escrita sem nenhum commit
- **PR #19:** **mergeado** em 05/11/2026 15:05 UTC, por merge commit `135f62d` (não squash, de propósito: squash reescreveria as datas por arquivo e reabriria a regressão de `lastmod` corrigida em `305e064`). Confirmado depois: 15 datas distintas em `_generated-lastmod.ts`, todas rastreáveis a commits reais
- **Posição:** `origin/main` está 1 commit à frente desta branch — o próprio merge commit. Todo o conteúdo da branch está em `main`
- **Alterações de P1:** na working tree, **não commitadas e não publicadas** — 4 arquivos (3 de código, 1 de teste), +124 / −121 linhas
- **Working tree:** `M next-env.d.ts` — sujo por causa do dev server (`./.next/types/` virou `./.next/dev/types/`). O `typecheck` passa com as duas variantes; é ruído, **e não deve ser commitado**
- **Portões rodados, todos verdes:**
  - `npm run check:all` — typecheck, vitest, encoding, banned-words, catalog:audit, showcase:audit, truth:guard, lint. **603 testes passando**, 3 ignorados, 88 arquivos
  - `npm run build` — compilou em 17,8s, **149 páginas estáticas** geradas
  - o smoke como a CI roda, `PLAYWRIGHT_WEB_SERVER="npm run start" npx playwright test tests/e2e/smoke.spec.ts --project=chromium` — **22 passando, 0 falhando**
- **Ressalva sobre o e2e:** `npm run test:e2e` sem variável cai em `npm run dev` (`playwright.config.ts:34`) e roda os três navegadores e todos os specs — escopo que a CI não checa. Nesse modo dão 26 falhas: `smoke.spec.ts:300` e `:400` retornam 404 em `/filhotes/cor/<cor>` **mesmo com todas as cinco cores presentes em `COLOR_SEO`**, e `tracking.spec.ts` reprova em bloco. Os dois 404 do smoke não se reproduzem na saída de produção (o mesmo spec passa contra `npm run start`); os de `tracking.spec.ts` **não foram reconferidos** e a CI também não os roda. Nenhuma das 26 falhas está em arquivo que esta mudança toca, e `whatsapp-tracking.spec.ts` passou
- **Não declaro o projeto validado:** P2 a P5 não foram executadas nem testadas, e o container GTM vivo segue não inspecionado

### Riscos e limites desta auditoria

1. **O container GTM vivo não foi inspecionado.** Tudo em B4–B7 vem do backup v14 de 27/08/2026, que **demonstravelmente não bate** com o que o GA4 registrou. As conclusões sobre tags e gatilhos são hipóteses fortes a confirmar no Preview/DebugView, não fatos sobre o container de hoje.
2. **3 dos 13 nomes de evento do GA4 não constam do export** (só os 10 maiores aparecem). Não afirmo que evento algum "nunca disparou" — os três ausentes dispararam 5 vezes ou menos cada.
3. A medição de dobras no mobile foi refeita: a primeira passagem excluiu o botão flutuante por engano, porque `offsetParent` é `null` em qualquer elemento `position: fixed`. **O botão flutuante existe e é alcançável** — o problema real é B3, a sobreposição do banner.
4. O site no ar reflete `main`, não esta branch.

### Confirmação expressa

**Nada foi publicado desta vez.** Nenhum `push` e nenhum deploy com as mudanças de P1 — elas estão só na working tree. Nenhum `reset`, `rebase` ou `checkout` destrutivo. Nenhum trabalho de outro agente foi sobrescrito.

O único merge feito foi o do PR #19, **autorizado por você** ("Sim, mergeia") depois de o CI fechar verde, e registrado acima. As mudanças de P1 são posteriores a ele e seguem aguardando sua autorização para publicar.
