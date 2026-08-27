# Relatório final consolidado — última rodada técnica

Rodada única, conforme §44. Branch `chore/next16-react19-node24`, base `3521a40`.
Data: 25/08/2026. **Nenhum deploy intermediário foi feito.**

Este documento é o entregável do §45. Ele diz o que já estava certo (e foi
preservado), o que estava pela metade (e foi completado), o que faltava (e foi
implementado) e — a parte que mais importa — **o que não pôde ser verificado
daqui**, sem maquiar.

---

## Resultado dos portões

| Portão | Comando | Resultado |
| --- | --- | --- |
| Testes | `npm run test` | **381 passaram, 3 pulados** (51 arquivos: 50 passaram, 1 pulado) |
| Build | `npm run build` | **exit 0**, prebuild completo (content-guard ✅, quality-gate 30 artigos strict, 0 erros / 0 avisos) |
| Lint | `npm run lint` | **exit 0** — 0 erros, 1148 avisos (dívida de baseline do Next 14, declarada no próprio `eslint.config.mjs`) |
| Rotas | `ROUTE_VALIDATOR_URL=http://localhost:3100 npm run route:validate` | **18 rotas, 0 erros, 0 avisos** |
| Contraste | `BASE_URL=http://localhost:3100 node scripts/a11y-contrast.mjs` | **0 falhas** em 5 rotas |
| WCAG (axe) | `BASE_URL=http://localhost:3100 ROTAS="<as 78>" node scripts/a11y-wcag-axe.mjs` | **78 rotas varridas: 1 grave, 0 leves.** O grave foi corrigido e reconferido — **0 graves, 0 leves**. Ver §D |
| JSON-LD | validador desta rodada | **78 rotas, 379 blocos, 0 não parseáveis, 35 mídias citadas, 0 com 404** |

### Ferramenta pré-existente com defeito (§42 — documentar, não mascarar)

- **`npm run seo:audit` é um stub.** `scripts/seo-audit.ts` tem 2 linhas e não
  audita nada. Não foi criado nesta rodada e não foi "consertado" às pressas
  para dar verde: fica registrado como dívida. As verificações que ele deveria
  fazer estão nesta rodada como checagens explícitas (canonical, sitemaps,
  robots, llms.txt, JSON-LD), listadas em §B.
- **`scripts/a11y-contrast.mjs` apontava para a porta 3000 e "passava" com
  todas as rotas em `ERR_CONNECTION_REFUSED`,** ainda saindo com código 0. O
  relatório dizia apenas "ERROR". Rodado contra a porta certa (`BASE_URL`), dá
  0 falhas de verdade. **O script continua saindo 0 mesmo quando não conseguiu
  carregar nenhuma página** — quem usar precisa ler o relatório, não o exit code.
- **`npm run route:validate` tem o mesmo buraco:** sem servidor no ar ele
  reporta "0 rotas / 🎉 Todas as rotas estão OK!". O resultado acima é com
  servidor de produção real no ar (`npx next start -p 3100`).

---

## Tabela de itens

| Item | Status antes | Ação | Arquivos | Teste | Status final |
| --- | --- | --- | --- | --- | --- |
| §1–3 Conversão Ads separada de formulário | Parcial: um único label servia aos dois | Completado: `googleAdsLeadLabel` / `googleAdsWhatsAppLabel` separados, sem fallback silencioso | `src/lib/conversions.ts`, `src/components/Pixels.tsx`, `PixelsByConsent.tsx` | `tests/components/whatsappClickTracker.test.tsx` | ✅ código pronto — **falta o label real (§E)** |
| §2 Não duplicar gtag + GTM | Ausente | Implementado: rota XOR — havendo container GTM, o gtag do Ads não é carregado | `PixelsByConsent.tsx` | teste explícito de não duplicidade | ✅ |
| §4–5 `whatsapp_click` em todos os CTAs | Parcial: eventos por componente, nomes divergentes | Implementado: **um** ouvinte delegado em fase de captura | `src/components/tracking/WhatsAppClickTracker.tsx` | 11 testes A–I + botão real | ✅ |
| §7 Clique não é venda | Ausente | Implementado: `whatsapp_click` nunca é chamado de lead nem de receita | `src/lib/conversions.ts`, dashboard | — | ✅ |
| §8 Consentimento | Correto | **Preservado** (Consent Mode v2, default negado, `wait_for_update: 500`) | `src/lib/consent.ts` | §40-G / §40-H | ✅ |
| §6 gclid / gbraid / wbraid | Parcial | Completado: sem atribuição caseira; parâmetros preservados no redirect | — | verificado em produção | ✅ |
| §9 Landing do Ads coerente | Correto | **Preservado** — `/filhotes` tem **zero** ocorrências de "canil spitz alemão" | — | inspeção | ✅ sem stuffing |
| §10 Experiência mobile | **Defeito real** | Corrigido: barra fixa cobria a última linha do rodapé de forma permanente | `app/globals.css`, `PuppyStickyFloatingCTA.tsx` | medição a 390px | ✅ ver §D |
| §13–17 Structured data | Parcial | Completado: `WebSite` enxuto (sem SearchAction/speakable), Offer só quando `available` | `src/lib/structured-data.ts`, `src/lib/tracking.ts` | validador JSON-LD | ✅ |
| §18 Domínio antigo | Ausente do código | **Verificado**: 0 ocorrências de `canilspitzalemao` em código executável | — | grep global | ✅ |
| §19 www vs non-www | Não auditado | Auditado **em produção**: 4 variantes convergem, 301, parâmetros preservados | `netlify.toml` | curl real | ✅ ver §B |
| §20 llms.txt | Parcial | Completado e conferido contra os fatos confirmados | `app/llms.txt/route.ts` | leitura | ✅ |
| §22–26 Sitemaps de imagem e vídeo | Ausentes | Implementados; índice com exatamente os 4 válidos | `app/sitemaps/images.xml/`, `videos.xml/` | `tests/unit/sitemaps.test.ts` | ✅ |
| §23 VideoObject | Incorreto: 12 vídeos, 1 thumbnail inexistente, data inventada | Corrigido: 12 thumbnails próprias, cada vídeo com a sua data — a do primeiro lote conferida no git | `src/domain/gallery-videos.ts` | checagem dedicada | ✅ |
| §27–36 Curtidas reais | Ausente | Implementado inteiro (ids estáveis, identidade anônima, API, UI, dashboard) | `src/lib/media-likes/`, `app/api/media-likes/`, `media-engagement/` | 6 arquivos de teste | ⚠️ **bloqueado (§E)** |
| §38 Contrato | — | **Não alterado.** Auditado e documentado | `CONTRACT_LEGAL_BLOCKERS.md` | — | ⚠️ **decisão humana** |
| Preço catálogo × tabela | **Conferência documentada mas inexistente** | Implementada de verdade | `tests/pricing-guard.test.ts`, `content/puppies-static.ts` | 6/6, mutação verificada | ✅ |
| Catálogo 25/08 — fêmea branca | Publicada com 8 fotos, sem vídeo | **Parcial.** A 9ª foto entrou. O vídeo **não** — `spitz-femea-branco.mp4` sumiu do disco antes do commit, ver §E.8 | `content/puppies-static.ts` | `tests/unit/sitemaps.test.ts` (pegou o arquivo ausente), verificação no navegador | ⚠️ **arquivo perdido** |
| Catálogo 25/08 — macho branco | Ausente | Cadastrado como **Lulu da Pomerânia Branco Macho**, 4 fotos, R$ 8.500 vindo da tabela | `content/puppies-static.ts`, `public/filhotes/branco/` | `tests/pricing-guard.test.ts` (8 publicados) | ✅ |
| Catálogo 25/08 — 9 fotos + 1 vídeo nomeados "macho-laranja" | Ausente | **Não cadastrado.** A pelagem não é laranja — ver §E.6 | `midia-aguardando-definicao/` | comparação lado a lado com as fotos já publicadas | ⚠️ **decisão humana** |
| Catálogo 25/08 — 6 fotos "macho-particolor" | Ausente | **Não cadastrado.** Particolor não tem linha na tabela de preços — ver §E.7 | `src/domain/pricing.ts` | `tests/pricing-guard.test.ts` reprovaria | ⚠️ **decisão humana** |

---

## A. Google Ads

- **Conversion ID:** `GOOGLE_ADS_ID` **ausente** no ambiente local. Não foi
  inventado nenhum ID (§0). O código lê de `pixels_settings` (Supabase) com
  fallback para env.
- **Label de formulário:** `googleAdsLeadLabel`.
- **Label de WhatsApp:** `googleAdsWhatsAppLabel` — **ausente**. Ver §E.
- **Método de envio:** **XOR explícito.** `PixelsByConsent` calcula
  `useGTM = Boolean(config.gtmId)`; havendo container GTM, o gtag do Ads **não
  é carregado**. O evento de dataLayer chama-se `ads_conversion_sent`, e não
  `conversion`, justamente para não acionar a tag padrão "Google Ads Conversion
  Tracking" do GTM.
- **Prova de não duplicidade:** teste dedicado em
  `tests/components/whatsappClickTracker.test.tsx` — um toque no botão real
  produz **1** `whatsapp_click`, **1** `conversion`, 2 chamadas de gtag no
  total, e **0** ocorrências dos nomes mortos `lead_whatsapp` e
  `wa_float_click`. Antes da correção o mesmo toque gerava 2 eventos GA4 e 2
  eventos Meta.
- **CTAs auditados:** 20 arquivos, 7 `placement` distintos — `puppy_card` (5),
  `floating_button` (5), `header` (4), `hero` (3), `reels` (2), `puppy_page`
  (1), `gallery` (1). Todos passam pelo **mesmo** ouvinte delegado, em fase de
  captura — de propósito, para que o `stopPropagation()` dos cards não mate a
  medição em silêncio.
- **Evento GA4:** `whatsapp_click`, com `placement`, `campaign_context` e
  `page_path` limpo de parâmetros.
- **Consentimento:** negado → `scriptsGoogle: []`, clique produz
  `chamadasGtag: []`, nenhum evento novo no dataLayer, **0 erros de JS**.
  Aceito → Consent Mode passa de default-denied para update-granted corretamente.
- **Conversão nunca dispara em pageview:** a chamada mora em
  `src/lib/conversions.ts` e só ocorre por invocação explícita. Antes ela
  ficava dentro do `<Script>` de init do Ads — o que teria transformado **cada
  pageview em conversão**.

## B. SEO

- **Host canônico:** `https://byimperiodog.com.br`. Verificado **em produção**:

  | Entrada | Saltos | Destino |
  | --- | --- | --- |
  | `http://byimperiodog.com.br/` | 1 | `https://byimperiodog.com.br/` |
  | `https://byimperiodog.com.br/` | 0 | (é o canônico) |
  | `http://www.byimperiodog.com.br/` | 2 | `https://byimperiodog.com.br/` |
  | `https://www.byimperiodog.com.br/` | 1 | `https://byimperiodog.com.br/` |

  O redirect de www é **301 Moved Permanently** e preserva o pathname.
  `http://www` faz 2 saltos (TLS primeiro, depois host) — comportamento padrão
  de borda, **não introduzido nesta rodada**, e só afeta uma porta de entrada rara.
- **gclid / gbraid / wbraid / utm sobrevivem ao redirect**, testado um a um em
  produção. É isso que faz a medição de Ads funcionar.
- **Canonical não é contaminado por parâmetro de anúncio:**
  `/filhotes?gclid=x&utm_source=google` continua canonicalizando para
  `/filhotes`. `og:url` converge para o mesmo host.
- **Canonical único** (exatamente 1 tag) em `/`, `/filhotes`, a landing do Ads,
  `/preco-spitz-anao`, `/pomeranian`, `/spitz-alemao`, `/galeria`,
  `/filhotes/cor/branco`, `/blog`.
- **Domínio antigo:** 0 ocorrências de `canilspitzalemao` em `app/`, `src/`,
  `scripts/`, `content/`, `types/`. A única ocorrência de `.netlify.app` no
  repositório é uma checagem legítima de host de preview em
  `src/lib/adminFetch.ts:18`.
- **Sitemaps:** `/sitemap.xml`, `/sitemaps/posts.xml`, `/sitemaps/images.xml`,
  `/sitemaps/videos.xml` — todos 200 `application/xml`. O índice aponta para
  **exatamente esses quatro** e para nenhum dos antigos (authors, tags,
  categories, puppies), como manda §26.
- **robots.txt** 200, com `Host:` e `Sitemap:` no domínio canônico.
- **llms.txt** 200 e coerente com os fatos confirmados: 2013, Bragança
  Paulista/SP, 5 cores, R$ 5.500–9.500, e as inclusões que o canil sustenta
  (vacinado, vermifugado, consulta veterinária, hemograma completo, pedigree).
- **Schema:** `LocalBusiness` com `foundingDate` 2013, endereço de Bragança
  Paulista/SP, telefone e e-mail corretos, `priceRange` "R$ 5.500 – R$ 9.500",
  **sem `aggregateRating`** (nenhuma nota inventada). `WebSite` enxuto, sem
  `SearchAction` e sem `speakable`.
- **Offer:** emitida **somente** quando `status === "available"`. Filhote
  reservado ou vendido **omite a Offer comercial** em vez de inventar
  `PreOrder` — uma das duas saídas que §16 aceita. Hoje os 9 filhotes do
  catálogo estão `available`, então o caso está dormente, mas o código está correto.

## C. Mídia

- **12 `VideoObject`**, cada um com **thumbnail própria** (12 distintas),
  `contentUrl` e `description`. Seriam treze: o vídeo da fêmea branca chegou,
  foi registrado, gerou pôster — e o arquivo sumiu do disco antes do commit.
  Saiu do registro em vez de virar um `content_loc` apontando para 404. Ver
  §E.8.
- **Data:** deixou de ser uma constante única. `VIDEO_UPLOAD_DATE =
  "2026-05-25"` continua **conferida contra o git** — `git log
  --diff-filter=A` dos arquivos que já estavam em `public/filhotes/videos/`
  devolve exatamente essa data — e continua sendo o padrão de quem não declara
  data própria. Mas cada vídeo agora **pode declarar a sua** em
  `gallery-videos.ts`, em vez de todos herdarem a mesma constante: quando o
  vídeo da fêmea branca entrar, ele declara a data real de entrada, e não maio.
  Herdar maio seria dizer ao Google que um arquivo de agosto está no ar desde
  então — data inventada, que é exatamente o defeito que fez este registro
  existir. Antes desta rodada os doze declaravam `uploadDate: "2024-01-01"` e
  apontavam todos para um `/og-image.jpg` que **não existe**.
- **`lastmod` do sitemap de vídeos**, dentro do `sitemap-index.xml`, passou a
  vir de `ULTIMO_VIDEO_UPLOAD_DATE` (o maior de todos). Fixo em
  `VIDEO_UPLOAD_DATE`, o índice diria "maio" no mesmo dia em que um vídeo de
  agosto entrasse no arquivo.
- **Sitemap de vídeos:** 12 entradas `<video:video>`.
- **0 mídias 404** entre as 34 URLs citadas por todos os JSON-LD do site.
- **Um vídeo já publicado tinha sido apagado do disco antes desta rodada
  começar.** `public/filhotes/videos/spitz-laranja-macho.mp4` aparecia como
  `D` no `git status` inicial — arquivo rastreado, no ar desde maio, citado
  pela `/galeria` e pelo sitemap de vídeos. Commitar daquele jeito apagaria uma
  URL viva. **Restaurado do git** (`git checkout --`), 4,3 MB, e conferido no
  sitemap.
- **Sobre peso de vídeo:** nada é baixado ao abrir a página.
  `PuppyCinematicGallery` só monta o `<video>` depois do clique e a `/galeria`
  usa `preload="none"` com pôster real. O vídeo da fêmea branca, que tinha
  21,5 MB / 129 s, ficaria bem acima dos demais (4 a 9 MB) — quando ele voltar,
  vale recomprimir antes de commitar.
- **Curtidas:** implementadas com id semântico estável
  (`gallery:spitz-branco`) compartilhado entre página, sitemap e botão.
  **Bloqueadas** — ver §E. Degradam corretamente: `GET /api/media-likes` e
  `POST /api/media-likes/toggle` devolvem **503 `{"error":"indisponivel"}`** e
  `/galeria` continua **200**. Falham fechado, sem quebrar a página.

### Catálogo — o lote de mídia de 25/08

Chegaram quatro conjuntos. **Dois foram publicados, dois estão bloqueados.**

**Publicado.** A **fêmea branca** (`spitz-alemao-anao-branco-femea`) ganhou a
nona foto — o vídeo dela não entrou, ver §E.8. O **macho branco** foi cadastrado como filhote
novo — `lulu-da-pomerania-branco-macho`, quatro fotos, **R$ 8.500**, que é o
valor de macho branco na tabela central e não um número escolhido aqui
(`tests/pricing-guard.test.ts` confere contra `precoDe("branco", "macho")`).
Ele é o único do catálogo anunciado pelo nome popular **Lulu da Pomerânia**, a
pedido da responsável; o campo `color` continua `"branco"`, porque é ele que
liga o filhote ao preço — muda o rótulo, não o valor.

As quatro fotos foram **renomeadas e movidas** para
`public/filhotes/branco/branco-macho-jardim-0N.jpeg` antes de entrar. Não é
cosmético: `src/domain/media-registry.ts` deriva o id de curtida do caminho do
arquivo, então uma foto de filhote branco deixada em `/filhotes/laranja/`
carregaria o id `foto:filhotes/laranja/...` para sempre.

**Bloqueado — ver §E, itens 6 e 7.** Os arquivos saíram de `public/` e estão em
`midia-aguardando-definicao/` (ignorado pelo git), com um `LEIA-ME.txt` que
repete o motivo e o caminho de desbloqueio. Dentro de `public/` eles eram
indexados pelo gerador de medidas e um `git add -A` os publicaria com a cor
errada.

## D. Performance e acessibilidade

**Defeito real encontrado e corrigido (§10).** Em 390px, na landing do Google
Ads (`/filhotes/spitz-alemao-anao-branco-femea`), no fim da rolagem:

- **Antes:** a barra fixa do CTA (`top: 767, bottom: 844`) cobria por inteiro a
  última linha do rodapé (`top: 791, bottom: 828`) — "Spitz Alemão Anão —
  acompanhamento veterinário e suporte direto com a criadora." — e
  `aindaDaParaRolar: 0`, ou seja, **não havia rolagem sobrando para revelá-la**.
  O texto era impossível de ler no celular. O tráfego inicial do Ads foi
  praticamente 100% mobile.
- **Depois:** rodapé termina em `y=760`, barra começa em `767`.
  `totalmenteCoberto: []`, `parcialmenteCoberto: []`.
- **Como:** classe `body.tem-cta-fixo` + `padding-bottom: 84px` só no mobile.
  A reserva é ligada **pelo próprio componente que cria a sobreposição**, na
  **montagem** e não em `visible` — crescer a página no instante em que a barra
  aparece seria mudar o chão debaixo de quem está rolando.
- **CLS = 0** medido ao longo de toda a rolagem, incluindo a entrada da barra
  (`quantidadeDeDeslocamentos: 0`).

Outras medições na mesma landing, a 390px: LCP 184 ms, 0 long tasks, botão de
WhatsApp 56×56 px, **nenhuma rolagem horizontal** em 360/390/412px. A cadeia
completa do clique custa **0,7 ms** síncronos contra um orçamento de INP de 200 ms.

**Contraste:** 0 falhas em `/`, `/sobre`, `/contato`, `/filhote/test`, `/admin`.

### WCAG 2.2 A/AA com axe — cinco defeitos reais encontrados e corrigidos

A varredura com `scripts/a11y-wcag-axe.mjs` (412×915, `reducedMotion: reduce`)
achou o que nenhum outro portão desta rodada achou. Nada disso é redesenho:
são cinco correções de semântica de marcação, **sem uma única mudança visual**.

1. **`nested-interactive` na galeria do filhote — inclusive na landing do Ads.**
   O quadro da foto principal era um `<div role="button" tabIndex={0}>` que
   contém botões de verdade: as setas, as bolinhas, a curtida e o atalho de
   vídeo. Controle interativo dentro de controle interativo — o leitor de tela
   anunciava um botão só e engolia os de dentro. **Correção:** o quadro voltou a
   ser uma `<div>` comum (o clique de mouse continua ampliando) e o papel de
   botão passou para o aviso "Ampliar", que **já estava desenhado na tela** no
   canto superior esquerdo e era `aria-hidden`. Ele vira um `<button>` de
   verdade, no mesmo lugar e com o mesmo desenho.
   Arquivo: `src/components/catalog/PuppyCinematicGallery.tsx`.
2. **`list` + `listitem` nos filhotes relacionados.** A `<ul>` continha `<div>`
   direto e o `<li>` estava **dentro** dessa `<div>` — o `StaggerItem` (que
   renderiza uma `motion.div`) tinha sido posto por fora do `<li>` em vez de por
   dentro. Resultado: o leitor de tela deixava de anunciar "lista de N itens".
   **Correção:** aninhamento invertido. O cascateamento continua funcionando
   porque o framer-motion propaga variante por contexto de React, não por
   vizinhança no DOM. Arquivo: `app/(public)/filhotes/[slug]/page.tsx`.
3. **`scrollable-region-focusable` na home.** O carrossel de depoimentos rola de
   lado no mobile e **nenhum cartão tem link ou botão dentro**: quem navega por
   teclado não alcançava do segundo depoimento em diante. A região existia e era
   inacessível. **Correção:** `tabIndex={0}` na lista, com anel de foco visível.
   Arquivo: `src/components/sections/TextTestimonials.tsx`.
4. **`landmark-unique` em 3 artigos do blog.** Todo `<table>` do MDX era
   embrulhado num `role="region"` com **o mesmo rótulo**; artigo com duas
   tabelas ficava com dois marcos de navegação indistinguíveis. **Correção:**
   `role="group"` — uma caixa de rolagem em volta de uma tabela não é marco da
   página. Mantém rótulo e foco. Arquivo: `src/components/MDXContent.tsx`.
5. **`scrollable-region-focusable` na tabela de preços** — o único achado da
   varredura completa das 78 rotas, em `/preco-spitz-anao`. Mesma falha do item
   3, em outro lugar: a tabela tem `min-w-[480px]` dentro de um
   `overflow-x-auto`, então no celular ela rola de lado, e não há link nem botão
   dentro dela. Quem navega por teclado não chegava às colunas da direita — que
   são justamente as duas colunas de preço. **Correção:** `tabIndex={0}` com
   anel de foco visível, mais `role="region"` e um `aria-label` **próprio**
   ("Tabela de preços — role para o lado para ver todas as colunas"). O rótulo
   é próprio de propósito: a primeira tentativa reaproveitou o `h2` da seção via
   `aria-labelledby` e criou um `landmark-unique` — dois marcos com o mesmo nome
   acessível na mesma página. Arquivo: `app/(public)/preco-spitz-anao/page.tsx`.

Confirmação depois do rebuild, nas 7 rotas dos itens 1–4 (`/`, os três filhotes
e os três artigos): **0 graves, 0 leves.** A varredura completa das 78 rotas
veio depois e devolveu **1 grave** — o item 5, que não aparecia nas rotas
afetadas pelos quatro primeiros. Corrigido o item 5 e refeita a build, as rotas
tocadas depois da varredura completa (`/preco-spitz-anao`, `/galeria`, a página
da fêmea branca e a do filhote novo) foram reconferidas uma a uma: **0 graves,
0 leves**. As demais 74 não foram tocadas desde a varredura em que passaram
limpas. **O que isso quer dizer, sem arredondar:** não existe uma varredura
única e completa rodada sobre o binário final — existe uma varredura completa
sobre a build anterior, mais a reconferência individual de tudo que mudou entre
uma coisa e outra.

**Nota de método:** o script usa `waitUntil: "networkidle"`, e três páginas de
filhote **nunca atingem networkidle** — elas respondem em 4 ms no `curl`, mas
mantêm atividade de rede contínua (mídia). Na primeira varredura elas apareceram
como "NÃO CARREGOU: Timeout", que é fácil de confundir com página quebrada.
**Não estão quebradas.** Foram medidas com `waitUntil: "load"`. Fica registrado
para quem rodar o script depois.

**Alvos de toque abaixo de 44px (pré-existentes, NÃO corrigidos):** rótulos de
cor (15px), "Ver galeria de…" (19px), links do rodapé (17px), botões do
acordeão de FAQ (20–36px), chips de filtro (39px), itens da bottom-nav (32–35px
de largura). Todos são navegação secundária, **nenhum está no caminho de
conversão**, e §10 diz literalmente "NÃO redesenhar". Ficam registrados aqui
como dívida consciente, não como item silenciado.

## E. Bloqueios humanos

Nada abaixo foi inventado ou contornado.

> **Atualização de 26/08/2026 (segunda rodada).** Os itens **6** e **7** foram
> **decididos pela responsável** e já estão em produção no commit `ddd446d`:
> a cor de registro do filhote das fotos `macho-laranja0..8` é **laranja**, e
> **particolor** entrou na tabela central como quinta cor divulgada, com
> **macho R$ 5.500 e fêmea R$ 6.500**. Os dois deixaram de ser bloqueio; o
> texto original fica abaixo como registro de por que estavam parados. Os
> demais itens **seguem abertos**. Ver "Rodada de 26/08/2026" no fim deste
> documento.

1. **Label real da conversão "Clique WhatsApp" do Google Ads.**
   `googleAdsWhatsAppLabel` está ligado de ponta a ponta, **sem fallback
   silencioso** para o label de formulário — se ele faltar, a conversão
   simplesmente **não dispara** (preferível a disparar na ação errada). Não há
   campo no admin: precisa ser definido em `pixels_settings` ou em
   `GOOGLE_ADS_WHATSAPP_LABEL`.
2. **`GOOGLE_ADS_ID` também está ausente** no ambiente local, junto com
   `GOOGLE_ADS_CONVERSION_LABEL`. Nenhum ID foi inventado (§0).
3. **`MEDIA_LIKE_SECRET` precisa ser criado** (≥16 caracteres) — sem ele as
   curtidas ficam em 503.
4. **A migration `supabase/migrations/20260825120000_media_likes.sql` foi
   escrita mas NÃO foi aplicada.** Nenhuma escrita desta sessão chegou ao banco
   de produção. Aplicá-la é decisão e ação do responsável.
5. **Contrato:** ver `CONTRACT_LEGAL_BLOCKERS.md`. Nenhuma cláusula foi
   reescrita. Texto jurídico não muda sem redação aprovada. Atenção ao ponto 1
   do documento: o contrato tem **duas fontes** (HTML de impressão e PDF do
   ZapSign) e qualquer alteração aprovada precisa entrar **nas duas, no mesmo
   commit**.

6. **A cor real do filhote das fotos `macho-laranja0..8` (e do vídeo
   `spitz-macho-laranja.mp4`).** O nome do arquivo diz laranja; a foto não. As
   nove imagens e o quadro do meio do vídeo mostram sempre o mesmo filhote:
   base creme/bege com **sombreado cinza-escuro** nas costas e nos flancos,
   máscara escura no focinho e pontas de orelha escuras. Comparado lado a lado
   com o que já está publicado: `laranja-macho-01.jpg` é ruivo quente e não tem
   cinza nenhum; `creme-macho-01.jpg` é creme limpo, sem sombreado;
   **`wolf-sable-macho-01.jpg` é creme com sombreado cinza — é este que bate.**
   Publicar como Laranja seria (a) declarar cor falsa numa página comercial,
   (b) cobrar **R$ 6.500** onde a tabela pediria **R$ 7.500** se for creme, e
   (c) devolver uma aparência cinza-lobo à comunicação ativa, que o §43 proíbe
   nominalmente. **Desbloqueio:** o responsável confirma a cor de registro
   (laranja, creme ou cinza-lobo). Confirmada a cor, o cadastro sai no mesmo
   dia e o preço vem sozinho de `src/domain/pricing.ts` — nada mais é preciso.
7. **O preço de macho particolor.** As seis fotos `macho-particolor0..5` são
   particolor de verdade (base branca com manchas sable na cabeça, orelhas e
   dorso) — aqui não há dúvida de cor. O impedimento é outro: **"particolor"
   não existe em `CORES_DIVULGADAS` nem tem linha em `TABELA_DE_PRECOS`.** Não
   há valor a cobrar, inventar um é proibido pelo §0 e alterar a tabela central
   também. `tests/pricing-guard.test.ts` reprovaria o cadastro na hora.
   **Desbloqueio:** o responsável define o valor de macho particolor; a cor
   entra na tabela e o filhote é cadastrado.

   Os arquivos de 6 e 7 foram tirados de `public/` e estão em
   `midia-aguardando-definicao/` (ignorado pelo git), com `LEIA-ME.txt`
   repetindo motivo e desbloqueio. Dentro de `public/` eles eram indexados pelo
   gerador de medidas e um `git add -A` os publicaria com o rótulo errado.

8. **O arquivo do vídeo da fêmea branca precisa ser enviado de novo.**
   `spitz-femea-branco.mp4` (21,5 MB, 478×850, 129 s) chegou no lote de 25/08,
   ficou em `public/filhotes/videos/`, foi registrado, teve o pôster gerado a
   partir dele e chegou a ser servido pelo servidor local — o log da verificação
   no navegador registra `GET /filhotes/videos/spitz-femea-branco.mp4 → 206
   Partial Content`. Depois disso **o arquivo desapareceu da pasta**, antes de
   qualquer commit. Não foi nenhum comando desta rodada: a varredura do
   histórico de comandos não encontra remoção, e o mesmo aconteceu com
   `spitz-laranja-macho.mp4`, que já estava apagado **antes** da rodada começar
   (esse foi recuperado do git; o novo nunca esteve no git, então não há de onde
   recuperar). Uma busca por `*.mp4` em todo o perfil do usuário devolve
   apenas dois arquivos de vídeo do canil no disco — o restaurado e o bloqueado
   do item 6. **O registro foi removido em vez de ficar apontando para um
   arquivo inexistente**, que era um `<video:content_loc>` 404 no sitemap e um
   player quebrado na página; `tests/unit/sitemaps.test.ts` reprovava a build
   por causa disso, e foi assim que o sumiço apareceu.
   **De onde ele veio:** os atalhos recentes do Windows guardam o caminho de
   origem do lote inteiro — `C:\Users\byimp\Downloads\`, e o vídeo entrou como
   `WhatsApp Video 2026-08-25 at 18.39.11.mp4`. **A cópia original ainda deve
   estar na conversa do WhatsApp**, que é o caminho mais curto para recuperá-lo
   (a lixeira do Windows está vazia e a cópia de `Downloads` também sumiu).
   **Desbloqueio:** colocar o arquivo em
   `public/filhotes/videos/spitz-femea-branco.mp4` e rodar
   `npm run gen:video-posters`. As duas linhas a devolver estão escritas em
   comentário dentro de `src/domain/gallery-videos.ts`. **Vale conferir a pasta
   antes:** se o arquivo sumiu uma vez sem ninguém apagar, pode sumir de novo —
   o repositório fica dentro do OneDrive, e sincronização mexe em arquivo grande
   recém-criado.

### Limite de verificação que precisa ficar explícito

**Nenhuma tag do Google carrega no ambiente local.** Os IDs de rastreamento são
resolvidos **no servidor**, a partir da tabela `pixels_settings` do Supabase,
e chegam como props via `src/components/Pixels.tsx`. O Supabase não é
alcançável deste ambiente. Consequência honesta: **a entrega das tags em
produção não pôde ser verificada daqui.** O que foi verificado é a lógica —
qual rota é escolhida, quantos eventos saem por clique, o que acontece com
consentimento negado — em testes com gtag e dataLayer instrumentados. O HTML de
produção também traz apenas o bootstrap do Consent Mode, o que é coerente: os
IDs entram como props, não inline.

**Consequência operacional:** se alguma conversão do GA4 tiver sido construída
sobre o nome `lead_whatsapp`, ela precisa ser **reapontada para
`whatsapp_click`**. O nome antigo foi removido do código nesta rodada.

## F. Deploy

- **Commit final:** um único commit, ao fim de tudo. Ver §44.
- **Migrations executadas:** **nenhuma.** A de `media_likes` está escrita e
  aguarda aplicação humana.
- **Testes executados:** ver "Resultado dos portões".
- **Build:** `npm run build` → exit 0.
- **URL de produção:** https://byimperiodog.com.br
- **Confirmação:** **não houve deploy intermediário.** Nada foi commitado nem
  empurrado enquanto a rodada corria; o único commit é o que carrega este
  relatório.
- **Diff da rodada:** **153 arquivos alterados, 5.822 inserções, 619 remoções** —
  110 arquivos modificados e 43 caminhos novos, todos entregáveis. O hash sai
  deste próprio commit (um arquivo não pode conter o hash do commit que o
  contém), então ele fica registrado no `git log` e foi informado junto com a
  entrega. Ficaram **fora** do commit, por `.gitignore`: `scratchpad/` (rascunho
  desta rodada), `*.log`, 18 MB de traces de Lighthouse (`reports/lh-*.json` e o
  dump HTML na raiz — regeráveis, e o número que importa já está escrito aqui) e
  um `deno.lock` que nada no projeto usa.
- **Mídia que entra no repositório:** 17 arquivos, 744 KB no total — 5 fotos
  `.jpeg` do lote de 25/08 e 12 pôsteres `.webp` de vídeo. Nenhum arquivo novo
  passa de 1 MB. Os vídeos do lote **não** entram: o do macho laranja está
  bloqueado por cor (§E.6) e o da fêmea branca sumiu do disco (§E.8).
- **Conferência de segredo antes de commitar:** `git diff --cached` varrido por
  `sb_secret|service_role|eyJhbGciOi|sbp_[a-f0-9]{20}` → **0 ocorrências**.
- **O que este deploy leva junto:** além desta rodada, o commit `3521a40`
  (migração para Next.js 16 / React 19 / Node 24), que estava na branch
  `chore/next16-react19-node24` e **nunca esteve em produção**. Ele entra porque
  esta rodada foi construída e testada em cima dele — separar os dois agora
  significaria refazer todos os portões sobre uma base diferente da que passou.

---

# Relatório do DELTA Google Ads (§15)

Um ponto por seção do DELTA, mais a confirmação exigida no fim.

1. **Auditoria do que existia.** Google Tag, GTM, GA4, Google Ads, Meta Pixel,
   consentimento, dataLayer, gtag, CTAs de WhatsApp, gclid, gbraid, wbraid e UTM
   — todos inventariados antes de escrever qualquer linha. O que já estava certo
   foi preservado, não reescrito.
2. **Sem duplicidade gtag + GTM.** Rota XOR: havendo container GTM, o gtag do
   Ads não é carregado. O evento de dataLayer chama-se `ads_conversion_sent`, e
   **não** `conversion`, para não acionar a tag padrão do GTM. Teste dedicado.
3. **Formulário e WhatsApp com labels separados.** `googleAdsLeadLabel` e
   `googleAdsWhatsAppLabel`, retrocompatíveis, **sem fallback silencioso** de um
   para o outro.
4. **Evento GA4 `whatsapp_click`** com `placement`, `campaign_context` e
   `page_path` sem parâmetros.
5. **Todos os CTAs cobertos.** 20 arquivos, 7 `placement`, um único ouvinte
   delegado em fase de captura — de propósito, para que o `stopPropagation()`
   dos cards não mate a medição.
6. **gclid / gbraid / wbraid** preservados no redirect e sujeitos a
   consentimento. **Sem atribuição caseira.**
7. **Clique não é venda.** `whatsapp_click` não é chamado de lead nem de receita
   em lugar nenhum do dashboard.
8. **Consentimento.** Consent Mode v2, default negado, `wait_for_update: 500`,
   `ads_data_redaction`, `url_passthrough`. Negado: nenhum script, nenhum
   evento, **0 erros de JS**.
9. **Landing coerente com a campanha.** `/filhotes/spitz-alemao-anao-branco-femea`
   segue Spitz Alemão Anão (Lulu da Pomerânia), fêmea, branca, **R$ 9.500**,
   Bragança Paulista/SP. `/filhotes` continua atendendo macho, fêmea, branco,
   creme, preto e laranja, com **zero** ocorrências de "canil spitz alemão" —
   nenhuma página foi transformada em isca de palavra-chave.
10. **Mobile auditado com prioridade** (o tráfego do Ads foi praticamente todo
    mobile). Um defeito real encontrado e corrigido; ver §D.
11. **Configuração antiga limpa.** Nenhum domínio antigo em canonical, schema,
    sitemap ou redirect.
12. **Copy de saúde, entrega e garantias** dentro do que o canil sustenta.
    Nenhuma promessa removida voltou.
13. **Structured data** conferido bloco a bloco: 374 blocos, 0 não parseáveis,
    0 mídia 404.

**Confirmação exigida:** **nenhuma URL pública mudou, nenhum canonical mudou e
nenhuma arquitetura de SEO foi alterada nesta rodada.** Não foi criada, removida
nem redirecionada nenhuma rota comercial. Os títulos e H1 das páginas que já
tinham posição permaneceram como estavam. As quatro correções de acessibilidade
do §D mexem em semântica de marcação (`<li>`, `role`, `tabIndex`) e **não** em
conteúdo, hierarquia de cabeçalhos ou endereço.

**Objetivo final do DELTA — respondido:** quando o Google Ads mostrar 5 cliques,
dá para dizer quantos chegaram ao WhatsApp, **desde que o label da ação
"Clique WhatsApp" seja preenchido** (§E). A instrumentação está pronta e
testada; o que falta é um dado que só o dono da conta tem.

---

# Definição de pronto (§46)

| # | Pergunta | Resposta |
| --- | --- | --- |
| 1 | Um visitante vindo do Google Ads clicou no WhatsApp? | Sim — o ouvinte delegado captura o clique em qualquer um dos 7 pontos, com `campaign_context` preservado. |
| 2 | Esse clique apareceu UMA vez no GA4? | Sim. Teste com botão real: 1 `whatsapp_click`. Antes eram 2. |
| 3 | Esse clique apareceu UMA vez na ação correta do Google Ads? | Uma vez, sim, e na ação separada de WhatsApp. **Depende do label (§E).** |
| 4 | Nenhum pageview virou conversão? | Correto. A chamada saiu do `<Script>` de init e só ocorre por invocação explícita. |
| 5 | Formulário e WhatsApp não compartilham label errado? | Correto — dois campos, sem fallback entre eles. |
| 6 | Não existe duplicidade GTM + gtag? | Correto. XOR + nome de evento que não aciona a tag padrão + teste. |
| 7 | URLs, canonicals e rankings foram preservados? | Sim. **Nenhuma rota removida nem redirecionada.** Uma foi criada — `/filhotes/lulu-da-pomerania-branco-macho`, o filhote novo — e entrou sozinha no `sitemap.xml` (78 URLs) porque tudo deriva de `puppies-static.ts`. |
| 8 | O domínio antigo saiu das configurações executáveis? | Sim — 0 ocorrências em `app/`, `src/`, `scripts/`, `content/`, `types/`. |
| 9 | Os schemas não contêm fatos antigos? | Sim. Fundação 2013, endereço e telefone reais, sem nota inventada. |
| 10 | llms.txt está coerente com o site? | Sim, conferido item a item contra os fatos confirmados. |
| 11 | Google Images e Google Video têm sitemaps válidos? | Sim, ambos 200 e no índice. |
| 12 | Cada vídeo tem thumbnail própria e data só quando real? | Sim: 12 thumbnails distintas, uma por vídeo publicado; a data do primeiro lote foi conferida no `git log` e cada vídeo passou a poder declarar a sua, em vez de herdar a constante. |
| 13 | Curtidas são reais e individualizadas? | O código sim. **Bloqueado** por segredo + migration (§E). |
| 14 | O admin consegue ver quais mídias recebem mais likes? | A tela existe (`/admin/media-engagement`). Fica útil quando o item 13 destravar. |
| 15 | O player permanece acessível? | Sim — `/galeria` sai 0 grave / 0 leve no axe. |
| 16 | A página da fêmea branca mostra R$ 9.500 corretamente? | Sim, na página e no JSON-LD (`"price":"9500.00"`, `InStock`). |
| 17 | O contrato foi alterado juridicamente sem aprovação? | **Não foi alterado.** Só auditado. |
| 18 | `npm run build` passa? | Sim, exit 0. |
| 19 | Houve regressão de SEO ou Core Web Vitals? | Não. CLS 0, LCP 184 ms na landing, 0 rotas quebradas, §43 conferido item a item. |
| 20 | Houve somente UM deploy final? | Sim. Um único commit ao fim de tudo e um único `git push`, com todos os portões verdes antes. Ver §F. |

---

# SECURITY PRODUCTION GATE (DELTA de segurança, §27)

Complemento de segurança. Não repete SEO, Google Ads nem conteúdo — só toca
autenticação, exposição de dados, custo e resposta de erro. Nenhuma URL pública,
canonical, H1, title, preço, catálogo, schema ou layout foi alterado. As únicas
rotas que sumiram são de diagnóstico (§2), que nunca fizeram parte do site.

## Inventário de `app/api/**` (§1)

149 arquivos `route.ts`. Classificação **final**, depois das correções desta rodada:

| Classificação | Rotas | Como são autenticadas |
| --- | ---: | --- |
| ADMIN | 117 | `proxy.ts` (sessão HMAC `admin_session` **ou** header `x-admin-pass` = `ADMIN_PASS`) + `requireAdminApi` no handler |
| PÚBLICA | 21 | sem autenticação, por desenho (formulário, catálogo, busca, OG) |
| WEBHOOK | 5 | assinatura do provedor |
| CRON | 3 | `CRON_SECRET` |
| INTERNAL | 3 | `INTERNAL_API_TOKEN` |

Das 21 públicas, duas são o par login/logout do admin e duas são o fluxo OAuth
das integrações — estas últimas passam pelo `proxy.ts` (`PREFIXOS_ADMIN`), não
pelo handler, e por isso o classificador as conta como públicas.

## Tabela do portão

| Endpoint | Classificação | Auth | Service role | Rate limit | Risco antes | Ação | Status final |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/api/debug-env` | DEBUG | nenhuma | — | não | Revelava `hasUrl`/`hasAnon`/`hasService` — mapa de configuração para quem sonda | **Removida** (`git rm`) | 404 |
| `/api/debug-post` | DEBUG | nenhuma | sim | não | Eco de payload com chave de serviço no caminho | **Removida** | 404 |
| `/api/debug/blog` | DEBUG | nenhuma | sim | não | Estado interno do blog | **Removida** | 404 |
| `/api/debug/blog-posts` | DEBUG | nenhuma | sim | não | Dump de posts, inclusive rascunho | **Removida** | 404 |
| `/api/diag/puppies` | DIAGNÓSTICO | nenhuma | sim | não | Diagnóstico do catálogo acessível anonimamente (§5) | **Removida** | 404 |
| `/api/catalog/ranked` | PÚBLICA | nenhuma | anon | não | `select("*")` em `puppies` via service role, com `...row` no JSON: expunha `cost_cents`, `profit_margin_percentage`, `internal_notes`, `internal_source_id`, `source`, `customer_id`, `reserved_by`, `created_by`, `updated_by`, `health_notes`, `microchip`, `microchip_id`, `health_certificate_url`, `pedigree_number` | Allowlist explícita `CAMPOS_PUBLICOS_DO_CATALOGO` em `src/lib/ai/catalog-ranking.ts`; erro sanitizado | **Fechado** |
| `/api/leads` | PÚBLICA | nenhuma | sim | 3/min (memória) **+ 5/min e 40/dia (banco)** | Corpo sem teto, campos sem `max()`, limite só em memória (§9/§10), uma sequência de IA paga por POST (§11), erro do Postgres devolvido ao visitante | Teto de 16 KB antes do parse; `max()` em todos os campos; segunda camada de limite contada no banco; IA disparando no máximo 1×/telefone a cada 30 min; `erroPublico` | **Fechado** |
| `/api/matchmaker` | PÚBLICA | nenhuma | anon | **20/min** | Sem limite nenhum, fazia streaming de `llama-3.3-70b-versatile` a cada POST | Rate limit, corpo ≤ 64 KB, ≤ 40 turnos, 4 000 caracteres por turno | **Fechado** |
| `/api/transcribe` | PÚBLICA | nenhuma | anon | **10/min** | Sem limite e sem teto de tamanho, chamava Whisper na Groq | Rate limit, `Content-Length` e tamanho real ≤ 8 MB (413), MIME conferido (415), erro sanitizado | **Fechado** |
| `/api/qa` | PÚBLICA | nenhuma | anon | 8/min | Até 120 embeddings pagos por POST, em série — ~960 chamadas por rajada de um IP só | Teto de 24 embeddings não-cacheados por requisição + cache real por trecho (TTL 30 min, 500 entradas) | **Fechado** |
| `/api/reviews` | PÚBLICA | nenhuma | anon | **5/min** | `req.json()` sem teto; comentário sem limite de tamanho | `corpoJson` (16 KB), teto por campo | **Fechado** |
| `/api/rum` | PÚBLICA | nenhuma | sim | **60/min** | Escrita anônima com service role, sem teto | Rate limit, corpo ≤ 4 KB, valor numérico finito, campos truncados | **Fechado** |
| `/api/catalog/ai/telemetry` | PÚBLICA | nenhuma | anon | **120/min** | Sem teto; devolvia `(e as Error).message` | Rate limit, corpo ≤ 4 KB, `erroPublico` | **Fechado** |
| `/api/gamification/claim` | PÚBLICA | nenhuma | anon | **30/min** | Cada POST criava usuário e creditava XP, sem teto | Rate limit + corpo ≤ 4 KB | **Fechado** |
| `/api/blog/comments` | PÚBLICA | nenhuma | sim | 5/min | `req.json()` sem teto antes do zod | `corpoJson` (16 KB) | **Fechado** |
| `/api/media-likes/toggle` | PÚBLICA | `MEDIA_LIKE_SECRET` | anon | 30/janela | — (já estava correto: zod, fail-closed 503, IP não persistido) | Nenhuma | Mantido |
| `/api/reviews` (GET), `/api/search`, `/api/search-index`, `/api/media-likes`, `/api/og` | PÚBLICA | nenhuma | anon | — | Verificado: allowlist explícita de colunas ou nenhum acesso direto a tabela | Nenhuma | Mantido |
| `/api/settings/tracking` (GET) | PÚBLICA | nenhuma | — | — | Já usava `publicFields` e remapeava para um shape fixo (§5) | Nenhuma | Mantido |
| `/api/integrations/[provider]/login` | ADMIN (proxy) | sessão | anon | não | `state` sorteado e jogado fora — comentário "optionally store state" | Grava `state` em cookie HttpOnly, `SameSite=Lax`, `Path=/api/integrations`, 10 min | **Fechado** |
| `/api/integrations/[provider]/callback` | ADMIN (proxy) | sessão | sim | não | `// TODO: validate state (nonce)` — aceitava qualquer callback forjado e gravava `access_token` de provedor (§16, CSRF de OAuth) | Confere o nonce em tempo constante; 400 `invalid_state`; cookie expira no fim do fluxo | **Fechado** |
| `/api/admin/analytics/breakdown` | ADMIN | proxy + `admin_auth=1` | sim | não | Conferência local por cookie **não assinada** — segurança de mentira | Trocada por `requireAdminApi` | **Fechado** |
| `/api/admin/analytics/leads_export` | ADMIN | proxy + `admin_auth=1` | sim | não | Idem, e é a rota que **exporta leads em CSV** | Trocada por `requireAdminApi` | **Fechado** |
| `/api/admin/{analytics/decision, analytics/deep-insights, catalog/ranking/recalc, leads/crossmatch, leads/fraud, migrations/apply-seo-score, reviews, reviews/[id], seo/autopilot, web-stories, web-stories/[id]}` | ADMIN | só proxy | 8 de 11 | não | Nenhum guard no handler — camada única. `migrations/apply-seo-score` até trazia um comentário assumindo proteção de middleware | `requireAdminApi` acrescentado nas 11 | **Fechado** |
| `/api/ai/captions`, `/api/ai/seo`, `/api/tracking/select`, `/api/tracking/settings`, `/api/settings/tracking` (POST) | ADMIN | sessão | sim | não | **Bypass confirmado em produção**: `curl -H "Cookie: admin_auth=1"` respondia 200 | `requireAdminApi` deixou de aceitar cookie não assinada + `proxy.ts` passou a cobrir as rotas fora do prefixo | **Fechado** (rodada anterior) |
| `/api/cron/publish-scheduled`, `/api/cron/autosales-due`, `/api/blog/publish-due` | CRON | `CRON_SECRET` | sim | não | Sem a variável definida, `autorizarCron` devolvia `null` e a rota respondia aberta | Passou a **falhar fechado**; erro sanitizado | **Fechado** |
| `/api/whatsapp/webhook` | WEBHOOK | `X-Hub-Signature-256` | anon | não | Aceitava POST sem conferir assinatura | Assinatura obrigatória; sem `WA_APP_SECRET` recusa; telefone mascarado no log | **Fechado** (rodada anterior) |
| `/api/webhooks/zapsign` | WEBHOOK | `ZAPSIGN_WEBHOOK_SECRET` | sim | não | Devolvia `String(e)` no corpo | `erroPublico`; recusa sem segredo | **Fechado** |
| `/api/qa/embed-missing`, `/api/search/reindex`, `/api/gamification/seed-badges` | INTERNAL | `INTERNAL_API_TOKEN` | 1 de 3 | não | Frase e hash **fixos no código-fonte**, num repositório público | Trocados por `INTERNAL_API_TOKEN`, fail-closed | **Fechado** (rodada anterior) |

## Rotas de debug removidas (§2, §3)

Cinco, todas por remoção e não por proteção — a orientação era remover quando não
há necessidade operacional real, e não havia: nenhuma tela do admin as chamava.

`app/api/debug-env`, `app/api/debug-post`, `app/api/debug/blog`,
`app/api/debug/blog-posts`, `app/api/diag/puppies`.

Varredura final: nenhum diretório `*debug*`, `*diag*`, `*dev*` restante em
`app/api`. O único `*test*` é `/api/admin/webhooks/[id]/test`, que dispara um
webhook de teste a pedido do admin — funcionalidade, não diagnóstico, e está
sob os dois guards.

## Stack trace e mensagem de erro (§4)

`src/lib/apiErro.ts` centraliza: `registrarErro(contexto, erro)` grava o detalhe
no servidor e `erroPublico(...)` devolve sempre
`{"error":"Não foi possível concluir a solicitação."}`.

Aplicado em 20 rotas mais o `respondWithError` compartilhado. O que vazava antes,
por categoria: texto de erro do Postgres (nome de tabela, de coluna e de
constraint) em `/api/leads`; `(e as Error).message` em telemetria e catálogo;
`String(e)` em webhook e cron; `err?.message` em blog, integrações e analytics.

## Auditoria de service role (§6)

`supabaseAdmin()` / `SUPABASE_SERVICE_ROLE_KEY` aparecem em rotas ADMIN, CRON,
INTERNAL, WEBHOOK e em cinco públicas (`/api/leads`, `/api/newsletter`,
`/api/contract`, `/api/blog/comments`, `/api/rum`) — todas de **escrita**, todas
com rate limit, nenhuma devolvendo linha lida ao visitante.

`select("*")` em rota pública: **zero**. O único caso vivia em
`src/lib/ai/catalog-ranking.ts`, consumido por `/api/catalog/ranked`, e virou
allowlist. Os `select("*")` restantes estão em `/api/admin/web-stories` e no
callback de integrações — ambos atrás de autenticação.

Nenhuma chave de serviço em HTML, JS de cliente ou JSON. `productionBrowserSourceMaps`
está `false` e o build não gera nenhum `.js.map` em `.next/static`. A varredura do
bundle por `SUPABASE_SERVICE_ROLE_KEY`, `service_role`, `ADMIN_SESSION_SECRET`,
`CRON_SECRET`, `INTERNAL_API_TOKEN` e `GROQ_API_KEY` retorna **um** arquivo, e o
que está lá é o *nome* da variável dentro de um aviso de tela do admin
("Configure ... SUPABASE_SERVICE_ROLE_KEY"), não o valor. Nenhum prefixo de
credencial (`eyJ`, `sb_`, `sk-`) aparece fora de `.env`.

## Varredura de segredos (§7)

Working tree: **NÃO ENCONTRADO**. Nenhum segredo real versionado; `.env.example`
só tem nomes e valores vazios.

Histórico do git: **ENCONTRADO — 2 ocorrências.**

| Tipo | Onde | Entrou em | Saiu em |
| --- | --- | --- | --- |
| Chave de API da OpenAI (`sk-proj-`, 164 caracteres) | `scripts/generate-embeddings.mjs`, como fallback fixo no código | `23b2eae` (2026-05-25) | `cd6329d` (2026-08-20) |
| Segredo compartilhado das rotas internas (frase + SHA-256 dela) | `src/lib/internalAuth.ts`, escrito como constante | `23b2eae` (2026-05-25) | **esta rodada** — antes disso, presente em todos os commits |

Nenhum dos dois valores é reproduzido aqui nem em log algum. **O repositório é
público**: os commits continuam acessíveis e as duas credenciais devem ser
consideradas comprometidas desde 25/05/2026.

A segunda é menos grave em consequência — não dá acesso a dado de cliente nem a
conta paga de terceiro — mas era a chave que abria `/api/qa/embed-missing` e
`/api/search/reindex`, as duas rotas que queimam crédito de embedding. Não há o
que rotacionar num painel: o conserto é definir `INTERNAL_API_TOKEN` no Netlify
com um valor novo, de pelo menos 24 caracteres. Enquanto a variável não existir,
as três rotas internas respondem 401 — fechado é o estado seguro.

> **ROTAÇÃO NECESSÁRIA — `OPENAI_API_KEY`.** Feita pelo titular da conta, no
> painel da OpenAI. Não foi rotacionada automaticamente. É achado **distinto** da
> rotação de chaves do Supabase, que está encerrada e não volta à pauta.

## Allowlist de campos públicos (§8)

`CAMPOS_PUBLICOS_DO_CATALOGO` lista nominalmente o que o catálogo pode publicar:
identidade, nome, status, preço, cor, sexo, cidade/estado, nascimento, descrição,
mídia, pedigree/microchip como **booleano**, avaliação, SEO e datas.

Fora dela, e portanto nunca mais na resposta: custo de aquisição, margem, notas
internas, fornecedor/origem, identificadores de cliente e de reserva, autoria de
registro, notas de saúde, número de microchip, URL de certificado e número de
pedigree.

## Rate limiting fora da memória (§9)

`src/lib/rateLimit.ts` conta em memória — em serverless cada instância tem o seu
`Map`, e quem distribui as requisições ganha janela nova a cada cold start.

`/api/leads`, que é a rota que alimenta o funil comercial, passou a ter uma
segunda camada contada **no banco**: 5 por minuto e 40 por dia por `ip_address`,
sobre `created_at`. Se a consulta falhar, ela registra o erro e cai para a camada
em memória em vez de recusar — derrubar formulário porque o banco piscou custa
mais caro que o risco que a regra cobre.

As demais rotas públicas seguem só com a camada em memória, e isso está declarado
no cabeçalho de `src/lib/limitePublico.ts`: é barreira contra script bobo e
rajada de um IP só, não garantia distribuída.

## Auditoria de dependências (§23)

`npm audit --omit=dev` → **0 vulnerabilidades**. Nada bloqueante. Nenhum
`npm audit fix --force`, nenhuma atualização de framework nesta rodada.

## Cookies do admin (§17)

`admin_session`, `admin_auth`, `adm`, `admin_email`, `admin_name`,
`admin_user_id` e `admin_role`: todos `HttpOnly`, `Secure` quando
`NODE_ENV === "production"`, `SameSite=Lax`, `Path=/`. Sessão expira em 8 horas;
o cookie de papel dura 7 dias, mas sozinho não autoriza nada — `requireAdminApi`
lê o papel do payload **assinado**, nunca do cookie de papel.

## CSRF (§16)

`SameSite=Lax` significa que o cookie de sessão não acompanha POST/PUT/DELETE
vindo de outro site — o que cobre todas as rotas administrativas de escrita. O
header `x-admin-pass` também não é forjável entre origens sem CORS, e não há
`Access-Control-Allow-Origin: *` em lugar nenhum (§15; a única ocorrência no
`netlify.toml` está comentada).

Sobra o caso em que `Lax` **envia** o cookie: navegação de topo por GET. Varri as
149 rotas atrás de handler `GET` que escreve no banco e achei três:

- `/api/cron/publish-scheduled` — autenticada por segredo, não por cookie. Sem risco de CSRF.
- `/api/integrations/[provider]/callback` — é o retorno do OAuth, GET por desenho. **Era** o caso real, e o nonce fechou.
- `/api/admin/seo/audit` — grava uma linha de histórico em `seo_history`. Sem entrada do usuário, sem chamada externa, sem escrita destrutiva, e a resposta vai para a aba do próprio admin (nenhuma origem estranha consegue lê-la). Risco **baixo**, aceito e registrado; trocar para POST mudaria a tela do admin, fora do escopo deste delta.

## CSP (§18) — plano, não instalação

Nenhuma CSP foi instalada. Os headers que já existiam continuam de pé, conferidos
em produção: `Strict-Transport-Security: max-age=31536000`, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()`.

Por que não instalar agora: o site carrega GTM, Google Ads/GA4, Meta Pixel,
TikTok, Hotjar, Pinterest, AMP CDN, Mailchimp e Supabase — e o GTM injeta tags
por configuração, ou seja, a lista de origens de script é aberta por natureza.
Uma `script-src` com allowlist quebraria a primeira tag nova publicada pelo
painel, e quebrar a medição de anúncios é pior que a falta da CSP.

Caminho recomendado, para uma rodada própria e sem prazo apertado:

1. `Content-Security-Policy-Report-Only` com `report-uri`, uma a duas semanas coletando violações reais.
2. `script-src 'strict-dynamic' 'nonce-<nonce>'` com nonce por requisição gerado no `proxy.ts` — é a única forma que convive com o GTM injetando tags e com o bootstrap inline do Next.
3. `img-src`, `connect-src`, `frame-src` e `media-src` derivados do relatório do passo 1, não da imaginação.
4. Só então promover para modo bloqueante, e com o painel de Ads aberto ao lado.

## Redirect aberto (§19) e SSRF (§20)

**§19:** nenhum. Os únicos redirecionamentos são de destino fixo — `www` no
`proxy.ts`, `/admin/login`, `/admin/dashboard` e `/admin/tracking`. Nenhuma rota
redireciona para URL vinda de query, corpo ou header.

**§20: NÃO APLICÁVEL.** Nenhuma rota busca URL fornecida pelo usuário. As
chamadas externas existentes têm destino fixo em código ou variável de ambiente
(OpenAI, Groq, Supabase, Meta, ZapSign).

## Logs e PII (§21)

Varredura por `console.*` e `logger.*` contendo telefone, e-mail, CPF, endereço,
token, cookie, `authorization`, `gclid`, senha, segredo ou corpo de mensagem:
**nada encontrado**. Os logs restantes carregam `error.message` de infraestrutura
(Supabase, rede), não dado de titular. O webhook do WhatsApp já mascara o número
com `mascararTelefone` nos dois pontos em que o registra. Nenhum `JSON.stringify`
de corpo em log.

## LGPD — o que o backend guarda × o que a política diz (§22)

A política **não foi redesenhada**, conforme a instrução. O que segue é a
comparação, para decisão do titular do tratamento.

A política, em "Dados coletados › 1. Contato inicial e interesse", declara: nome,
um canal de contato, cidade e estado, e as preferências informadas
voluntariamente (cor, sexo, prazo, mensagem).

O `INSERT` em `leads` grava, além disso, em toda submissão:

| Campo | O que é |
| --- | --- |
| `ip_address` | endereço IP de quem enviou |
| `user_agent` | navegador e dispositivo |
| `referer` | página anterior |
| `gclid`, `fbclid` | identificadores de clique de anúncio (Google e Meta) |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | origem da campanha |
| `page`, `page_type`, `page_slug`, `page_color`, `page_city`, `page_intent` | contexto da página de origem |

> **DIVERGÊNCIA — decisão do titular.** Esses dados de navegação e de publicidade
> ficam ligados a uma pessoa identificada (nome + telefone na mesma linha) e a
> política publicada não os menciona na etapa de interesse. Duas saídas possíveis:
> declarar a coleta na política, com a base legal que **o titular** escolher, ou
> parar de gravar os campos que não forem necessários (art. 6º, III). Nenhuma
> base legal foi inventada aqui e nenhum texto da política foi alterado.

Segundo ponto, menor: a política promete guardar os dados "durante o
relacionamento ativo e pelo prazo necessário", e **não existe rotina de expurgo
nem de anonimização** no código — a varredura por `delete`, `purge` ou
`anonimiz` em `app/api/leads`, `app/api/cron` e nas migrations não retorna nada.
Hoje o descarte depende de ação manual no painel.

## Vulnerabilidades bloqueantes

Nenhuma bloqueia o deploy. O que ficou fora do código, para o titular resolver:

1. **`OPENAI_API_KEY` — rotação necessária** (§7). Chave exposta em repositório público desde 25/05/2026.
2. **Divergência LGPD** (§22): declarar os campos de navegação/publicidade ou parar de gravá-los.
3. **`INTERNAL_API_TOKEN` — definir um valor novo** (§7). O segredo antigo estava escrito no código, em repositório público. Sem a variável, as três rotas internas respondem 401.
4. **Variáveis que precisam existir no Netlify**, senão as rotas ficam fechadas — que é o comportamento correto, mas é bom saber: `INTERNAL_API_TOKEN`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN`. `CRON_SECRET` já está configurado (confirmado por sonda).

## Resultado final

Portão de segurança **aprovado**. Cinco rotas de diagnóstico removidas, um
vazamento de campos internos do catálogo fechado, três vetores de custo de IA
limitados, treze rotas administrativas com segunda camada de guard, nonce de
OAuth implementado, cron falhando fechado, vinte rotas com erro sanitizado,
`npm audit --omit=dev` limpo, e dois segredos históricos identificados e
reportados para troca sem jamais serem impressos.

---

# Rodada de 26/08/2026 — fechamento

Segunda passada do mesmo prompt mestre (§§0–46), executada sobre a árvore já
entregue na rodada de 25/08. Regra aplicada: **§0, itens 5, 6 e 7** — não
implementar duas vezes, não reverter correção nova porque `main` tem a antiga,
e usar o código atual como verdade. O que já estava correto foi **conferido e
preservado**, não reescrito.

## Divergência entre o prompt e o código — reportada, não "corrigida"

O prompt desta rodada lista **quatro cores** (laranja, creme, preto, branco) e
faixa **R$ 6.500–9.500**, inclusive no §43, que é justamente o teste de
regressão. **Esse recorte está vencido.**

Entre as duas rodadas, a responsável determinou por escrito a entrada do
**particolor** como quinta cor divulgada — macho **R$ 5.500**, fêmea
**R$ 6.500** — implementada e publicada no commit `ddd446d`. Pelas regras 6 e 7
do próprio §0, **o particolor foi preservado**: a faixa pública correta hoje é
**R$ 5.500 – R$ 9.500**, com **cinco** cores. Reverter para quatro seria
desfazer uma decisão comercial mais nova do que o prompt que pede a reversão.

`tests/unit/sitemaps.test.ts` trava o número: `CORES_DIVULGADAS` tem de ser
exatamente `["particolor","laranja","creme","preto","branco"]`.

## Por que a rodada anterior não gerou drift de SEO

Preço e cor não estão escritos à mão em lugar nenhum. `src/domain/pricing.ts`
alimenta `priceRange` (`src/lib/structured-data.ts`), `PRODUCT_CONFIG.pricing`
(`src/domain/config.ts`) e o texto de `app/llms.txt/route.ts`, que conta as
cores por `CORES_EXIBIDAS.length` e formata a faixa por `FAIXA_PUBLICA`.
Resultado conferido: os três passaram sozinhos a dizer cinco cores e
R$ 5.500–9.500. **Nada precisou ser reeditado** — só verificado.

## Tabela de itens (§45)

| Item | Status antes | Ação | Arquivos | Teste | Status final |
| --- | --- | --- | --- | --- | --- |
| §11 Config sem invenção | Correto | Conferido, preservado | `src/domain/config.ts` | typecheck + testes | ✅ |
| §13/§14 `areaServed`, `priceRange` | Correto e derivado | Conferido; faixa recalculada sozinha | `src/lib/structured-data.ts` | build + JSON-LD | ✅ |
| §16 Offer só quando `available` | Correto | Conferido (`status === "available"`) | `src/lib/structured-data.ts:56` | leitura + build | ✅ |
| §17 `WebSite` enxuto | Correto | Conferido, sem `SearchAction`/`speakable` | `src/lib/tracking.ts` | build | ✅ |
| §6 Sufixo `[ref: XXXX]` | Já removido | Conferido: só resta o comentário que registra a remoção | `src/hooks/useWhatsAppLink.ts` | grep + testes | ✅ |
| §18 Domínio antigo no runtime | Ausente | Conferido: 0 ocorrência em código executável | — | grep global | ✅ |
| §18 Domínio antigo nos docs | **49 ocorrências** em 5 `.md` | **Substituído** + aviso de documento histórico | `Sistema_SEO_CANONICAL.md`, `IMPLANTACAO_SEO.md`, `ROUTE_VALIDATOR_*.md`, `SETUP_CANONICAL_QUICK.md` | grep: 0 restantes | ✅ |
| §18 Docs mandando usar `www` | **Errado** — instruíam `NEXT_PUBLIC_CANONICAL_ORIGIN=https://www.…` | Corrigido para o canônico real, sem `www` | os 5 `.md` acima | grep no código: 0 uso de `www.` | ✅ |
| §20 `llms.txt` | Correto e derivado | Conferido | `app/llms.txt/route.ts` | leitura | ✅ |
| §23/§25 Vídeo `laranja-macho-gramado` | **Ausente do registro** | **Registrado + pôster gerado** | `src/domain/gallery-videos.ts`, `video-medidas.json`, `_generated-image-sizes.ts`, `posters/laranja-macho-gramado.webp` | sitemap servido: 13 vídeos | ✅ |
| §E.6 Cor do filhote laranja | Bloqueio humano | **Fechado pela responsável** | `content/puppies-static.ts` | pricing-guard | ✅ |
| §E.7 Preço do particolor | Bloqueio humano | **Fechado pela responsável** | `src/domain/pricing.ts` | pricing-guard + sitemaps | ✅ |
| §12 Copy "laudo de saúde" | Fechado em 25/08 | **Reaberto para confirmação** (ver §E) | ~30 arquivos | — | ⚠️ humano |

## A. Google Ads

**Não foi tocado nesta rodada, e nada o tocou desde a anterior.** Conferência
feita pelo diff real do commit `ddd446d`: ele não altera `src/lib/conversions.ts`,
`src/lib/events.ts`, `src/components/PixelsByConsent.tsx`,
`src/components/tracking/WhatsAppClickTracker.tsx`, `src/lib/gclid.ts` nem
`src/hooks/useWhatsAppLink.ts`.

Dos arquivos que `ddd446d` mexeu, dois pareciam poder afetar medição e foram
lidos linha a linha:

- `src/components/WhatsAppFloat.tsx` — ganhou **duas linhas**: uma mensagem
  pré-preenchida para `/filhotes/cor/particolor`. Nenhum atributo de
  rastreamento, nenhum `placement` novo, nenhum ouvinte. O CTA continua sendo
  capturado pelo mesmo ouvinte delegado.
- `src/components/sections/VideoHero.tsx` — **perdeu** o contador "8 filhotes
  disponíveis agora", a pedido da responsável. O player (`videoRef`,
  `videoState`) não foi tocado, então §37 continua valendo como estava.

Conclusão: a instrumentação de §§1–8 permanece como auditada em 25/08, e o
que falta continua sendo **o label da conversão (§E.1)** — dado que só o dono
da conta tem.

## B. SEO

- **Canonical real, confirmado no código:** `https://byimperiodog.com.br`,
  **sem `www`** — em `src/domain/config.ts:59` e como *fallback* de
  `NEXT_PUBLIC_SITE_URL` em todas as rotas que montam URL absoluta.
  **Zero** ocorrência de `https://www.byimperiodog` em código.
- **Defeito corrigido nos docs:** `SETUP_CANONICAL_QUICK.md` e
  `IMPLANTACAO_SEO.md` mandavam configurar
  `NEXT_PUBLIC_CANONICAL_ORIGIN = https://www.byimperiodog.com.br`. Isso é o
  host que responde **301**. Quem seguisse a instrução colocaria o canonical
  brigando com o próprio redirect. Corrigido nos cinco documentos, todos com
  aviso no topo de que são **históricos** e devem ser conferidos contra o
  código antes de qualquer aplicação.
- **`route:validate` com servidor de pé** (a ferramenta sai 0 sem servidor —
  defeito pré-existente já documentado): **18 rotas, 0 erros, 0 avisos**,
  com `/admin` e `/admin/dashboard` respondendo **307** e `/admin/login` 200.

## C. Mídia

- **`laranja-macho-gramado.mp4` estava servido publicamente e fora de todo
  registro.** É o vídeo do filhote `lulu-pomerania-laranja-macho-01`, que está
  `available` e publicado. Sem registro ele não tinha pôster, não gerava
  `VideoObject` e não entrava em `/sitemaps/videos.xml`. Não era um defeito
  visível — `PuppyCinematicGallery` usa `photos[0]` como pôster, então não
  havia 404 nem schema inválido — mas era **omissão** diante de §23 e §25.
- **Registrado** com `uploadDate` **2026-08-26**, que é a data real de entrada
  no repositório, conferida em `git log` do próprio `.mp4`. Não foi usada a
  constante `VIDEO_UPLOAD_DATE` (maio), que seria data falsa.
- **Pôster gerado** por `npm run gen:video-posters` (Playwright + sharp; não há
  ffmpeg nesta máquina): `394×848`, duração `PT7S`, medidas reais lidas do
  arquivo. Os outros 12 pôsteres foram regerados **byte a byte idênticos** —
  o gerador é determinístico.
- **Verificado servindo de verdade**, contra `next start`:
  `/sitemaps/videos.xml` → **13 `<video:video>`, 13 thumbnails distintas**;
  `/galeria` → **13 `VideoObject`**; o `.mp4`, o `.webp` e a página do filhote
  respondem **200**.
- `wolf-sable-jardim.mp4` **continua deliberadamente fora do registro**,
  coerente com §43: cinza-lobo não volta à comunicação comercial ativa.

## D. Performance e acessibilidade

**Não reaberta.** As cinco correções WCAG de 25/08 estão intactas: `ddd446d`
não tocou em `PuppyCinematicGallery.tsx`, `TextTestimonials.tsx`,
`MDXContent.tsx`, `app/(public)/filhotes/[slug]/page.tsx` nem
`preco-spitz-anao/page.tsx`. Os alvos de toque abaixo de 44px seguem como
dívida consciente, já registrada.

## E. Bloqueios humanos — o que continua parado

Fechados nesta rodada: **6** (cor) e **7** (preço do particolor).
Seguem abertos, sem contorno: **1** (label da conversão WhatsApp),
**2** (`GOOGLE_ADS_ID`), **3**, **4**, **5**, e **8** (o arquivo
`spitz-femea-branco.mp4`, que precisa ser reenviado — a linha de registro está
escrita em comentário dentro de `src/domain/gallery-videos.ts`).

**Novo ponto para decisão da responsável — §12, copy de saúde.** A rodada de
25/08 fechou §12 como "dentro do que o canil sustenta". Ao reconferir, ficou
uma divergência que é comercial, não técnica, e por isso **não foi alterada**:
o site diz **"laudo de saúde"** como item próprio em cerca de 30 lugares
(home, `/sobre`, `/comprar-spitz-anao`, `/criador-spitz-confiavel`, páginas de
cor), enquanto a lista de inclusões confirmada e publicada no `llms.txt` é
**consulta veterinária + hemograma completo**. Se o veterinário emite e assina
um laudo, o texto está certo e nada muda. Se o que existe é a consulta e o
hemograma, a palavra precisa sair dos ~30 pontos. **Inventar a resposta é
proibido pelo §0**, e trocar copy comercial em massa sem confirmação seria pior
do que deixar apontado. `scripts/check-banned-words.mjs` não reprova o termo.

## F. Deploy

Um único commit, conforme §44. Nenhum deploy intermediário.

## Portões desta rodada (§42)

| Portão | Resultado |
| --- | --- |
| `npm run typecheck` | ✅ limpo |
| `npm run test` | ✅ **382 passaram**, 3 pulados, **0 falhas** (50 arquivos) |
| `npm run check:encoding` | ✅ nenhum mojibake |
| `npm run check:banned-words` | ✅ nenhuma palavra banida |
| `npm run build` | ✅ exit 0, incluindo todo o `prebuild` (content-guard, quality-gate `--strict`, geradores) |
| `route:validate` (com servidor) | ✅ 18 rotas, 0 erros, 0 avisos |
| `npm run lint` | ✅ **0 erros**, 1148 avisos (mesmo número da rodada anterior — sem regressão) |

Nenhum portão foi mascarado com `|| true`, e nenhum resultado acima foi
estimado: todos vêm de execução nesta máquina.

## Confirmação exigida

**Nenhuma URL pública mudou, nenhum canonical mudou, nenhuma arquitetura de SEO
foi alterada nesta rodada.** A única entrada nova em conteúdo público é um
vídeo que já estava sendo servido e que passou a ter pôster próprio, entrada de
sitemap e `VideoObject`. As demais mudanças são documentação interna e arquivos
gerados.

---

# POST-DEPLOY GAP CLOSURE

Rodada de 26/08/2026, sobre o `ddd446d` já publicado. As vinte perguntas do §21
do DELTA PÓS-DEPLOY, respondidas na ordem em que foram feitas. Onde a resposta
é "não", ela está escrita como "não".

## 1. Qual é agora a fonte canônica do catálogo?

`content/puppies-static.ts`. `app/(public)/filhotes/page.tsx` lê
`puppiesPublicados`; `app/(public)/filhotes/[slug]/page.tsx` lê `staticPuppies`
e gera as rotas por `generateStaticParams()`.

A escolha foi deliberada e o motivo é o §1 do próprio delta: **o HTML precisa
chegar pronto ao Google.** Trocar a vitrine por busca no Supabase no cliente
transformaria `/filhotes` numa página em branco para o rastreador. A tabela
`puppies` do Supabase continua existindo e continua sendo o que o painel
administra — ela é a fonte do **admin**, não do site público.

## 2. Admin e site usam o mesmo status?

Usam o mesmo vocabulário canônico, definido em `src/domain/puppy-status.ts`:
inglês na lógica (`available`), português no que fica gravado (`disponivel`).
`normalizePuppyStatus` lê, `toDbStatus` escreve, `statusOrFilter` consulta.

`statusOrFilter` é novo desta rodada e nasceu de um defeito que voltou pela
terceira vez — ver a pergunta 3.

## 3. AutoSales enxerga exatamente o mesmo estoque?

**Não, e isso não é um detalhe.**

O AutoSales lê a tabela `puppies` do Supabase (`src/lib/ai/autoSalesEngine.ts`);
o site público lê `content/puppies-static.ts`. São duas listas. Enquanto o
painel e o arquivo estático não forem reconciliados, o AutoSales pode oferecer
por WhatsApp um filhote que não está na vitrine, ou deixar de oferecer um que
está. **Fica registrado como gap arquitetural em aberto**, não como resolvido.

O que foi corrigido agora é pior do que a divergência e estava escondido dentro
dela: a consulta do AutoSales era

```
.or("status.eq.available,status.is.null")
```

numa tabela onde o admin **só grava "disponivel"**. Ou seja: o AutoSales não
enxergava nem o estoque do Supabase — só as linhas com status nulo. A consulta
é sintaticamente válida, não gera erro e não gera log; simplesmente devolve
menos linhas do que deveria.

O mesmo defeito estava em mais cinco lugares, todos corrigidos nesta rodada:

| Arquivo | O que a consulta errada fazia |
| --- | --- |
| `src/lib/ai/autoSalesEngine.ts` | oferecia ao lead um estoque que não era o do site |
| `src/lib/ai/crossmatch.ts` | cruzava lead com filhote sobre lista vazia |
| `src/lib/ai/catalog-ranking.ts` | ranqueava catálogo sobre lista vazia |
| `src/lib/ai/pricing-engine.ts` | recalculava preço sem nenhuma venda de comparação (`.eq("status","sold")`) |
| `src/lib/puppyRecommender.ts` | só recomendava filhote com status nulo |
| `src/lib/catalog/service.ts` | `getAvailableColors()` devolvia lista vazia |

Todos passaram a usar `statusOrFilter`, que deriva as formas aceitas da mesma
tabela de aliases usada na leitura. `tests/unit/consulta-de-status.test.ts`
impede a sétima ocorrência — e ele **foi visto falhando**: encontrou sozinho o
`.eq("status", "sold")` do `pricing-engine`, que eu não tinha visto.

## 4. Ainda existe campo duplicado?

Sim, no catálogo estático: `color`/`cor`, `sex`/`gender`,
`price_cents`/`priceCents`, `isHighlighted`/`isFeatured`. São herança da
migração português/inglês e diferentes componentes leem lados diferentes.

Remover os pares exigiria varrer todos os consumidores — trabalho que não cabia
nesta rodada sem risco. O que **não** pode acontecer é os dois lados
divergirem, porque aí a página se desmente. `scripts/catalog-audit.mts` já
reprovava divergência de `sex`/`gender`; nesta rodada passou a reprovar também
divergência de `price_cents`/`priceCents` — o campo com pior consequência, já
que o comprador chega ao WhatsApp com o número na cabeça. A checagem foi vista
reprovando um valor divergente antes de ser aceita.

`color`/`cor` ficou de fora da checagem de propósito: são vocabulários
diferentes (slug de rota × rótulo humano) e o projeto não tem um mapa canônico
entre os dois. Inventar um aqui seria criar uma terceira verdade.

## 5. Ainda existe nascimento placeholder?

Não. As seis linhas `birth_date: "2024-08-01"` / `nascimento: "2024-08-01"` —
a mesma data repetida em três filhotes — saíram do catálogo. Não foram
substituídas por estimativa nem por `created_at`: idade de filhote é informação
de decisão de compra, e errar por um mês é errar de verdade.
`scripts/catalog-audit.mts` reprova data sentinela (`0000-…`, `1970-01-01`).

## 6. Ainda existe "laudo de saúde" como promessa comercial?

Não. `scripts/check-banned-words.mjs` tem regra com escopo para
`laudo`/`atestado`: proibido na promessa comercial, liberado por arquivo
nomeado no texto educativo, na cláusula de contrato, no campo de upload do
painel e no atestado de voo — que é exigência real do transporte aéreo.

Uma frase escapou da allowlist por ser de arquivo liberado e foi corrigida
nesta rodada: o FAQ de `content/posts/spitz-alemao-anao-entrega-brasil.mdx`
dizia *"O filhote viaja com documentação completa e atestado de saúde."* — uma
promessa em nome do canil por um documento que não está na lista de entrega. O
texto passou a nomear o que existe de fato (vacinação, vermifugação, consulta
veterinária antes da entrega, hemograma completo, registro oficial, contrato) e
a explicar que o atestado de voo é documento à parte, emitido perto da viagem
por ter validade de 10 dias.

## 7. As páginas SP/MG/RJ continuam indexáveis? Por quê?

Sim, continuam. Nenhuma tem `noindex`, nenhuma foi redirecionada, nenhuma foi
apagada.

O motivo é o que o próprio delta manda: **essa decisão não se toma sem dado do
Search Console.** Apagar ou desindexar página que traz busca é perda real e
irreversível na prática; a suspeita de *doorway* não é prova de que ela não
serve. Os critérios de decisão já estão escritos — e escritos **antes** de ver
o número, para o dado não ser lido conforme a conveniência — em
`SEO_OPPORTUNITIES_PLAN.md`, seção 3.1.

O que foi corrigido nelas independentemente do dado, porque erro factual não
espera credencial: cada uma emitia um `LocalBusiness` próprio, com endereço em
Bragança Paulista, como se houvesse uma unidade por estado. Saíram.

## 8. Existe apenas um LocalBusiness?

Sim. Um único, emitido por `buildLocalBusinessLD()` a partir de
`app/(public)/layout.tsx`. As três páginas de estado e
`/criador-spitz-confiavel` deixaram de emitir o seu.

## 9. FAQPage foi removido?

Sim, de todo o projeto. Nenhum arquivo emite `FAQPage` — restam apenas os
comentários que registram a data e o motivo (o Google encerrou o rich result de
FAQ em 07/05/2026). **As perguntas continuam visíveis na página**, que é o que
serve ao leitor; o que saiu foi a marcação que não gera mais nada. O
`autopilot-seo` também parou de sugerir FAQPage no painel.

`tests/e2e/smoke.spec.ts` verifica no HTML servido que nenhuma página pública
publica FAQPage.

## 10. `max-image-preview: large` está presente?

Sim, em `src/lib/seo.ts`, junto de `max-snippet: -1` e `max-video-preview: -1`.
Não vão para página com `noindex` — declarar preferência de exibição de uma
página que não entra no índice só confunde a leitura da regra.

## 11. CI usa Node 24?

Sim. O workflow lê `node-version-file: .nvmrc`, e `.nvmrc` está em `24.19.0`,
dentro do `engines: ">=24 <25"` do `package.json`. Antes o CI fixava Node 20
enquanto o runtime era 24 — o CI aprovava num Node que a produção não usa.

## 12. Lint é bloqueante?

Sim. O `continue-on-error: true` saiu do passo de lint.

Isso custou trabalho nesta rodada, o que é justamente o argumento a favor: o
lint acusou **15 erros de `import/order`** introduzidos pelas inserções
automáticas de import desta sessão. Todos corrigidos. `npm run lint` agora
termina com **0 erros** (1159 avisos, nenhum bloqueante).

## 13. E2E é bloqueante?

Sim. Passo novo no CI, sem `continue-on-error`, rodando
`tests/e2e/smoke.spec.ts` contra o **build de produção**
(`PLAYWRIGHT_WEB_SERVER=npm run start`), não contra `npm run dev`.

O smoke respeita o §16: **não clica em CTA de WhatsApp, não envia formulário,
não gera lead, não toca em pagamento.** Ele confere o `href` do CTA sem clicar.

Esse passo já se pagou: foi ele que encontrou o defeito de preço com U+00A0
descrito na pergunta 19.

## 14. `catalog:audit` passa?

Passa. 12 entradas, 10 publicadas, 2 fora da vitrine, nenhuma falha crítica. O
script sai com código diferente de zero em falha crítica e roda dentro do
`prebuild`, então build quebrado por catálogo não vira deploy.

## 15. Google Ads ID/label estão configurados ou continuam bloqueados?

**BLOQUEADO — ação humana, no painel do Google Ads.**

A medição está inteira e pronta:

- evento GA4 `whatsapp_click` com `page_path`, `page_title`, `placement`,
  `puppy_slug` e `campaign_context`, **sem nenhum dado pessoal** — nome,
  telefone, e-mail, texto da mensagem, IP e gclid completo estão fora por regra;
- **um único ouvinte delegado** em `document`, montado uma vez
  (`WhatsAppClickTracker.tsx`), justamente para que um clique físico vire
  exatamente um evento — os links de WhatsApp aparecem em 59 arquivos, e
  `onClick` espalhado somaria pai e filho;
- nunca chama `preventDefault`, e a chamada de medição vive dentro de
  `try/catch`: **medição não pode ficar na frente do atendimento**;
- `gclid`/`gbraid`/`wbraid` e UTMs preservados, com o identificador de anúncio
  em `sessionStorage` sempre e em `localStorage` por 90 dias **só com
  consentimento de marketing**.

O que falta é uma coisa só: o **rótulo de conversão "Clique WhatsApp"** não
existe em lugar nenhum do projeto. `getAdsWhatsAppLabel()` devolve `null`, e
`null` ali significa **"não dispara"** — nunca "usa o rótulo de lead no lugar".
Inventar um `AW-…/…` é proibido e seria pior do que não medir: gravaria
conversão na conta errada.

Para destravar, a pessoa responsável cria a conversão no Google Ads e cadastra
`GOOGLE_ADS_ID` e `GOOGLE_ADS_WHATSAPP_LABEL` no Netlify. Nenhuma dessas
variáveis é digitada por mim.

Vale registrar o que isso significa para a pergunta comercial que abriu o
delta — *"quando o Ads mostrar 5 cliques, quantos chegaram ao WhatsApp?"*: a
partir deste deploy, o **GA4 já responde** (evento `whatsapp_click` com
`campaign_context: google_ads`). O que continua sem responder é o Ads, que
precisa do rótulo para atribuir a conversão à campanha.

## 16. Secrets históricos foram rotacionados?

Sim — confirmado pela pessoa responsável em 20/08/2026. Item encerrado; não
volta a esta lista.

A varredura desta rodada reporta **NOT FOUND** para chave de serviço ou token
versionado no repositório. Os dois arquivos `.env*` que existem na máquina
estão no `.gitignore`, incluindo o `.env.local.local` avulso.

## 17. Media Likes está realmente ativo ou fail-closed?

**Fail-closed, por construção.** `MEDIA_LIKE_SECRET` não tem valor padrão
embutido: um segredo no código tornaria o hash de visitante reproduzível por
qualquer pessoa que leia o repositório — e o repositório é público. Sem a
variável, `POST /api/media-likes/toggle` responde **503**, não uma curtida
falsa.

A variável não está configurada nesta máquina (só documentada em
`.env.example`). Se ela está no Netlify eu não tenho como ver daqui, então a
resposta honesta é: **ativo se e somente se a variável existir em produção**.
A leitura de contagem funciona sem cookie e sem identidade; e banco fora do ar
devolve 503, nunca `{ count: 0 }` — "ninguém curtiu" e "não deu para saber"
não são a mesma frase.

## 18. Search Console Opportunities foi implementado ou bloqueado por credencial?

**BLOQUEADO POR CREDENCIAL** — e o bloqueio **não impede o deploy**.

O código está pronto e protegido (`src/lib/gsc.ts`,
`app/api/admin/seo/gsc/route.ts`, ambos atrás de `requireAdminApi`).
`GOOGLE_SERVICE_ACCOUNT_KEY` e `GOOGLE_SEARCH_CONSOLE_SITE_URL` não estão
configuradas, então `isGscConfigured()` devolve `false` e a rota responde
`GSC_NOT_CONFIGURED` — comportamento correto, não defeito.

`SEO_OPPORTUNITIES_PLAN.md` foi escrito nesta rodada com: como obter a
credencial (permissão de **leitura** basta), o que roda no minuto seguinte, e
as três decisões que estão paradas esperando dado — as páginas regionais, o
inventário dos 30 artigos do blog, e os termos em posição 8–20.

## 19. Todos os testes passaram?

| Portão | Resultado |
| --- | --- |
| `npm run typecheck` | ✅ exit 0 |
| `npm run test` | ✅ **408 passaram**, 3 pulados, **0 falhas** (55 arquivos) |
| `npm run check:encoding` | ✅ nenhum mojibake |
| `npm run check:banned-words` | ✅ nenhuma palavra banida |
| `npm run catalog:audit` | ✅ 12 entradas, 0 falhas críticas |
| `npm run lint` | ✅ **0 erros**, 1159 avisos |
| `npm run build` | ✅ exit 0, `prebuild` completo |
| `playwright smoke` (build de produção) | ✅ **8/8** chromium |
| `npm audit --omit=dev` | ✅ **0 vulnerabilidades** |

Nenhum portão foi mascarado com `|| true`. Nenhum número acima foi estimado.

Três defeitos reais desta rodada merecem registro porque nenhum deles aparecia
como erro:

**O preço com U+00A0.** `/filhotes/spitz-alemao-anao-branco-femea` publicava
`R$ 9.500` com espaço sem quebra, e `/preco-spitz-anao` publicava o mesmo valor
com espaço comum. Idênticos na tela, strings diferentes no HTML — nenhuma
checagem de texto conseguia ligar os dois. A causa eram sete componentes, cada
um com seu `formatPrice` privado usando `Intl` com `style: "currency"`. Catorze
arquivos passaram a delegar a `formatarPreco`, três módulos de formatação sem
nenhum importador foram apagados, e
`tests/unit/price-format-guard.test.ts` impede o oitavo.

**A consulta de status.** Descrita na pergunta 3. Seis arquivos.

**O cache de mídia.** O cabeçalho de 30 dias do Netlify cobria `/images/*` —
17 arquivos — enquanto as fotos do catálogo moram em `/filhotes/` (138
arquivos, 108 referências) e `/clientes/` (37 arquivos), servidas com
revalidação a cada visita. Em tráfego que é praticamente todo de celular, isso
é peso pago de novo a cada acesso. Corrigido.

Também nesta rodada: `Strict-Transport-Security` passou a ser enviado
deliberadamente **sem** `includeSubDomains` e **sem** `preload` — os dois são
difíceis de desfazer, e nenhum dos dois é decisão para se tomar sozinho. **CSP
não foi instalada**, conforme o aviso explícito do §20 do delta de segurança:
uma política estrita instalada às cegas quebraria GTM, GA4, Ads e Supabase de
uma vez.

## 20. Qual commit foi publicado?

Branch `chore/next16-react19-node24`, commit cujo assunto começa com
`fix: fechar as lacunas pos-deploy`. O hash aparece no `git log` do repositório
e no painel do Netlify quando o branch entrar em `main`.

Ele não está escrito aqui de propósito: um commit não pode conter o próprio
hash. O hash é calculado a partir do conteúdo, e este arquivo faz parte do
conteúdo — escrever o número exigiria refazer o commit, o que geraria outro
número. Registrar um hash já vencido seria pior do que não registrar nenhum. O
par assunto + branch identifica o commit sem ambiguidade.

Um único commit, um único deploy, conforme o §22. Nenhum deploy intermediário
foi feito em nenhum momento desta rodada.

## Bloqueios que continuam parados (nenhum é técnico)

1. **Garantia — as três regras se contradizem.** O site fala em 90 dias, a
   cláusula do contrato fala em 72 horas, e há menção a cobertura hereditária
   vitalícia. Não escolhi nenhuma: qual vale é decisão comercial e jurídica.
2. **Cláusula 3.2 do contrato.** Fala de laudo apresentado *pelo comprador*.
   Auditada, reportada, não alterada — texto de contrato não se reescreve por
   conta própria.
3. **`TextTestimonials.tsx:80`.** A fala de um cliente menciona um documento
   fora da lista de entrega. Reescrever a fala de alguém seria falsificação;
   quem pode corrigir é quem falou.
4. **Rótulo de conversão do Google Ads** (pergunta 15).
5. **Credencial do Search Console** (pergunta 18).
6. **`MEDIA_LIKE_SECRET` no Netlify** (pergunta 17), se a intenção é ter
   curtidas ativas.

## Confirmação exigida

**Nenhuma URL pública mudou. Nenhum canonical mudou. Nenhuma arquitetura de SEO
foi alterada nesta rodada.** As páginas regionais continuam existindo e
indexáveis. O que mudou em conteúdo público foi uma frase de FAQ que prometia
um documento inexistente, e o preço passou a ser escrito de uma forma só.


---

# MASTER 3.0 — 48 PERGUNTAS (§117)

Rodada única sobre o HEAD de `main`, branch `chore/next16-react19-node24`.
Data: 27/08/2026. **Nenhum deploy intermediário foi feito.**

As respostas abaixo foram verificadas contra o **HTML realmente servido** por um
`npm run start` do build desta rodada, e — onde a pergunta é sobre o site no ar —
contra `https://byimperiodog.com.br`. Onde a verificação não foi possível daqui,
está escrito que não foi, e por quê. Nenhuma resposta foi marcada como verde por
ausência de evidência.

## 1. O site publica estoque público?

Não. Nenhuma página pública informa quantos filhotes existem, quais estão livres
ou quais saíram. Verificado sobre o HTML servido em `/`, `/filhotes`, uma ficha
de cor e `/preco-spitz-anao`: **`availability` aparece 0 vez** em qualquer
JSON-LD, e nenhum texto visível declara estado de unidade.

A vitrine é permanente por **cor + sexo**. Disponibilidade real se confirma
apenas no atendimento.

## 2. Algum card diz "disponível", "reservado" ou "vendido"?

Não. A varredura desta rodada trocou o vocabulário de estoque em todo texto que
vira HTML — `app/`, `src/` e `content/`, poupando comentários de código, que
documentam justamente o que foi removido antes.

Dois resíduos escaparam da varredura automática e foram corrigidos à mão:

- `app/(public)/preco-spitz-anao/page.tsx:200` — a nota de rodapé em JSX começa
  com `*`, e o filtro de comentário do script tratou a linha como comentário. O
  texto dizia "Consulte filhotes disponíveis no catálogo"; hoje diz "Cada valor
  é o ponto de partida daquela combinação de cor e sexo. Consulte as opções
  atuais pelo WhatsApp."
- `src/components/ui/card.tsx:25` — exemplo de JSDoc com `<CardTitle>Filhote
  Disponível</CardTitle>`. Não vira HTML, mas é o trecho que a próxima pessoa
  copia. Trocado por `Spitz Alemão Anão laranja`.

`npm run check:banned-words` e `npm run seo:audit` fecham em 0 erro.

## 3. O site informa quantidade disponível?

Não. Nem contador, nem "restam X", nem "X de X filhotes", nem lista de espera
baseada em estoque, nem contador de visitantes. Nenhum desses termos existe em
texto público.

## 4. A foto é removida quando o animal sai?

Não, e isso é decisão de arquitetura, não descuido. A foto é **galeria e
referência visual real** do que o canil produz. Removê-la jogaria fora
indexação, autoridade de página, presença no Google Imagens e histórico de
compartilhamento — para ganhar o quê? A disponibilidade não é publicada, então
não há nada a corrigir quando um animal sai.

O corolário: **nenhuma URL muda quando um animal sai, e nenhum deploy é
necessário para alterar disponibilidade** — porque disponibilidade não está
publicada em lugar nenhum.

## 5. As páginas são evergreen?

Sim. `/filhotes/spitz-alemao-anao-<cor>-<sexo>` é uma página de **combinação**,
não de indivíduo. Ela existe enquanto o canil trabalhar aquela cor, o que a
torna acumuladora de autoridade em vez de descartável.

## 6. Qual é a fonte canônica das fotos?

`content/puppies-static.ts` para o mapeamento, e os arquivos em
`public/filhotes/` para o conteúdo. Tudo versionado no Git. O Supabase **não** é
fonte canônica de foto de vitrine — a instrução antiga que dizia o contrário foi
cancelada pelo §2 do Master 3.0.

Consequência prática: banco fora do ar não derruba a vitrine. Está registrado em
`DISASTER_RECOVERY.md` como propriedade de arquitetura, não como sorte.

## 7. Qual é a fonte canônica de preço?

`src/domain/pricing.ts`. A formatação é centralizada em `formatarPreco`, e
`tests/unit/price-format-guard.test.ts` impede que um oitavo componente volte a
escrever o seu próprio `Intl.NumberFormat`. Antes desta consolidação, sete
componentes formatavam sozinhos e produziam strings diferentes para o mesmo
valor — idênticas na tela, distintas no HTML.

## 8. O "a partir de" está correto?

Sim, para as cinco cores divulgadas:

| Cor | Macho | Fêmea |
|---|---|---|
| Particolor | R$ 5.500 | R$ 6.500 |
| Laranja | R$ 6.500 | R$ 7.500 |
| Creme | R$ 7.500 | R$ 8.500 |
| Preto | R$ 7.500 | R$ 8.500 |
| Branco | R$ 8.500 | R$ 9.500 |

Cinza-lobo permanece com `divulgar: false` e fora da tabela, por decisão
comercial. As páginas evergreen de referência da cor continuam existindo e
auditadas — elas descrevem a cor, não anunciam preço.

"A partir de" é a formulação honesta: o valor é o piso daquela combinação, não
uma promessa de que todo animal sai por ele.

## 9. `Product` / `Offer` / `InStock` permanecem em página evergreen?

`Product`: **0**. `InStock`: **0**. `availability`: **0**. Contados sobre o HTML
servido nas quatro URLs de amostra.

Permanece **um** nó `Offer`, dentro de `makesOffer` do `LocalBusiness`:

```json
{"@type":"Offer","name":"Filhote de Spitz Alemão Anão — Lulu da Pomerânia",
 "description":"...vacinado e vermifugado, com consulta veterinária, hemograma
 completo e pedigree...","priceCurrency":"BRL",
 "url":"https://byimperiodog.com.br/filhotes",
 "areaServed":{"@type":"Country","name":"Brasil"}}
```

Sem `price`. Sem `availability`. Sem `Product` em volta.

## 10. Por quê?

Porque `makesOffer` num `LocalBusiness` responde "o que este negócio faz", e a
resposta — *cria e vende filhote de Spitz Alemão Anão, no Brasil* — é verdadeira
e permanente. `Product` + `Offer` + `availability` responderiam "esta unidade
está à venda agora", que é exatamente a afirmação que o site não faz e não pode
manter atualizada sem virar sistema de estoque.

Nesta rodada foi removida a função `schemaAvailability()` de
`src/domain/puppy-status.ts`, que traduzia status interno para `InStock`,
`PreOrder` ou `SoldOut`. Ela estava sem **nenhum** chamador desde que o
`Product` saiu das vitrines. Uma função pronta que ainda sabe escrever `InStock`
é um convite a reintroduzir o problema no próximo componente de catálogo — por
isso foi apagada, e não apenas deixada de lado. O status continua no admin
(`STATUS_LABEL`), que é onde ele sempre pertenceu: decisão de atendimento.

Também nesta rodada, `hasOfferCatalog.name` perdeu a palavra "disponíveis". O
nó fixo do grafo dizia "Filhotes de Spitz Alemão Anão **disponíveis**" em toda
página do site — uma afirmação de estoque dentro do JSON-LD que ninguém
atualizava. Nenhuma regex de texto do auditor pegava, porque havia palavras
entre "filhotes" e "disponíveis". Encontrado por leitura, não por ferramenta.

## 11. Algum pageview é chamado de lead?

Não. `tests/unit/view-nao-e-lead.test.ts` existe justamente para travar isso, e
passa. Os eventos declarados no código público são `page_view`, `view_form`,
`submit_start`, `submit_success` e `submit_error` — a distinção entre "abriu o
formulário" e "enviou o formulário" é explícita e testada.

## 12. Existe evento de visualização de galeria?

Sim, e ele é de **engajamento**, não de conversão: `gallery_swipe` e
`gallery_images`. Nenhum deles alimenta conversão do Ads nem entra na contagem
de leads. Ver galeria é sinal de interesse, e é assim que está classificado.

## 13. Um clique físico no WhatsApp gera exatamente uma conversão?

Sim. `tests/components/whatsappClickTracker.test.tsx` cobre isso com 10 testes,
incluindo o caso do botão flutuante real — "um toque, um evento" — e a
verificação de que o componente **não** emite evento próprio além do
`whatsapp_click` do ouvinte. Era esse duplo disparo que inflava conversão.

Nenhum clique de CTA foi disparado contra o site em produção durante esta
auditoria: isso gravaria conversão real na conta de Google Ads do canil. A
verificação em produção foi feita só com leitura (`curl`).

## 14. O UTM respeita o consentimento?

Sim. `src/lib/consent.ts` implementa consentimento LGPD com as categorias do
Google Consent Mode v2 — `necessary`, `analytics`, `marketing`, `functional` —
e expõe `OPEN_CONSENT_EVENT` para revogação. `src/lib/attribution.ts` captura
`utm_source`, `utm_medium` e `landing_page` dentro desse regime.

## 15. Sobrou "laudo" como promessa comercial?

Não em conteúdo do canil. A varredura desta rodada trocou seis ocorrências em
cinco arquivos, sempre pelo que o canil entrega de fato — **consulta veterinária
antes da entrega** e **hemograma completo**, não um documento genérico:

| Arquivo | Antes | Depois |
|---|---|---|
| `content/guides/index.ts:37` | "apresentam laudo de medição junto ao registro" | "é honesto sobre o limite: altura de adulto não se mede em filhote" |
| `content/guides/index.ts:59` | "laudo de saúde, exames genéticos" | "carteira de vacinação assinada, histórico de vermifugação e o resultado dos exames feitos antes da entrega" |
| `content/posts/documentacao-registro-spitz-alemao.mdx:73` | "Laudo de saúde veterinário" | "Resultado dos exames feitos antes da entrega — consulta veterinária e hemograma completo, por escrito" |
| `content/posts/spitz-alemao-anao-filhote-primeiros-dias.mdx:96` | "Laudo de saúde (se o criador forneceu)" | "Resultado dos exames feitos antes da entrega, se o criador forneceu" |
| `content/posts/vacinas-spitz-alemao-anao-filhote.mdx:83` | "Laudo de saúde" | "Consulta veterinária antes da entrega, com hemograma completo" |
| `content/posts/como-escolher-canil-spitz-alemao.mdx:52` | "Laudo veterinário de saúde" | "Resultado dos exames feitos antes da entrega (consulta veterinária e hemograma completo)" |

Duas exceções continuam de pé, **de propósito**:

1. `src/components/sections/TextTestimonials.tsx` — está na allowlist de
   `check-banned-words.mjs` com a razão escrita no próprio arquivo: reescrever a
   fala de um cliente seria falsificação. Quem pode corrigir é quem falou.
2. Cláusula 3.2 do contrato — fala de laudo apresentado *pelo comprador*.
   Auditada e reportada em `CONTRACT_LEGAL_BLOCKERS.md`, não alterada. Texto de
   contrato não se reescreve por conta própria.

## 16. Sobrou claim de estoque?

Não. Zero ocorrência de: *Disponível, Reservado, Vendido, Em estoque, InStock,
Último desta cor, Restam X, X disponíveis, X de X filhotes, Disponibilidade
limitada, Ninhadas esporádicas, Alta procura, Mais procurado, Estoque baixo*.
Nem lista de espera por estoque, nem contador de reserva, nem contador de
visualização, nem urgência fabricada.

O texto padrão passou a ser: *"Consulte as opções atuais pelo WhatsApp."* e
*"Fale com a equipe para conhecer os filhotes disponíveis no atendimento."*

## 17. Sobrou claim falso sobre criação ou origem?

Não. Os fatos publicados são os confirmados: fundação em **2013**, base em
**Bragança Paulista, SP**, CNPJ 22.587.478/0001-00. O site não afirma estrutura
física que não existe, não inventa parceiros, não cita filial e não publica
endereço residencial.

Sobre identificação do animal, o site diz apenas que *"a identificação do animal
segue os requisitos exigidos pela legislação aplicável"* — porque microchip é
opcional e afirmar o contrário seria promessa que o canil não fez.

Padrão da raça: **21 cm ± 3 cm** de cernelha, peso proporcional ao tamanho. O
site **não** publica "1,5–3,5 kg" como faixa oficial da FCI, porque não é.

## 18. `FAQPage` foi removido?

Sim. **0** ocorrência no HTML servido em qualquer das URLs de amostra. O
conteúdo de FAQ continua na página, para quem lê; o que saiu foi a marcação que
disputava um rich result que o Google aposentou.

## 19. Quantas schema factories existem?

**Seis**, e não mais sete. A contagem por importadores:

| Módulo | Importadores |
|---|---|
| `src/lib/structured-data.ts` | 29 |
| `src/lib/schema.ts` | 16 |
| `src/lib/seo.core.ts` | 5 |
| `src/lib/schemas/article.ts` | 1 |
| `src/lib/schemas/breadcrumb.ts` | 1 |
| `src/lib/blog/seo.ts` | 1 |
| ~~`src/lib/blog.breadcrumbs.ts`~~ | **0 — removido nesta rodada** |

`blog.breadcrumbs.ts` eram 11 linhas duplicando `schemas/breadcrumb.ts`, sem uma
única referência em `src`, `app`, `tests` ou `scripts`. Removido pelo mesmo
motivo da `schemaAvailability()`: código morto que ainda sabe gerar JSON-LD é
uma segunda fonte da verdade esperando alguém importar.

Seis não é um número bonito, mas é honesto: `structured-data.ts` é o grafo do
site, `schema.ts` e `seo.core.ts` cobrem metadados de página, e os três de blog
são específicos de artigo. Consolidar os seis num só é refactor de risco não
trivial, e o §145 é explícito: **não transformar a busca pelo site perfeito numa
sequência infinita de refactors**. Fica registrado como candidato futuro, não
como pendência desta rodada.

## 20. Existe apenas um `LocalBusiness`?

Sim — **uma** entidade, `@id: https://byimperiodog.com.br/#business`.

O `grep` bruto conta 2 ocorrências por página, e isso não é duplicação: o
Next.js emite o mesmo `<script type="application/ld+json">` uma vez no HTML e
uma vez dentro do payload RSC. Contando `"@type":"LocalBusiness"` sobre o
documento inteiro, o resultado é **1**.

## 21. `Google-Extended` está documentado?

Sim, em `app/robots.ts`, com o motivo escrito ao lado de cada agente. Estão
explicitamente **liberados**: `PerplexityBot`, `GPTBot`, `Google-Extended`
(Gemini e grounding do AI Overviews), `ClaudeBot`, `anthropic-ai`, `CCBot` e
`Applebot-Extended`.

A decisão é deliberada e está comentada no arquivo: um canil que quer aparecer
em resposta gerada por IA não bloqueia o rastreador que alimenta essa resposta.

## 22. `max-image-preview:large` está presente?

Sim, nas quatro URLs de amostra. Verificado sobre o HTML servido, não sobre a
configuração.

## 23. `primaryImageOfPage` é coerente?

Sim, onde faz sentido. Presente em `/filhotes` e nas fichas de cor — as páginas
em que existe **uma** imagem que representa a página. Ausente em `/`,
`/preco-spitz-anao` e `/blog`, que não têm imagem principal única; declarar uma
ali seria escolher arbitrariamente e chamar isso de dado estruturado.

## 24. O sitemap de imagens é válido?

Sim. `https://byimperiodog.com.br/sitemaps/images.xml` responde 200 com
`application/xml`, namespace `sitemap-image/1.1`, e cada `<image:image>` está
amarrada à `<loc>` da página em que a foto realmente aparece.

Sem `<lastmod>` — de propósito. Não existe data confiável para "quando esta
lista de imagens mudou", e data chutada é pior do que campo ausente, porque
ensina o Google a desconfiar do arquivo inteiro.

## 25. O sitemap de vídeos é válido?

Sim. `sitemaps/videos.xml`, namespace `sitemap-video/1.1`, com
`video:thumbnail_loc`, `video:title` e `video:description` preenchidos, apontando
para `/galeria`. O `<lastmod>` aqui é `ULTIMO_VIDEO_UPLOAD_DATE` — data real de
entrada do vídeo, não o horário do build.

**Sobre o índice:** `sitemap-index.xml` lista quatro filhos —
`sitemap.xml`, `posts.xml`, `images.xml`, `videos.xml`. Existem sete arquivos em
`app/sitemaps/`; `tags`, `authors`, `categories` e `puppies` ficaram **fora do
índice de propósito**, com o motivo escrito no `route.ts`: eles apontavam para
rotas inexistentes (`/blog/tag`, `/autores`, `/categorias`, `/filhote/{id}`), e
mandar o Google para 404 é pior do que não mandar.

## 26. O vídeo suporta `Range`?

Sim, e foi verificado dos dois lados:

- Local: `HTTP/1.1 206 Partial Content`, `Accept-Ranges: bytes`,
  `Content-Range: bytes 0-1023/5057516`.
- Produção: mesmo 206, com
  `Cache-Control: public,max-age=2592000,stale-while-revalidate=604800`.

## 27. A mídia de `/filhotes` tem cache adequado?

Em produção, sim: 30 dias com `stale-while-revalidate`, confirmado por header.
`npm run cache:verify` fecha em 0 erro com 12 mídias coerentes.

Os 3 avisos que sobram são de `max-age=0` em vídeo **no servidor local**. Isso é
artefato do `next start`, não defeito de produção — o header real do site no ar
é o de 30 dias, medido acima. O aviso fica porque um auditor que esconde a
diferença entre local e produção não serve para nada.

## 28. `seo:audit` é auditoria real?

Sim. Ele busca as URLs por HTTP e lê o HTML servido; não inspeciona código-fonte
nem configuração. O resultado desta rodada:

```
URLs coletadas : 85
URLs auditadas : 85
Responderam    : 85
Inacessíveis   : 0
Erros          : 0
Avisos         : 29
✅ Auditoria aprovada com 29 aviso(s).
```

Antes das correções desta rodada ele saía com **66 erros** — 62 de linguagem de
estoque e 4 de `claim:laudo`. Um auditor que já reprovou o próprio site é a
única prova que vale de que ele não é decorativo.

## 29. Ele falha com o servidor offline?

Sim. Executado contra a porta morta 3999, `seo:audit` sai com **exit 1** e diz
explicitamente que aquilo **não é aprovação do site**. Zero URL verificada é
erro, nunca verde.

## 30. O route validator falha offline?

Sim, mesmo comportamento: exit 1 contra porta morta. O mesmo vale para
`production:seo-watch`.

Contra o servidor vivo desta rodada: `route:validate` → 18 rotas, 0 erro.

## 31. O CI usa Node 24?

Sim. `.github/workflows/ci.yml` usa `node-version-file: .nvmrc`, e o `.nvmrc`
está em `24.19.0`. O `package.json` declara `engines: >=24 <25`. A versão do CI
não pode divergir da local sem que o arquivo mude.

## 32. O lint é bloqueante?

Sim. O `continue-on-error` foi removido em 26/08/2026. O passo "Lint" do job
`Qualidade e build` derruba o CI.

Prova desta rodada: o lint **reprovou** com 1 erro de `import/order` em
`src/components/color-page/ColorPageContent.tsx:23`, e o commit só avançou
depois da correção. Hoje: **0 erro, 1149 avisos**. Os avisos são
majoritariamente `setState` síncrono em efeito, dentro do painel admin — dívida
conhecida, sem efeito sobre o site público, e não é assunto desta rodada.

## 33. O Playwright é bloqueante?

Sim. O passo "Smoke público" roda
`npx playwright test tests/e2e/smoke.spec.ts --project=chromium` com
`PLAYWRIGHT_WEB_SERVER: npm run start`, e derruba o CI.

Prova desta rodada: o smoke **falhou** — 1 de 15 — e a falha era do **teste**,
não do site. A asserção antiga varria o `robots.txt` inteiro procurando
`Disallow: /` e reprovava um arquivo correto, porque não distinguia "o site foi
desindexado" de "um raspador de backlink foi bloqueado".

O teste foi reescrito para fazer parsing **por grupo `User-Agent`** (RFC 9309),
com allowlist nomeada de raspadores (`ahrefsbot`, `semrushbot`, `dotbot`,
`mj12bot`), e passou a exigir também que o grupo `*` libere a vitrine e que o
`/admin` fique fora do índice. **O portão ficou mais rigoroso, não mais frouxo**
— para Googlebot, para os bots de IA e para o `*`. Depois: 15 passaram.

## 34. `showcase:audit` e `catalog:audit` são bloqueantes?

Sim, os dois — via `prebuild`, o que significa que `npm run build` não começa se
eles reprovarem. É também por isso que **`next build` puro nunca deve ser
usado** neste projeto: ele pularia a cadeia inteira de portões.

Resultado desta rodada: `showcase:audit` → "Nenhuma falha crítica";
`catalog:audit` → aprovado.

## 35. As páginas regionais correm risco de doorway?

Não, e a razão é substância, não declaração. `/filhotes/sao-paulo`,
`/filhotes/minas-gerais` e `/filhotes/rio-de-janeiro` têm conteúdo próprio sobre
entrega e logística para cada região, não são o mesmo texto com o nome do estado
trocado, e são **três**, não trinta.

O portão de qualidade do §quality-gates dispara aviso a partir de 30 páginas de
localidade e trava em 50. Três estados, em que o canil de fato atende, não é
página-porta — é informação que a pessoa daquele estado precisa.

**Nenhuma página de cidade em massa foi criada, e nenhuma será por conta
própria.**

## 36. Alguma decisão destrutiva foi tomada sobre URL?

Nenhuma. **Nenhuma URL pública mudou nesta rodada. Nenhum canonical mudou.**
Nenhuma página foi despublicada, redirecionada ou renomeada. As páginas
regionais continuam existindo e indexáveis.

O que mudou foi texto dentro de páginas que continuam nos mesmos endereços.

## 37. Existe canibalização identificada?

Há sobreposição conhecida e deliberada entre `/spitz-alemao`, `/pomeranian`,
`/lulu-da-pomerania` e `/filhotes`. Não é acidente: são os quatro nomes pelos
quais a mesma raça é buscada no Brasil, e cada página trata do termo por que a
pessoa chegou.

O que impede a canibalização virar problema é a diferença de intenção —
`/filhotes` é a vitrine, as outras três são páginas de raça — e o `canonical`
próprio de cada uma, verificado. **Não foi resolvida por consolidação nesta
rodada**, e essa é uma escolha, não um esquecimento: fundir páginas de raça é
decisão de arquitetura com risco real de perda de posição, e o §145 manda não
atrasar a estabilização por isso.

## 38. O blog cita fontes concorrentes?

Não. As fontes declaradas nos 30 posts são exclusivamente institucionais:

| Fonte | Citações |
|---|---|
| `wsava.org` | 21 |
| `avsab.org` | 19 |
| `fci.be` | 16 |
| `cbkc.org` | 11 |
| `ofa.org` | 7 |
| `akc.org` | 1 |

Zero canil concorrente, zero marketplace, zero blog de terceiro. E **zero link
externo no corpo dos artigos** — as fontes são declaradas como referência, não
como link que exporta autoridade.

## 39. A autoria visual bate com o JSON-LD?

Sim, por não haver autoria humana declarada em nenhum dos dois. O JSON-LD dos
posts traz `"author": {"@id": ".../#business"}` — a autoria é do canil.

Não existe byline "Por Fulano" na página, e é assim que deve ser: inventar um
autor pessoa para enfeitar E-E-A-T é exatamente o **fake author** proibido pelo
§101. O que existe é uma página de **política editorial** pública, que é a forma
honesta de responder "quem escreveu isto e com base em quê".

## 40. Recomendação veterinária insegura está bloqueada?

Não há recomendação insegura publicada. A varredura por dosagem, posologia e
nome de medicamento (`mg/kg`, `dose de`, `dosagem`, `administre`, `ivermectina`,
`dipirona`, `antibiótico`) devolve **uma** ocorrência em 30 posts, e ela remete
ao profissional: *"Consiga com seu veterinário a dosagem correta para o peso do
seu cão."* É a resposta certa.

**Mas não existe portão automático para isso**, e não vou marcar como verde o
que só foi verificado à mão hoje: `check-banned-words.mjs` cobre "laudo" e
"atestado", não cobre posologia. Fica registrado como lacuna real —
**P2, pós-deploy**. Um `grep` que reprove dosagem em conteúdo é barato de
escrever; o que não é barato é descobrir tarde que alguém publicou uma dose.

## 41. Search Generative AI está disponível?

**BLOQUEADO POR HUMANO.** É recurso do Search Console, e o Search Console deste
site não tem credencial configurada aqui (`GSC_NOT_CONFIGURED`). Não dá para
responder de fora do painel, e não vou inventar o estado de um relatório que não
consigo abrir.

## 42. As Platform Properties estão documentadas?

**BLOQUEADO POR HUMANO**, mesma razão da 41.

O que **está** feito e é o pré-requisito delas: os agentes de IA estão
explicitamente liberados no `robots.txt` (pergunta 21), o conteúdo é citável, e
`/llms.txt` existe.

## 43. Preferred Sources está disponível?

**BLOQUEADO POR HUMANO**, mesma razão. Além disso, Preferred Sources depende de
elegibilidade que o Google concede — não é chave que se ative.

## 44. Que credencial humana continua pendente?

Nenhuma delas é técnica. Todas exigem alguém logado num painel:

1. **`GOOGLE_ADS_ID` e `GOOGLE_ADS_WHATSAPP_LABEL`** — o código lê os dois; sem
   eles a conversão de WhatsApp não chega ao Ads. **Não invento ID nem label.**
2. **`GOOGLE_SEARCH_CONSOLE_SITE_URL` e `GOOGLE_SERVICE_ACCOUNT_KEY`** — sem
   isso, perguntas 41 a 43 ficam sem resposta e o Indexing API fica inerte.
3. **`MEDIA_LIKE_SECRET`** — sem ele as curtidas ficam *fail-closed*, que é o
   comportamento correto para um segredo ausente.
4. **Secret scanning, push protection e Dependabot alerts** — o repositório é
   **público**; ligar isso é um clique e está descrito em
   `GITHUB_SECURITY_SETUP.md`.
5. **Proteção do branch `main`** — documentada, não configurada. **Não invento
   token de API para mexer em configuração de repositório.**
6. **Garantia: 90 dias × 72 horas × cobertura hereditária vitalícia** — três
   regras que se contradizem entre site e contrato. Decisão comercial e
   jurídica, não minha.
7. **Retenção de backup e PITR do Supabase** — precisa ser lido no painel;
   `DISASTER_RECOVERY.md` tem a linha esperando o número.

## 45. Algum secret histórico precisa de rotação?

Não. A rotação foi **concluída pelo usuário em 20/08/2026** e está encerrada.
Nenhum valor de segredo aparece neste documento, em nenhum arquivo do
repositório, nem em log — só nomes de variável.

## 46. A produção corresponde ao HEAD?

**Neste momento, não** — e é assim que tem de ser. O site no ar ainda serve o
commit anterior (`c72cb69`, *"fechar as lacunas pós-deploy"*), porque o §120
manda **um commit e um deploy**, no fim, e esta rodada ainda não publicou.

Depois do deploy único desta rodada, a correspondência passa a valer e é
verificável por `npm run production:seo-watch` mais o smoke de produção dos
§§110–113. **Não marco como verde antes de a publicação existir.**

## 47. Todos os testes passaram?

Sim, depois de três reprovações reais que valem mais do que o verde final:

| Portão | Resultado |
|---|---|
| `typecheck` | ✅ |
| `test` (vitest) | ✅ 408 testes, 3 pulados |
| `check:encoding` | ✅ |
| `check:banned-words` | ✅ |
| `catalog:audit` | ✅ |
| `showcase:audit` | ✅ Nenhuma falha crítica |
| `lint` | ✅ 0 erro, 1149 avisos |
| `build` | ✅ exit 0 |
| `seo:audit` | ✅ 85/85, 0 erro, 29 avisos |
| `route:validate` | ✅ 18 rotas, 0 erro |
| `cache:verify` | ✅ 12 mídias, 3 avisos locais |
| Playwright smoke | ✅ 15/15 |
| Falha-fechada (porta morta) | ✅ exit 1 nos três auditores |

As três reprovações do caminho:

1. **`tests/unit/rotas-de-escrita.test.ts`** acusou
   `app/api/blog/comments/route.ts` como rota de escrita sem controle. A rota
   **tem** controle; o que quebrou foi o teste. A lista de guardas casava com a
   string `in-memory rate limiter`, que era um **comentário** — e a
   documentação de antiabuso do §134 reescreveu esse comentário em português.
   Corrigido na causa certa: a lista passou a casar `checkRate\(`, identificador
   de código. Comentário não é guarda, e uma lista que aprova rota pelo texto
   que alguém escreveu nela aprovaria também uma rota aberta com o comentário
   colado.
2. **Lint** com 1 erro de ordem de import (pergunta 32).
3. **`tests/e2e/home.spec.ts` no projeto `mobile-chrome`.** A asserção exigia
   `<nav aria-label="Navegação principal">` **visível** em qualquer largura, mas
   esse nav é `hidden` abaixo de `lg` (1024px) — no Pixel 5 a navegação é o
   botão que abre o menu. Era markup de desktop cobrado de um celular: o teste
   reprovava sem que nada estivesse quebrado e, ao mesmo tempo, não encostava no
   caminho que o visitante de celular usa de verdade. Agora cada largura é
   verificada pelo que existe nela, e no mobile o menu é **aberto**, com o
   primeiro link conferido. Se o botão parar de abrir o menu, isso passa a
   reprovar — o portão ficou mais rigoroso.

## 48. Qual commit foi publicado?

Branch `chore/next16-react19-node24`, commit único desta rodada, com o assunto
`feat: vitrine evergreen, portoes reais de auditoria e blindagem do repositorio`.

O hash não está escrito aqui pelo mesmo motivo registrado na rodada anterior: um
commit não pode conter o próprio hash, porque o hash é calculado a partir do
conteúdo e este arquivo faz parte do conteúdo. Registrar um número já vencido
seria pior do que não registrar nenhum. O par **assunto + branch** identifica o
commit sem ambiguidade, e o hash aparece no `git log` e no painel do Netlify.

**Um único commit, um único deploy. Nenhum deploy intermediário em nenhum
momento desta rodada.**

---

# MASTER 3.1 — COMPOUNDING & PROTECTION (§144)

Complemento do Master 3.0, na mesma rodada e no mesmo commit. **Nenhum deploy
adicional foi feito por causa deste bloco.**

A ordem do §145 foi seguida à risca: **primeiro estabilidade, depois coleta de
dados, depois otimização.** O que entrou agora é o que é simples e sem risco —
monitor, Dependabot, CodeQL, documentação. O que depende de painel externo, de
migração no banco de produção ou de decisão comercial está marcado como
pendência **com o motivo**, e não foi improvisado só para o relatório fechar
verde.

## 1. Existe monitor contínuo de produção?

Sim: `npm run production:seo-watch` (`scripts/seo-watch.ts`), agendado por
`.github/workflows/seo-watch.yml` para rodar **uma vez por dia**, às 09:10 UTC
(06:10 em Brasília) — depois de um deploy da noite anterior ter estabilizado, e
cedo o bastante para dar o dia inteiro de margem antes do próximo rastreamento.
Tem também botão manual (`workflow_dispatch`).

Ele lê uma **lista curta e versionada** de URLs críticas
(`URLS_CRITICAS` em `scripts/lib/seo-checks.ts`, 13 endereços: home, vitrine,
três fichas de cor, página de preço, blog, dois artigos, sobre, contato,
`robots.txt` e `sitemap-index.xml`) com as **mesmas regras** do
`npm run seo:audit`. Não constrói, não publica, não altera nada. Rodada boa não
gera e-mail, não gera issue, não gera notificação.

## 2. Ele falha quando o site está inacessível?

Sim, e essa é a propriedade central. Verificado nesta rodada contra uma porta
morta: `production:seo-watch` sai com **exit 1**.

Zero URL verificada é **erro**, nunca aprovação. Um monitor que devolve verde
porque não conseguiu falar com o servidor é pior do que monitor nenhum: ele
transforma silêncio em garantia. Está escrito no cabeçalho do workflow com
essas palavras.

## 3. Ele alerta sobre `canonical` ou `noindex` inesperado?

Sim. O `seo-watch` chama `auditarPagina()` com `noSitemap: true` — o nome é
português ("**no** sitemap" = "**neste** sitemap"), e o efeito é que um
`noindex` numa URL crítica vira **erro**, não aviso. Canonical apontando para
host diferente do canônico também reprova, via `hostCanonico`.

São exatamente as duas falhas silenciosas que mais custam tráfego: um `noindex`
que sobrou de um teste e um canonical apontando para outro domínio. Nenhuma das
duas aparece no log de deploy — aparece na queda de impressões três semanas
depois.

## 4. O Dependabot está configurado?

Sim, `.github/dependabot.yml`, com freio de mão puxado:

- **npm** e **github-actions**, ambos **semanais** (segunda, 09:00
  America/Sao_Paulo). Diário vira ruído e passa a ser fechado sem ler.
- Limite de **5** PRs abertos para npm e **3** para actions. Fila curta é fila
  que alguém termina.
- **Major ignorado** para `next`, `react`, `react-dom`, `eslint-config-next`,
  `@types/node` e `tailwindcss`. Este projeto acabou de migrar para Next 16 /
  React 19 / Node 24 à mão, com ajuste de `proxy.ts`, de tipagem e de build.
  Isso é trabalho de rodada planejada, não de merge de bot.
- **Nenhum auto-merge configurado, em lugar nenhum.** Todo PR daqui é lido por
  uma pessoa.

## 5. Secret scanning e push protection estão ativos?

**BLOQUEADO POR HUMANO.** Os dois se ligam no painel do GitHub, não em arquivo
versionado — não existe jeito de configurá-los por commit.

O que existe é `GITHUB_SECURITY_SETUP.md`, com o passo a passo: secret scanning,
push protection, Dependabot alerts, CodeQL e proteção de branch. **Nenhum valor
de segredo aparece nesse documento** — só nome de variável e onde ela mora.

Isso importa mais aqui do que na média: **o repositório é público**. Push
protection é a diferença entre uma chave colada por engano ser barrada no push e
ser barrada depois de já estar no histórico de um repositório que qualquer um
clona.

## 6. O CodeQL está disponível e ativo?

Sim: `.github/workflows/codeql.yml`, rodando em `push` e `pull_request` para
`main` e numa varredura semanal (segunda, junto do ritmo do Dependabot).

Ele é gratuito **porque o repositório é público**. O arquivo registra a
consequência disso: se um dia o repositório virar privado sem plano que inclua
Advanced Security, o job passa a falhar por falta de licença, e a decisão certa
nesse cenário é **remover o arquivo**, não deixar um job vermelho permanente.
Portão que vive vermelho deixa de ser lido — e o §127 é explícito: um recurso
pago indisponível não pode virar refém do site.

O que o CodeQL pega e o ESLint não pega é **caminho de dado**: um valor que
entra por `request` e vai parar numa query, num `eval` ou num redirect. É a
família de defeito que mais importa neste projeto, que tem rota pública gravando
no banco (comentário de blog), rota montando URL de WhatsApp com texto vindo da
página, e um painel atrás de cookie assinada.

## 7. A `main` está protegida?

**BLOQUEADO POR HUMANO — documentação apenas.** Está descrito em
`GITHUB_SECURITY_SETUP.md`: exigir PR, exigir o check `Qualidade e build` verde,
bloquear force-push.

**Não inventei token de API para configurar isso.** Proteção de branch se muda
com credencial de administrador do repositório, e fabricar uma para fechar um
item de checklist seria o oposto do que o item existe para garantir.

## 8. Dá para medir receita por landing orgânica?

**Não hoje, e não vou fingir que sim.**

O que existe: `leads` tem `utm_source`, `utm_medium` e `source` (preenchido com
`utm_source` ou `site_org`), com índice em `utm_source`.
`src/lib/attribution.ts` captura first-touch e last-touch —
`utm_source/medium/campaign/content/term` mais `landing_page` — em
`localStorage`, e envia junto aos eventos GA4.

O que falta, e por que ficou de fora:

1. **`landing_page` não existe como coluna em `leads`.** Ligá-la exige migração
   no banco de produção, e o §120 manda migração **somente se necessária**. Não
   é necessária para publicar esta rodada.
2. **Receita exige venda real.** O §129 é categórico: *venda só depois de venda
   real*. O site não sabe quando um filhote foi vendido — quem sabe é o
   atendimento. Sem alguém registrando a venda, qualquer número de "receita por
   landing" seria invenção com aparência de dashboard.

Fica como **P2, pós-deploy**, na ordem certa: primeiro a coluna e o registro
manual da venda, depois o relatório. Relatório antes do dado é gráfico bonito
sobre nada.

## 9. Dá para distinguir orgânico, CPC e GBP?

Sim, na origem: `utm_source` e `utm_medium` chegam e são gravados, e o
`source` cai em `site_org` quando não há UTM — que é a assinatura do tráfego
orgânico direto.

Verificado em produção que os parâmetros **chegam à landing**:
`/filhotes?utm_source=google&utm_medium=cpc&gclid=TESTE123` responde **200**, sem
redirect, sem perder a query.

E verificado que eles **não vazam para o índice** (§132, §141): o `canonical`
dessa mesma URL é `https://byimperiodog.com.br/filhotes`, limpo. Nenhum
`<loc>` de nenhum dos cinco sitemaps contém `?`, `utm_` ou `gclid` — contagem
zero nos cinco. UTM de GBP não cria página duplicada indexável.

O que falta para virar **relatório** é o mesmo da pergunta 8.

## 10. Existe processo legítimo de solicitação de avaliações?

**Não existe documento, e este é o item que eu deliberadamente não improvisei.**

O §133 lista o que é proibido — desconto, brinde, dinheiro, prêmio, pedir 5
estrelas, pedir conteúdo específico, abordar só cliente satisfeito, bloquear
avaliação negativa, negociar remoção. É uma lista de coisas que um texto
apressado faz sem perceber, e escrever um processo de avaliação sem falar com
quem atende o cliente é a forma mais provável de produzir exatamente uma delas.

**P2, pós-deploy.** Duas garantias que já valem, independentemente do documento:

- **Nenhuma avaliação foi gerada, preenchida ou fabricada** nesta rodada nem em
  nenhuma anterior. Não há `Review` nem `AggregateRating` inventado em JSON-LD.
- Curtida no site **não** é convertida em avaliação. São coisas diferentes e
  continuam diferentes.

## 11. O GBP está documentado conforme o tipo de negócio?

**Não existe documento — P2, pós-deploy.** E há uma restrição que vale desde já,
documento ou não:

**Nunca publicar endereço residencial.** O canil opera com base em Bragança
Paulista, SP, e o site publica a cidade, não a rua. Não existe `streetAddress`,
`postalCode` nem `geo` inventados em nenhum JSON-LD — verificado. **Nenhuma
filial virtual, nenhuma presença local fabricada.**

Um negócio que atende por agendamento não é o mesmo tipo de ficha que uma loja
com vitrine na rua, e tratar um como o outro é o caminho mais rápido para uma
suspensão de perfil. Por isso o documento precisa ser escrito com quem conhece a
operação, não deduzido daqui.

## 12. Os comentários têm proteção antiabuso adequada?

Sim, em camadas, e o arquivo é **honesto sobre o que cada camada vale**
(`app/api/blog/comments/route.ts`):

1. **Moderação humana** — nasce `approved: false`, e o `GET` só devolve
   aprovado. É a defesa real: nada que chegue ali aparece no site sem alguém
   ler.
2. **Texto escapado** — o corpo é renderizado como texto em JSX, nunca com
   `dangerouslySetInnerHTML`.
3. **Limite de corpo** — `corpoJson` corta antes de desserializar.
4. **Isca e relógio** — campo fora da tela que só robô preenche, e tempo mínimo
   entre abrir a página e enviar. Barram o robô preguiçoso, que é a maioria.
5. **Enxurrada por artigo** — contagem **no banco**, 20 comentários em 10
   minutos no mesmo post. É a única contagem durável do arquivo, então vale
   igual em qualquer instância serverless.

E o que **não** vale, escrito no próprio arquivo em vez de escondido: o `Map` em
memória do processo. Na Netlify cada instância tem o seu, instâncias nascem e
morrem por requisição, e uma rajada distribuída cai em processos diferentes que
não se enxergam. **Ele não é limite global, e quem for calcular risco não pode
contá-lo como se fosse.** Fica porque numa instância quente ainda corta
repetição boba — não porque protege.

O limite global por IP exigiria guardar IP (ou hash) com carimbo de tempo:
coluna nova ou tabela nova, ou seja, migração em produção. Está registrado como
pendência em `GITHUB_SECURITY_SETUP.md` e **não entra numa rodada que não deve
mexer no schema**.

`tests/unit/rotas-de-escrita.test.ts` varre as 111 rotas de escrita de
`app/api` e reprova qualquer `POST`/`PUT`/`PATCH`/`DELETE` sem nenhum controle.
Nesta rodada ele **reprovou** — e a história está na pergunta 47 do §117: a
falha era do teste, que casava com um **comentário** em vez de com código.
Corrigido na causa. Comentário não é guarda.

## 13. Um comentário pode gerar backlink?

**Não, e não por configuração — por estrutura.**

`src/components/blog/Comments.tsx` renderiza `{comment.body}` como nó de texto
React. Não há `dangerouslySetInnerHTML`, não há campo de URL do autor, não há
`<a>` em lugar nenhum do card, e o texto **não é auto-linkado**. Um link colado
num comentário aparece como texto escrito.

Por isso **não** foi adicionado `rel="ugc"`: não existe link ao qual aplicar o
atributo. Adicionar o atributo a links inexistentes seria maquiar o relatório —
e, pior, sugeriria que o mecanismo de defesa é o `rel`, quando o mecanismo real
é não haver link. Se um dia o comentário passar a renderizar link, `rel="ugc"`
entra junto, no mesmo commit.

**Este site não é fábrica de backlink**, nem para fora nem para dentro: os 30
artigos não têm um único link externo no corpo (§117, pergunta 38).

## 14. Os direitos das imagens principais são conhecidos?

**BLOQUEADO POR HUMANO.** As fotos e vídeos de `public/filhotes/` e
`public/clientes/` são, pelo que se sabe, produção do próprio canil — mas
"pelo que se sabe" não é procedência documentada, e não existe registro escrito
dizendo quem fotografou o quê e sob qual autorização.

Isso importa em dois pontos concretos: as fotos de clientes envolvem pessoas
reais, e o §136 exige registro de direitos **comprovado**, não presumido.

Quem pode preencher isso é quem contratou ou tirou as fotos. **P2, pós-deploy.**

## 15. Os metadados de direitos de imagem só aparecem quando comprovados?

Sim — e a forma como isso é verdade hoje é a mais simples possível:
**`ImageObject` com `license`, `acquireLicensePage`, `creditText` ou
`copyrightNotice` não é emitido em lugar nenhum.**

Existem nós `ImageObject` no grafo, mas eles carregam URL e dimensão, não
declaração de licença. É o comportamento correto enquanto a pergunta 14 estiver
aberta: **inventar uma licença ou um fotógrafo em dado estruturado é declarar
falsamente a titularidade de uma obra**, e o Google trata metadado de direitos
como afirmação, não como enfeite. Campo ausente é honesto; campo preenchido no
chute não é.

## 16. Existe plano próprio de histórico do Search Console?

**Não, e é o item de menor urgência do bloco inteiro.**

O Search Console guarda 16 meses. Um armazém próprio serve para comparar
ano contra ano depois que esses 16 meses viram limite — o que só passa a doer
mais adiante. Enquanto isso, montar um pipeline de dados exige a credencial do
GSC, que é a mesma pendência das perguntas 41 a 43 do §117.

Duas regras já ficam registradas para quando for feito:

- **Nunca armazenar PII** no armazém. Consulta de busca e URL, não pessoa.
- **Dado histórico não serve para gerar página automaticamente** (§139). Ver que
  "spitz preto preço" cresceu é insumo para alguém escrever melhor, não gatilho
  para uma página nascer sozinha — esse é o caminho direto para conteúdo em
  massa e página-porta, proibidos pelo §101.

O §145 é explícito: **não atrasar a rodada por BigQuery ou armazém.** **P3.**

## 17. Os filtros podem gerar espaço de rastreamento infinito?

Não. Foi o item que exigiu mais verificação, e o resultado é bom por
construção:

- **A vitrine `/filhotes` não usa `useSearchParams` nem escreve na URL.**
  Nenhum arquivo de `app/(public)` importa `useSearchParams`. O filtro do
  catálogo é estado de UI, exatamente o que o §140 recomenda.
- **O blog aceita `?q=`, `?categoria=` e `?sort=`, mas só por `replaceState`** —
  reescrita de barra de endereço, que não cria link para o Googlebot seguir. As
  URLs continuam compartilháveis e, sem JavaScript, abrem a listagem completa em
  vez de erro.
- **O canonical mata a combinação de qualquer jeito**: verificado em produção,
  `/blog?q=spitz&categoria=saude` declara canonical
  `https://byimperiodog.com.br/blog`.
- **Nenhum sitemap contém URL com query.** Contagem zero de `?` dentro de
  `<loc>` nos cinco arquivos.

Não há, portanto, como a combinação de filtros virar espaço de rastreamento:
elas não são linkadas, não são declaradas e não são canônicas.

## 18. Existe plano de recuperação de desastre?

Sim: `DISASTER_RECOVERY.md`, escrito para ser lido **durante** o problema —
passo numerado, na ordem, sem procurar nada. Cobre rollback de deploy pelo
Netlify (que repõe uma saída pronta, sem gastar crédito de build), restauração
do banco na ordem certa (**parar a escrita antes**), procedimento de migração
destrutiva e verificação depois de restaurar.

Três coisas que ele registra e que valem repetir:

- **Nenhum backup de dado entra no Git.** `supabase/migrations/` guarda
  estrutura: 13 arquivos, **zero** `INSERT` e zero `COPY`, e é para continuar
  assim. Dump de `leads`, `contracts` ou `blog_comments` num repositório
  **público** é vazamento, mesmo em branch antiga, mesmo apagado depois.
- **Backup manual imediatamente antes de qualquer migração destrutiva.** Backup
  de ontem não serve: o que se perde é o que entrou hoje.
- **`supabase db reset` nunca é apontado para produção** — nem "para testar",
  nem "só para ver se as migrações estão certas".

Duas pendências humanas ficaram marcadas dentro do próprio arquivo, com a linha
esperando o dado: a **retenção de backup e o PITR** precisam ser lidos no painel
do Supabase, e o **ensaio de restauração** precisa acontecer pelo menos uma vez.

Sobre o ensaio (§143): o procedimento escrito manda criar um **segundo projeto
Supabase**, restaurar nele, testar com o site rodando localmente e **apagar o
projeto de teste no fim** — porque um projeto esquecido com dado pessoal real
restaurado é o mesmo problema de segurança, só que sem ninguém olhando.
**Restauração destrutiva em produção "para testar" não é opção**, e a tabela de
ensaios está honesta: *nunca executado*.

## 19. Algum relatório contém segredo ou PII?

Não. Nem este documento, nem `GITHUB_SECURITY_SETUP.md`, nem
`DISASTER_RECOVERY.md`, nem qualquer log gerado nesta rodada.

O que aparece são **nomes de variável** (`GOOGLE_ADS_ID`,
`MEDIA_LIKE_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) e identificadores públicos de
projeto — nunca valores. Nenhum nome, e-mail, telefone ou endereço de cliente
foi escrito em nenhum arquivo do repositório.

A rotação de chaves foi **concluída pelo usuário em 20/08/2026** e está
encerrada. Nenhuma escrita chegou ao banco de produção em nenhum momento desta
auditoria.

## 20. Algum item foi inventado para dar verde?

Não. E a evidência de que a resposta é confiável não é esta frase — são as
reprovações que ficaram registradas em vez de serem contornadas:

| O que reprovou | O que **não** foi feito | O que foi feito |
|---|---|---|
| `seo:audit` com 66 erros | afrouxar a regra | corrigir 62 textos de estoque e 4 de `claim:laudo` |
| Playwright, `robots.txt` | relaxar a asserção | reescrever por grupo `User-Agent`, ficando **mais** rigoroso |
| `rotas-de-escrita.test.ts` | adicionar exceção para a rota | corrigir a lista de guardas, que casava com um comentário |
| Lint, 1 erro de `import/order` | voltar o `continue-on-error` | reordenar o import |

E o que ficou explicitamente **sem** verde, porque não dá para verificar daqui
ou porque não é decisão minha: perguntas 5, 7, 8, 10, 11, 14 e 16 deste bloco, e
41 a 44 do §117.

Itens que **não** foram implementados e o motivo, na ordem do §145:

| Item | Estado | Por quê |
|---|---|---|
| §130 `/admin/organic-revenue` | não existe | depende do §129, que depende de venda real registrada |
| §131 documento de GBP | não existe | precisa de quem conhece a operação; risco de presença local fabricada |
| §133 processo de avaliações | não existe | lista longa de proibições; improvisar produz exatamente uma delas |
| §136/§137 registro de direitos de imagem | não existe | licença não se presume |
| §138 armazém do GSC | não existe | precisa da credencial do GSC; §145 manda não atrasar por isso |
| Portão automático de posologia | não existe | lacuna real, registrada como P2 |

**Nenhum deles foi marcado como pronto. Nenhum deles atrasou a rodada.** É essa
a ordem que o §145 pede — primeiro estabilidade, depois coleta de dados, depois
otimização — e é o motivo de esta lista existir em vez de sumir.

---

# Reverificação final — build novo, servidor novo, auditorias refeitas

As três últimas alterações de código desta rodada (o teste de rotas de escrita,
a ordem de import em `ColorPageContent.tsx` e a remoção de
`src/lib/blog.breadcrumbs.ts`) entraram **depois** da última bateria verde.
Resultado medido sobre HTML de um build antigo não vale, então tudo foi refeito
do zero: `npm run build`, servidor de produção local reiniciado e auditores
apontados para ele.

| Portão | Resultado sobre o build novo |
|---|---|
| `npm run build` (com todo o `prebuild`) | ✅ exit 0 |
| `seo:audit` | ✅ 85 URLs coletadas, 85 auditadas, 85 responderam, **0 erro**, 29 avisos |
| `route:validate` | ✅ 18 de 18 rotas responderam, 0 erro, 0 aviso |
| `cache:verify` | ✅ 12 mídias coerentes |
| `showcase:audit` | ✅ 12 entradas, 103 mídias, 405 arquivos — nenhuma falha crítica |
| `catalog:audit` | ✅ nenhuma falha crítica |
| Playwright — portão do CI | ✅ 15/15 (`smoke.spec.ts --project=chromium`) |
| Playwright — suíte local completa | ✅ 66/66 (chromium + mobile-chrome) |
| `production:seo-watch` contra o servidor vivo | ✅ 13/13 URLs críticas |
| `production:seo-watch` contra porta morta | ✅ **exit 1** — zero URL verificada é erro |

Conferido de novo sobre o HTML novo, não sobre configuração:

- `Product` **0**, `InStock` **0**, `FAQPage` **0**, `LocalBusiness` **1** em `/`,
  `/filhotes`, `/filhotes/spitz-alemao-anao-preto-macho`, `/preco-spitz-anao` e
  `/blog`.
- Canonical continua limpando parâmetro: `/blog?q=spitz&categoria=saude` →
  `https://byimperiodog.com.br/blog`; `/filhotes?utm_source=google&utm_medium=cpc&gclid=TESTE123`
  → `https://byimperiodog.com.br/filhotes`, com a landing respondendo **200 sem
  redirect**.
- Os cinco sitemaps somam 129 `<loc>` e **zero** com query, `utm_` ou `gclid`.

## Limite conhecido do ambiente — Firefox e WebKit

`playwright.config.ts` declara quatro projetos (chromium, firefox, webkit,
mobile-chrome), mas **os binários do Firefox e do WebKit não estão instalados
nesta máquina**. Rodar a suíte inteira aqui devolve exit 1 com
`browserType.launch: Executable doesn't exist` — falha de ambiente, não de
código: nenhum `expect` chegou a ser avaliado nesses dois.

Isso não afeta o portão: o CI roda
`npx playwright test tests/e2e/smoke.spec.ts --project=chromium`, e só esse
passo bloqueia o merge. O que dá para rodar aqui — chromium e mobile-chrome —
está **66/66**.

Registrado em vez de silenciado porque "73 passaram" com exit 1 é exatamente o
tipo de resultado que alguém lê rápido e arquiva como verde.

## Achado aberto — páginas evergreen sem imagem renderizada (P2)

Dos 29 avisos do `seo:audit`, **26 são `imagem:ausente`**: a página não tem
`<img>` nem `<source srcset>` no HTML servido. Vale separar em três grupos,
porque só um deles é problema:

1. **Páginas de texto** — `/politica-de-privacidade`, `/termos-de-uso`,
   `/politica-editorial`, `/contato`, `/faq-do-tutor`. Não precisam de foto.
   Aviso correto e sem ação.
2. **`/galeria`** — é galeria de **vídeo**: 4 `<video>` com `poster`. A imagem
   existe (é a capa do vídeo), só não é `<img>`. Falso positivo da regra, que
   procura `<img>` e `<source srcset>`. Não mexi no auditor: alargar a regra
   agora deixaria o portão mais permissivo para ganhar um verde cosmético, e a
   regra hoje erra para o lado seguro.
3. **As 20 páginas evergreen de captação e conteúdo** — `/spitz-alemao`,
   `/spitz-alemao-preto`, `/spitz-alemao-baby-face`, `/lulu-da-pomerania`,
   `/pomeranian`, `/filhote-de-spitz-alemao`, `/comprar-spitz-anao`,
   `/criador-spitz-confiavel`, `/canil-spitz-alemao-interior-sp`,
   `/lulu-da-pomerania-braganca-paulista`, `/preco-spitz-anao`,
   `/reserve-seu-filhote`, `/ninhadas`, `/guias` e os seis guias.
   **Nenhuma delas importa `next/image`. São 100% texto.**

O grupo 3 é o achado de verdade, e ele contradiz em parte a tese do §121: um
site que quer ser **biblioteca visual** tem hoje suas páginas de maior intenção
comercial sem uma única foto no HTML. As consequências são concretas:

- Essas URLs não têm superfície no Google Imagens, que para "spitz alemão anão
  preto" é um caminho de entrada tão real quanto a busca por texto.
- `primaryImageOfPage` não tem o que apontar ali (pergunta 23), e por isso está
  corretamente ausente — o dado estruturado está honesto, o que falta é a foto.
- `/filhotes` (10 `<img>`) e a home (16) mostram que o padrão visual existe no
  projeto; ele só não chegou nessas páginas.

**Não corrigi nesta rodada, de propósito.** Escolher qual foto representa cada
uma dessas 20 páginas é decisão de conteúdo, não de refactor, e o §145 é
explícito: antes deste deploy, só o que é simples e sem risco. Espalhar imagens
por 20 páginas mexe em layout, em LCP e em peso de página — é rodada própria,
com medição de Core Web Vitals antes e depois.

Fica como **P2, pós-deploy**, e com uma regra que já vale: as fotos usadas têm
de sair da mesma biblioteca real do canil que abastece `/filhotes`. Nada de
banco de imagens, nada de foto de outro canil, nada de imagem gerada — o §101
proíbe fonte falsa, e uma foto de spitz que não é um spitz daqui é exatamente
isso.
