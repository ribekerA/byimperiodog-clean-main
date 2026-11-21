# Auditoria SEO completa — byimperiodog.com.br

Data: 17/11/2026 · Ferramenta: plugin Claude SEO v2.6.2 (14 agentes) · Tipo de negócio: criador local híbrido (Bragança Paulista-SP, atende o Brasil) com vitrine de filhotes e blog.

## Nota geral: 72/100

| Categoria | Peso | Nota | Fonte |
|---|---|---|---|
| SEO técnico | 22% | 90 | technical, sitemap (88) |
| Qualidade do conteúdo | 23% | 60 | content |
| On-page (títulos, intenção, links internos) | 20% | 66 | sxo (64), cluster, google |
| Dados estruturados | 10% | 80 | schema |
| Desempenho (laboratório) | 10% | 65 | performance |
| Prontidão para busca por IA | 10% | 72 | geo (69), agentic |
| Imagens | 5% | 78 | ecommerce, performance |

Outras notas: SEO local 71, vitrine de filhotes 74, visual/celular 80. Backlinks sem nota (só fontes gratuitas, dados insuficientes).

## O que os dados reais do Google mostram

- Search Console, 28 dias até 14/11: **675 cliques, 77 mil impressões, CTR 0,88%, posição média 5,9**. Nos três blocos de 30 dias, os cliques foram 355 → 524 → 711. O site está crescendo.
- O gargalo é o **CTR**. O cluster de preço aparece no topo e quase ninguém clica:
  - `/blog/preco-spitz-alemao-anao`: 12,7 mil impressões, CTR 0,26%, posição 5,5.
  - "spitz alemão valor": posição 3,4 e 1 clique.
  - "lulu da pomerania preto": posição 1,4 e 0 cliques em 653 impressões.
- As 9 URLs inspecionadas estão indexadas, e o Google escolheu o mesmo canonical declarado.
- GA4 orgânico: 299 sessões em 28 dias. É menos da metade dos cliques do GSC, porque só conta quem aceita cookies.
- Não houve core update no período, só os spam updates de agosto e setembro, sem dano visível.

## Ponto que corrige a memória do projeto

O FAQPage **voltou em 17/11/2026 por decisão do responsável** (commit 0730602). Os agentes receberam a regra antiga, "sem FAQPage", e alguns sinalizaram o conflito. O único problema real são os comentários antigos que ainda dizem "removido em 26/08" (`src/lib/schema.ts:6`, `src/lib/structured-data.ts:238`, `src/components/sections/HomeFAQ.tsx:10`).

## Achados por categoria

O detalhe e as evidências de cada categoria estão em `findings/*.md`. Abaixo, o essencial.

### Técnico (90)
- Sem itens Critical ou High. Na amostra de 30 URLs, o canonical aponta para a própria página e o robots é index. Os redirecionamentos levam ao apex em um só salto, os cabeçalhos de segurança estão completos e as páginas são pré-renderizadas.
- Médio: o HSTS não tem `includeSubDomains`/`preload`.
  - Quatro sitemaps vazios (`authors`, `categories`, `puppies`, `tags`) respondem 200.
  - Os 31 posts aparecem em dois sitemaps.
  - A página 404 emite duas metas de robots.

### Sitemap (88)
- As 96 URLs respondem 200, sem noindex, com canonical para si mesmas e com lastmod.
- Os lastmod de hoje batem com commits reais, ou seja, não é o horário do build. Mas mudanças no layout compartilhado (banner, cache) mexem em dezenas de rotas de uma vez.
- 21 a 26 posts ainda estão com a data de reserva `2025-06-01`.

### Conteúdo (60)
- **High:**
  - Três páginas dão quantidades de ração diferentes para o mesmo cão de 3 kg: 100–130 g, 80–100 g e 40–80 g.
  - A home diz "Cada cor tem o seu valor de partida" (`src/components/sections/ColorGallery.tsx:66`), enquanto `/filhotes` diz que a cor não muda o valor.
  - As páginas de SP, MG e RJ são quase duplicadas (78% de texto igual), e o H1 tem o erro "Pomerânia)em".
- **Médio:**
  - O post de apartamento é assinado por Arthur Ribeker mas fala com voz de "criadora".
  - Frases sem respaldo nos fatos confirmados: "família Imperio", "primeira ninhada com registro oficial", "única raça".
  - A newsletter promete um "guia exclusivo do 1.º ano" que não é enviado.
  - 24 dos 31 posts não trazem experiência própria.
- **Baixo:** 115 frases dizem só "Spitz", sem "Lulu da Pomerânia". As piores são outros-animais (24), apartamento (14) e exercícios (10). Fotos da pasta wolf-sable ilustram 3 posts.

### On-page, intenção e clusters (66)
- **Canibalização:** em 9 a 11 temas, um `/guias/*` e um `/blog/*` (às vezes também uma landing) disputam a mesma busca. São custo mensal, alimentação, Lulu vs Spitz, primeiros dias, cor preta, escolher canil, Bragança, guia geral e creme/branco.
- **Bug:** `/temperamento` tem título de temperamento, mas o conteúdo e o canonical são do guia de nomes. `/cuidados` e `/alimentacao` são páginas 200 com o canonical apontando para outra página.
- **Tipo de página errado (SXO):**
  - Para "spitz alemão anão", o Google mostra enciclopédia, e o alvo hoje é a home, que vende.
  - Para "filhote de lulu da pomerânia", o Google mostra guia de crescimento, e o alvo hoje é `/filhotes`, com 298 palavras.
- **Links internos:** em todo o texto dos 31 posts há só um link de post para post.
- **Cauda:** `/pomeranian` tem 2,8 mil impressões e 0 cliques, e `/spitz-alemao` está na posição 15.

### Dados estruturados (80)
- Há um LocalBusiness global coerente com as decisões do dono: só a cidade, 8h–22h, fundação em 2013, `sameAs` com YouTube e Maps. Nenhuma nota inventada.
- **Médio:**
  - `/contato` tem um segundo Organization sem `@id` e com outro formato de telefone.
  - O LocalBusiness tem `makesOffer` com Offer sem preço, e o `priceRange` está como "4.500 – 6.500", sendo que 6.500 é piso, não teto.
  - O BlogPosting em `/blog` tem imagem com URL relativa e não tem autor.
- **Baixo:**
  - Os autores não têm `@id`.
  - O `dateModified` é igual ao `datePublished`.
  - O TikTok aparece como `@byimperiodogs`, com "s"; falta confirmar que existe.

### Desempenho, laboratório no celular (65)
- Notas Lighthouse 61 a 69. O LCP vai de 3,3 a 4,4 s, o TBT de 640 a 1.070 ms, e o CLS é 0.
- A causa é JavaScript e hidratação na thread principal: a imagem fica pronta de 0,6 a 1,5 s antes de aparecer. O culpado não é a descoberta da imagem nem o tamanho dela.
- O TTFB varia de 45 ms (edge quente) a 1,4 s, porque o cache da edge dura cerca de 217 s e o `max-age` é 0.
- A home pré-carrega mais de 8 imagens decorativas, que competem com a imagem do LCP.
- Não há dados de campo (sem chave de PSI/CrUX). Comparação justa só por volta de 04/12/2026.

### Busca por IA (72)
- Todos os robôs de IA têm acesso, o texto está no HTML e o `llms.txt` é válido.
- Faltam:
  - página de autor ou do criador (`/autores` dá 404);
  - vídeo nas páginas principais (o canal tem 68 vídeos, mas nenhum está embutido);
  - data atualizada nos guias, que ainda marcam 2025-05-01.
- `content/guides/index.ts:192` diz que o nome Lulu cobre todos os tamanhos do Spitz, o que contradiz a própria página. Há também duas afirmações sem fonte (linha 179 e "documentalmente idênticos").
- Decisão sua: o `llms.txt` lista o artigo Wolf Sable com o título dele.

### Local (71)
- O NAP é idêntico no JSON-LD, no HTML e nos 34 links de WhatsApp. Não existem páginas de cidade vazias.
- Não verificado, porque o Maps é JavaScript: categoria, nota, número de avaliações e horário do Perfil da Empresa. Isso precisa ser conferido à mão.
- Domínios antigos:
  - `canillulupomerania.com.br` não existe mais (NXDOMAIN).
  - `canilspitzalemao.com.br` está registrado, mas não serve nada. Se ainda for seu, dá para redirecionar.

### Vitrine de filhotes (74)
- Os filtros não geram URL nova (sem risco de duplicação). As páginas de filhote são permanentes e não usam 410, o que está certo.
- High: 10 das 12 descrições usam a mesma frase-modelo, e os pares branco-fêmea e laranja-fêmea são quase iguais.
- Médio:
  - As páginas Wolf Sable e `/filhotes/cor/wolf-sable` estão indexáveis e mostram R$ 8.500 / R$ 6.500. Decisão sua.
  - `/filhotes` não linka as páginas de cor e de sexo.
- Seis JPGs passam de 400 KB.

### Visual e celular (80)
- Não há rolagem horizontal, o H1 aparece na primeira tela e o preço aparece na primeira tela da home e das páginas de filhote.
- Médio:
  - No celular, a home, `/filhotes` e o post não mostram botão de WhatsApp na primeira tela, e `/filhotes` não tem a bolha.
  - O banner de cookies ocupa 154 px (19% da tela).
- Baixo: alvos de toque menores que 44 px (chips, pontos da galeria, migalhas, checkbox).
- A faixa de horário (commit 5fbf93a) ainda não aparecia no site no momento da auditoria. O HTML servido era de 13:52 e o commit é de 14:16, então deve ser atraso do deploy ou do cache.

### Prontidão para agentes
- Não há P0. A árvore de acessibilidade da home está limpa e os agentes de IA recebem 200.
- A fração do Lighthouse Agentic não pôde ser medida: o PSI devolveu 429 por falta de chave. O resto é opcional.

### Backlinks (sem nota)
- O site está no Common Crawl, mas abaixo do limiar de ranking: é pequeno, não penalizado.
- Comparar com concorrentes exige uma chave gratuita da Moz.

## Limites desta auditoria
- Sem chave de PageSpeed/CrUX: o desempenho é só de laboratório, com 1 execução por página.
- As buscas dos agentes rodaram a partir dos EUA, não do Google Brasil, então a sobreposição de SERP é aproximada. Não houve volume de palavras-chave.
- Perfil da Empresa no Google, avaliações e respostas ao vivo de ChatGPT, Perplexity e Gemini não foram verificados.
- Nada foi alterado no código do site.
