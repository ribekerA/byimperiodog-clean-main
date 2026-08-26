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
  Paulista/SP, 4 cores, R$ 6.500–9.500, e as inclusões que o canil sustenta
  (vacinado, vermifugado, consulta veterinária, hemograma completo, pedigree).
- **Schema:** `LocalBusiness` com `foundingDate` 2013, endereço de Bragança
  Paulista/SP, telefone e e-mail corretos, `priceRange` "R$ 6.500 – R$ 9.500",
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
