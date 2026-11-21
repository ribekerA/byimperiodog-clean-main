# SEO local — byimperiodog.com.br (17/11/2026)

Base: rastreamento das 92 URLs do sitemap ao vivo, JSON-LD de todas as páginas e dados do Search Console (20/10 a 14/11/2026).

## Nota: 62/100

| Dimensão | Peso | Nota | Comentário |
|---|---|---|---|
| Sinais do Perfil da Empresa no Google | 25% | 70 | Perfil ligado no schema (cid, kgmid, hasMap) e no rodapé ("Perfil no Google", "Avaliar no Google"); sem mapa embutido |
| Avaliações | 20% | 55 | Depoimentos no site, mas sem nota/contagem do Google visível; não dá para medir a frequência de avaliações daqui |
| SEO local na página | 20% | 60 | Cidade no rodapé, no /contato e em páginas próprias; páginas por estado com risco de doorway |
| NAP e citações | 15% | 65 | NAP do site e do schema iguais; diretórios fracos; três domínios antigos ainda indexados e mortos |
| Schema local | 10% | 75 | LocalBusiness completo, mas sem `areaServed` e sem `geo` |
| Autoridade local | 10% | 45 | CBKC 980/15 e redes sociais; nenhuma imprensa ou entidade local encontrada |

## Tipo de negócio

**Híbrido.** A visita é feita com horário agendado em Bragança Paulista/SP, a entrega é combinada para outras regiões e o endereço de rua não é público. Por isso não faz sentido cobrar endereço completo nem mapa com pino, como se faria com uma loja.

**Segmento:** criador de cães. Não há subtipo próprio no schema.org (o mais próximo seria `PetStore`, que não descreve um canil), então `LocalBusiness` é a escolha certa.

## NAP

| Fonte | Nome | Endereço | Telefone |
|---|---|---|---|
| Rodapé | By Imperio Dog ® / razão social completa no © | "Bragança Paulista, SP" | (11) 96863-3239 |
| /contato | By Imperio Dog | "Bragança Paulista, SP" | (11) 96863-3239 |
| JSON-LD `#business` | By Imperio Dog - Canil Spitz Alemão Anão Lulu da Pomerânia | Bragança Paulista, SP, BR | +55 11 96863-3239 |

Os três batem. O nome longo no schema é o nome público do Perfil? Confira no Perfil da Empresa: se lá o nome for só "By Imperio Dog", o `name` do schema deve ser igual e o resto vai em `alternateName`.

## Achados

1. **Alta: páginas por estado quase iguais.** `/filhotes/sao-paulo`, `/filhotes/minas-gerais` e `/filhotes/rio-de-janeiro` compartilham **86–88%** do texto (sequências de 5 palavras, sem cabeçalho e rodapé). É o padrão "troque o nome do estado e a página continua fazendo sentido". Hoje trazem pouco (SP 3 cliques/95 impressões, MG 2/55, RJ 0/39 em 26 dias). Opções: (a) escrever para cada estado o que é de fato diferente — distância e logística reais da entrega, perguntas que chegam de lá —, sem inventar fatos; ou (b) juntar as três numa única página "entrega do Lulu da Pomerânia pelo Brasil" com 301. Já existe `/blog/spitz-alemao-anao-entrega-brasil`, que pode ser o destino.
2. **Alta: três domínios antigos fora do ar e ainda no índice.** `canillulupomerania.com.br`, `byimperiodog.com` e `www.byimperiodog.com` não resolvem no DNS (NXDOMAIN), mas a busca ainda mostra páginas deles (ex.: "filhotes-spitz-alemao-braganca-paulista", com preços antigos). Os links que apontavam para eles se perderam. Se os domínios ainda forem seus, ou puderem ser recuperados, um 301 de todas as URLs para as equivalentes no .com.br recupera essa autoridade. Ver o relatório de backlinks.
3. **Média: nenhum link `tel:`** em nenhuma das 92 páginas. O telefone aparece como texto e o contato é sempre pelo WhatsApp. Para quem quer ligar do celular (88% das impressões), um `tel:+5511968633239` no /contato custa pouco. Se a ligação não for um canal que vocês atendem, deixe como está.
4. **Média: schema sem `areaServed`.** Como o negócio atende em Bragança Paulista e entrega fora, declarar `areaServed` (Bragança Paulista, estado de SP e Brasil) descreve isso direito para o Google e para as IAs. Pronto para usar:
   ```json
   "areaServed": [
     { "@type": "City", "name": "Bragança Paulista" },
     { "@type": "State", "name": "São Paulo" },
     { "@type": "Country", "name": "Brasil" }
   ]
   ```
5. **Baixa: sem `geo`.** Com endereço não público, coordenadas exatas entregariam o local. Se quiser, use as do centro da cidade, mas o ganho é mínimo. Recomendação: deixar sem.
6. **Baixa: sem mapa embutido.** Em negócio de visita agendada, o mapa não é necessário; o link "Perfil no Google" já cumpre o papel.

## Avaliações

O site mostra depoimentos rotativos e um link "Avaliar no Google", mas não mostra nota nem quantidade de avaliações do Google, e o schema não tem `aggregateRating`. Não acrescentar `aggregateRating` em LocalBusiness: o Google não mostra estrelas para avaliações que a própria empresa publica sobre si. O que move o ranking local é a frequência de avaliações novas no Perfil (sem intervalos de mais de 2–3 semanas) e as respostas do dono. Isso só dá para ver no painel do Perfil, não daqui.

**Não pré-filtrar** quem é convidado a avaliar (por exemplo, perguntar antes se a pessoa ficou satisfeita): o Google proíbe essa prática.

## Citações

Encontradas fora do site: Facebook, Instagram, YouTube, TikTok, Pinterest e Flickr (desde 2017). Também apareceu um diretório (findglocal) que mistura o canil com uma empresa de paisagismo de Pinhalzinho.

Não encontradas: Bing Places, Apple Maps (Apple Business Connect), guias locais de Bragança Paulista.

**Bing Places importa:** é a base do ChatGPT e do Copilot para negócios locais, e dá para importar direto do Perfil da Empresa no Google.

## 10 ações por prioridade

1. **Alta:** resolver as páginas por estado — reescrever o que muda de verdade ou juntar numa página com 301.
2. **Alta:** verificar se os domínios antigos podem ser recuperados para fazer o 301.
3. **Alta:** reivindicar o Bing Places, importando do Perfil do Google.
4. **Média:** reivindicar o Apple Business Connect.
5. **Média:** acrescentar `areaServed` ao `#business`.
6. **Média:** conferir se o nome do Perfil do Google é igual ao `name` do schema.
7. **Média:** pedir avaliação no Google a cada entrega, sempre, sem filtrar.
8. **Baixa:** `tel:` no /contato, se ligação for um canal atendido.
9. **Baixa:** pedir correção ou remoção do registro misturado no findglocal.
10. **Baixa:** buscar uma citação local real — jornal da cidade, entidade cinófila regional.

## O que esta análise não mede

- Posição no pacote local por grade geográfica.
- Dados do painel do Perfil da Empresa: categorias, fotos, perguntas, frequência de avaliações e respostas.
- Autoridade de domínio paga (Moz, Ahrefs, Semrush).

Uma grade de posições exige DataForSEO ou BrightLocal.
