# Auditoria de UI/UX — byimperiodog.com.br (17/11/2026)

**Base:** site ao vivo (sem os commits `a155653` e `ad65a43`, que ainda não foram publicados). Capturas com Playwright em celular (390×844) e desktop (1366×800) de: home, /filhotes, página de filhote, /contato, /preco-spitz-anao, /filhotes/sao-paulo, /blog e /sobre. Medidas tiradas do DOM renderizado.

**Descartado:** na captura de página inteira, a home do celular mostrou ~6.000 px verdes vazios depois das avaliações. Rolando de verdade, as seções aparecem. A causa é o `content-visibility: auto` nas capturas, não um defeito.

---

## 1. Resumo executivo: os 4 problemas que mais custam conversão

| # | Problema | Onde | Impacto no negócio |
|---|---|---|---|
| 1 | **Em /filhotes no desktop, o primeiro filhote começa em y = 1.140 px**, abaixo da dobra de 800 px. A primeira tela é só a foto do hero. | /filhotes | É a página de destino dos anúncios. Quem chega procurando filhote não vê nenhum sem rolar e pode voltar ao Google. |
| 2 | **A vitrine da home no celular tem ~7.000 px (12 cartões grandes)** antes das garantias, das avaliações (4,9 ★, 35) e do CTA final. | Home, celular | A prova social e os diferenciais ficam onde pouca gente chega; a decisão é tomada sem eles. |
| 3 | **O botão flutuante do WhatsApp cobre conteúdo**: o texto do cartão "Transporte orientado", títulos de cartões em /filhotes e o canto do banner de cookies. Ele também repete o "Conversar agora" do cabeçalho. | Todas as páginas, celular | Texto cortado passa descuido, e o toque cai no WhatsApp quando a pessoa queria tocar no cartão. |
| 4 | **O banner de cookies cobre os cartões de preço no desktop** (cerca de 100 px sobre "Machos/Fêmeas a partir de"). No celular a correção para até 110 px já está no `a155653`, mas ainda não foi publicada. | Primeira tela, todas as páginas | O preço é a informação mais procurada, e o banner o esconde na primeira visita. |

---

## 2. Análise pelos 7 níveis

### Nível 1: clareza imediata (0–5 s)
- **Home: bom.** O H1 "Canil Spitz Alemão Anão (Lulu da Pomerânia)" é texto real sobre a foto, os quatro filhotes dizem a raça na hora e o preço "a partir de … no PIX" já aparece na primeira tela. Em 5 segundos dá para entender o produto e o preço.
- **Home: falta uma ação principal na primeira tela.** No desktop, os únicos alvos na dobra são os dois cartões de preço. Eles são botões de filtro, não links, e não dizem o que fazem. O único CTA explícito é "Conversar agora", no cabeçalho.
- **/filhotes:** o título "Spitz Alemão Anão (Lulu da Pomerânia) / Beleza, carinho e companheirismo em um só pet" é bonito, mas não diz "filhotes disponíveis". A primeira tela não mostra nenhum filhote (problema 1).
- **/contato:** o H1 "Fala comigo diretamente 💬" e o subtítulo "Fale diretamente…" repetem a mesma ideia e trocam a pessoa do verbo. O emoji no H1 também vai para o título lido pelo leitor de tela.

### Nível 2: usabilidade (heurísticas de Nielsen)
- **Consistência e padrões (#4):** os filtros de cor são pílulas escuras douradas na home e chips brancos em /filhotes, e o hero de cada página tem um estilo diferente. O visitante reaprende a interface a cada página.
- **Visibilidade de estado (#1):** os cartões de preço da home funcionam como filtro, mas nada mostra isso antes do toque. Sem um rótulo como "Ver machos →", o estado selecionado aparece, mas a affordance não.
- **Flexibilidade e eficiência (#7):** o cabeçalho é `position: absolute`. Depois da primeira rolagem não há menu nem CTA fixos, só o botão flutuante. Para quem rola a vitrine longa, a única saída é o WhatsApp.
- **Rotas:** `/preco-spitz-anao` mostra o mesmo título e o mesmo conteúdo de `/filhotes`. Se for intencional (alias), tudo bem; se a página de preço deveria ser outra, quem clica num link "preço" cai na vitrine sem a explicação de preço.

### Nível 3: estética e hierarquia (Refactoring UI)
- **Alvos de toque abaixo de 44 px:**
  - Filtros de cor da home: 28 px visíveis. O `::after` estende a área de toque para cerca de 36 px no celular, o que ainda fica abaixo de 44.
  - Pontos da galeria na página de filhote: 24 px de largura.
  - "Saiba mais" do banner: 17 px de altura.
  - "Blog" no rodapé: 28 px de largura.
- **Texto abaixo de 13 px (celular):**

  | Página | Elementos |
  |---|---|
  | /blog | 121 |
  | /sobre | 41 |
  | /filhotes | 30 |
  | Página de filhote | 28 |

  No blog é leitura longa, e 12 px em fundo escuro cansa.
- **Pontos fortes:**
  - Paleta verde-escuro e dourado coerente com "premium"
  - Tipografia display serifada no título, sem serifa no corpo
  - Nenhum estouro horizontal em nenhuma página medida

### Nível 4: psicologia cognitiva
- **Lei de Hick:** oito filtros de cor e mais dois cartões de sexo dão 10 escolhas antes do primeiro filhote, no celular em duas linhas. Para quem ainda não decidiu cor, "Todos" já resolve; os demais podiam ficar num "Filtrar por cor ▾" recolhido.
- **Efeito de posição serial:** o que se lembra é o primeiro e o último. Hoje a primeira tela é preço (bom), mas o fim da página é o rodapé depois de 16.000 px. As avaliações (o argumento mais forte) ficam no meio, onde pouco se retém.
- **Lei de Fitts:** o "Ver disponibilidade" na página do filhote é grande e bem posicionado. Já os pontos da galeria de 24 px pedem precisão.

### Nível 5: fluxo e momentum
- O caminho principal funciona: home → filhote → "Ver disponibilidade" → WhatsApp. Na página de filhote o bloco de preço é claro (R$ 6.500 no PIX, reserva de R$ 3.250 = 50%).
- **Ponto de abandono:** /filhotes no desktop (problema 1) e o meio da vitrine no celular (problema 2).
- **Becos sem saída:** nenhum encontrado. Toda página tem o WhatsApp.

### Nível 6: emoção e confiança
- **Bons sinais:**
  - Avaliações do Google em destaque (4,9/5, 35 avaliações, com link para o Google)
  - Faixa "Atendimento todos os dias, das 8h às 22h · Visitas com horário agendado · Bragança Paulista/SP"
  - Cartões de garantia (registro, saúde, socialização, mentoria, transporte)
  - Desde 2013
- **Ruído:**
  - O emoji e o tom de chat em /contato contrastam com o tom premium do resto do site.
  - "Escolha o seu novo companheiro hoje mesmo!" soa como urgência genérica de varejo. O site ganha mais com a calma de "conforme a disponibilidade".
- **Momento de decisão:** na página do filhote, a prova social (avaliações) não aparece perto do preço e do CTA. Uma linha "4,9 ★ no Google · 35 avaliações" logo abaixo do botão reforça a confiança onde ela é decidida.

### Nível 7: métricas de negócio
- **Conversão que conta no Ads:** clique no WhatsApp (o formulário quase não converte, ver a memória de 11/11). Todo ajuste deve encurtar o caminho até o WhatsApp a partir de um filhote específico, não só o WhatsApp genérico.
- **/filhotes:** é a página paga, e é a que pior mostra o produto na primeira tela. É o maior retorno por esforço desta lista.
- **Medição:** depois dos ajustes 1 e 2, comparar no GA4 a profundidade de rolagem e o clique em cartão de filhote, em 28 dias.

---

## 3. Quick wins (alto impacto, baixo esforço)

1. **/filhotes: mostrar filhotes na primeira tela do desktop.**
   - Limite a altura do hero a `min(56vh, 520px)` em `lg:`, com a foto à direita e o texto à esquerda.
   - Meta: primeiro cartão com `top < 700 px` em 1366×800.
   - Como conferir: `document.querySelector("main a[href^='/filhotes/']").getBoundingClientRect().top` (hoje dá 1140).
2. **Botão flutuante do WhatsApp:**
   - Enquanto o banner de cookies estiver aberto, suba o botão para `bottom: calc(var(--altura-banner) + 16px)`. O banner pode expor a própria altura numa variável CSS via `ResizeObserver`.
   - Some `padding-bottom: 88px` ao `main` no celular, para o botão nunca cobrir o fim de um cartão.
3. **Filtros de cor (`app/globals.css:577`):**
   - Trocar `min-height: max(28px, …)` por `max(36px, …)`.
   - Trocar `.hm-filtro::after { inset: -4px 0 }` no `@container (max-width: 640px)` por `inset: -6px 0`.
   - Área de toque resultante: 48 px.
4. **Cartões de preço da home:** acrescentar um rótulo de ação dentro do botão, por exemplo "Ver machos →" / "Ver fêmeas →" em 14 px, para quem não sabe que são filtros.
5. **/contato (`app/(public)/contato/page.tsx:138`):**
   - H1 sugerido: "Fale com a criadora do Lulu da Pomerânia".
   - Subtítulo sugerido: "Pelo WhatsApp sobre o Lulu da Pomerânia ou, se preferir, pelo formulário abaixo."
   - O 💬 sai do H1.
6. **Galeria do filhote:** pontos de 24 px viram áreas de toque de 44×44 px, com o ponto visível de 8 px no centro (`padding` em vez de `width`).
7. **Publicar o `a155653`**, que já traz o banner de cookies de até 110 px no celular. No desktop, considerar o banner como cartão no canto inferior esquerdo (`max-width: 420px`) em vez de faixa de largura total, para não cobrir os cartões de preço.

## 4. Backlog por impacto × esforço

| Item | Impacto | Esforço | Spec |
|---|---|---|---|
| Hero de /filhotes mais baixo (quick win 1) | Alto | Baixo | Acima |
| WhatsApp flutuante sem cobrir conteúdo (quick win 2) | Alto | Baixo | Acima |
| Vitrine da home: 6 cartões no celular + "Ver todos os N filhotes" | Alto | Médio | Mostrar os 6 primeiros do filtro ativo. O botão leva a `/filhotes?cor=<filtro>`. Avaliações e garantias sobem ~3.500 px. |
| Prova social perto do CTA da página de filhote | Alto | Baixo | Linha com 5 estrelas + "4,9 no Google · 35 avaliações" abaixo de "Ver disponibilidade", link para as avaliações. |
| Filtros de cor e alvos de toque ≥ 44 px (quick wins 3 e 6) | Médio | Baixo | Acima |
| Cabeçalho fixo compacto depois da rolagem | Médio | Médio | Depois de 400 px de rolagem, mostrar barra de 56 px com logo + "Ver filhotes" + "WhatsApp". O botão flutuante sai quando ela está visível. Respeitar `prefers-reduced-motion`. |
| Unificar estilo dos filtros (home e /filhotes) | Médio | Médio | Um só componente de chip, com a versão escura na home e a clara em fundo claro, mesma altura e mesmo estado ativo. |
| Texto mínimo de 14 px no corpo (blog, sobre) | Médio | Baixo | Legendas e metadados em 13 px no mínimo; corpo do artigo em 17–18 px com `line-height: 1.65`. |
| Filtros de cor recolhidos ("Filtrar por cor ▾") no celular | Baixo | Médio | Só se a medição mostrar pouco uso dos filtros. |
| Copy "Escolha o seu novo companheiro hoje mesmo!" | Baixo | Baixo | Trocar por uma frase sem urgência, com Lulu da Pomerânia na frase. Fica para revisão de copy com o canil. |

## 5. O que não deu para avaliar
- Comportamento real de quem visita: mapas de calor e gravações de sessão. Os dados de rolagem do GA4 vão confirmar ou não os problemas 1 e 2.
- O fluxo depois do WhatsApp (conversa, reserva, contrato).
- Leitores de tela de verdade: só a estrutura do DOM foi conferida.
- O redesenho da home abortado em 06/11/2026 ficou de fora; nada aqui pede retomá-lo.
