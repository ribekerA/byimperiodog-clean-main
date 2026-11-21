# Imagens — byimperiodog.com.br (17/11/2026)

Base: 668 tags `<img>` em 92 páginas (151 arquivos diferentes), HTML do servidor.

## Nota: 88/100

| Verificação | Resultado |
|---|---|
| Atributo `alt` presente | 668/668 |
| `alt=""` | 286, todos decorativos: miniaturas de 62 px da galeria com `aria-hidden`, coroa, louros, patas, selos, estrela — correto |
| Alts descritivos | Seguem o padrão "Spitz Alemão Anão (Lulu da Pomerânia) Cor Sexo"; 24 passam de 125 caracteres |
| Formato | 381 webp, 285 jpg/jpeg servidos pelo `next/image` (convertidos para webp/avif conforme o navegador), 2 svg |
| `srcset`/`sizes` | 463 imagens pelo `next/image` com `srcset`; as 18 restantes são ornamentos pequenos ou fotos das páginas de cor |
| Dimensões | As 278 "sem width/height" são `fill` dentro de caixa com proporção fixa — não geram CLS |
| LCP | `fetchpriority="high"` em 46 páginas; a foto principal de cada filhote é a única prioritária |
| og:image | 42 diferentes; `og-default.jpg` tem 67 KB |

## Achados

1. **Média: fotos das páginas de cor fora do `next/image`.** `/filhotes/cor/branco`, `creme`, `laranja` e `preto` servem a foto principal como JPEG original, carregada de imediato: `branco-femea-jardim-01.jpg` tem **237 KB**. Pelo `next/image` o mesmo arquivo cairia para cerca de 100 KB em webp, com `srcset` para celular. É a única troca de imagem com efeito no LCP.
2. **Baixa: muitas imagens carregadas de imediato em `/blog` (55) e na home (43).** Em boa parte são ornamentos pequenos, mas vale conferir se as capas abaixo da dobra no `/blog` estão como `loading="lazy"`; o `next/image` só faz isso se `priority` não estiver ligado em todas.
3. **Baixa: alts repetidos.** Variações como "Spitz Alemão Anão (Lulu da Pomerânia) Laranja Fêmea" aparecem 10 vezes cada, porque são as várias fotos do mesmo filhote. Para a busca de imagens, um detalhe que diferencie ("no jardim", "no colo") ajuda, mas a regra de não inventar vale: só o que a foto mostra.
4. **Baixa: depoimentos com nome no alt** ("Ana Paula M.", "João"). Está certo para foto de pessoa; o nome é a descrição.

## Já está bem feito

- Alt vazio só em decoração, com `aria-hidden`.
- `sizes="62px"` nas miniaturas, sem baixar 1280 px para elas.
- Capas quadradas em webp para os cartões.
- ImageObject com largura e altura no schema dos posts e filhotes.
