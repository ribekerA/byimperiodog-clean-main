# Dados estruturados — byimperiodog.com.br (17/11/2026)

Base: todos os blocos JSON-LD das 92 URLs do sitemap ao vivo. **0 erros de sintaxe.**

## Nota: 85/100

| Tipo | Páginas | Situação |
|---|---|---|
| LocalBusiness `#business` | 92 | Completo: nome, telefone, e-mail, faixa de preço, fundação em 2013, CBKC 980/15, horário 8h–22h, 7 `sameAs` (inclui o cid do Maps e o kgmid `/g/11gpnjwc18`), `hasMap` |
| WebSite + SiteNavigationElement | 92 | OK |
| BreadcrumbList | 91 | OK |
| Article | 45 | `@id` próprio, imagem 1280×853, autor Person com `worksFor` → `#business`, publisher por `@id`, datas, citações (CBKC, FCI, WSAVA) |
| Person | 31 | Autores dos artigos |
| Organization | 29 | Só como `publisher` das citações externas (CBKC, FCI, WSAVA), não duplica o canil |
| VideoObject | 13 | Completo nas páginas da galeria |
| FAQPage | 3 | Válido, mas o Google só mostra FAQ para sites de governo e saúde desde 2023; não acrescentar mais |
| CollectionPage + ItemList | /filhotes | OK |
| WebPage + ImageObject | páginas de filhote | Sem Product/Offer, de propósito (ver abaixo) |

## Decisão a manter: sem Product nos filhotes

`src/lib/structured-data.ts` registra que `buildPuppyProductLD` saiu em 26/08/2026: tinha `availability: InStock` e preço fixo numa vitrine que não é estoque. Manter assim. Um Product com disponibilidade que não corresponde à realidade é motivo de ação manual em listagens de comerciante.

## Achados

1. **Média: `areaServed` ausente no `#business`.** O trecho pronto está no relatório local.
2. **Baixa: description do Article atrasada até o próximo deploy.** O JSON-LD de `/blog/preco-spitz-alemao-anao` ainda traz a description antiga ("machos a partir de R$ 4.500 e fêmeas a partir de R$ 6.500…"). Ela vem do mesmo MDX alterado no commit `ad65a43`, então corrige sozinha quando o push for feito. Não exige trabalho, só confirmar depois.
3. **Baixa: `name` longo no LocalBusiness.** "By Imperio Dog - Canil Spitz Alemão Anão Lulu da Pomerânia" pode diferir do nome no Perfil da Empresa. Ver o relatório local, item 6.
4. **Baixa: Person sem `sameAs`.** Os autores (Karen Cristina, Arthur Ribeker) não têm links para perfis próprios. Se houver perfis públicos que eles queiram ligar, `sameAs` reforça a autoria (E-E-A-T). Se não houver, deixe assim.

## Sem ação

- Sem `aggregateRating`: correto para avaliações próprias.
- Sem `geo` nem `streetAddress`: correto para endereço não público.
