# Dados do Google — byimperiodog.com.br (17/11/2026)

Fonte: API do Search Console (propriedade `sc-domain:byimperiodog.com.br`), conta de serviço.
Janela: 20/10 a 14/11/2026 (o Search Console tem 2-3 dias de atraso), comparada com 22/09 a 19/10.
PageSpeed/CrUX e GA4 não rodaram: falta `api_key` e `ga4_property_id` em `~/.config/claude-seo/google-api.json`.

## Totais

| | 22/09–19/10 | 20/10–14/11 | Variação |
|---|---|---|---|
| Cliques | 485 | 675 | +39% |
| Impressões | 56.512 | 77.004 | +36% |
| CTR | 0,86% | 0,88% | = |
| Posição média | 6,4 | 5,9 | melhor |

Celular: 569 cliques, 67.708 impressões (88% das impressões). Desktop: 100 cliques.
Tendência diária: de ~20 cliques/dia no fim de outubro para ~30-40/dia em novembro; impressões de ~2.100 para ~4.300/dia.

## Achado principal: página de preço perde cliques enquanto sobe

`/blog/preco-spitz-alemao-anao`: 55 → 33 cliques, impressões 10.004 → 12.693, posição 6,5 → 5,5, CTR 0,55% → 0,26%.

| Busca | Impressões | Cliques | Posição |
|---|---|---|---|
| spitz alemão valor | 1.542 | 1 | 3,4 |
| spitz alemão preço | 1.384 | 2 | 4,7 |
| spitz alemão anão valor | 1.034 | 4 | 4,6 |
| spitz alemão anão preço | 396 | 5 | 3,3 |

Hipótese (não provada): a meta description já entrega o preço ("machos a partir de R$ 4.500 e fêmeas a partir de R$ 6.500 no PIX"), então quem só queria o número lê no Google e não clica; a Visão Geral de IA também pode estar respondendo. A queda coincide com a publicação dos preços no PIX em 06/11/2026.

## Outras buscas com muita impressão e zero clique

- "lulu da pomerania preto": 646 impressões em posição 1,3 em `/blog/spitz-alemao-anao-preto`, 0 cliques — provável bloco de imagens/IA acima do resultado.
- "anao preto" / "anão preto": ~350 impressões somadas, 0 cliques, espalhadas em 4 páginas (blog, `/spitz-alemao-preto`, dois filhotes) — sinal de canibalização.
- "lulu da pomerania ou spitz alemão" / "é a mesma coisa": 230 impressões, posição 9-10, 0 cliques.
- "lulu da pomerania em ingles": 107 impressões em `/pomeranian`, posição 4,2, 0 cliques.

## Indexação (URL Inspection)

Indexadas, canônica do Google igual à declarada: `/`, `/filhotes`, `/blog/preco-spitz-alemao-anao`, `/blog/spitz-alemao-anao-preto`, `/spitz-alemao-preto`, `/filhote-de-spitz-alemao`, `/filhotes/cor/preto`.
`www.byimperiodog.com.br/` é "Página com redirecionamento" (301 para a raiz) e o Google já escolhe a raiz como canônica; os 50 cliques atribuídos ao www são resíduo, não problema.

## Sitemap

`/sitemap.xml` enviado em 11/11/2026: 96 URLs, 0 erros, 0 avisos.
