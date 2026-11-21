# Content Architecture: Semantic Clustering and Hub-Spoke Plan

Site: https://byimperiodog.com.br (pt-BR). Date: 2026-11-17. Scope: planning only (no post written, no `cluster execute`).
Inputs: 31 MDX posts in `content/posts/` (read-only), the 6 `/guias/*` entries in `content/guides/index.ts`, public routes in `app/(public)/`, and the editorial map `content/search-topics.ts`.

## Method and limits (read first)

- SERP data comes from 18 WebSearch queries. That tool runs from the US and is not Google Brasil, so URL sets are noisy: classifieds, pet retailers and content farms show up. Treat overlap counts as **directional proxies**, not exact Google BR overlap.
- Overlap is the number of identical URLs in the first 10 results of each query. Thresholds: 7-10 = same post, 4-6 = same cluster, 2-3 = interlink, 0-1 = separate.
- No search-volume tool was available, so every `volume` is `null`. The pillar was picked on breadth and head-term logic, not on measured volume.
- Rules applied: no new cinza-lobo / wolf sable topic (the existing post stays as it is), no invented facts, and price wording only as "a partir de" (see memory: "A partir de R$ 4.500 no PIX").

## 1. SERP overlap matrix (URL overlap in top 10)

| Pair | Overlap | Verdict | Implication |
|---|---|---|---|
| "lulu da pomerânia" x "spitz alemão anão" | 2 | interlink | The two breed landings `/lulu-da-pomerania` and `/spitz-alemao` can coexist if they link to each other |
| "lulu da pomerânia" x "canil lulu da pomerânia" | 6 | same cluster | The "canil" SERP is mostly informational (petlove, cobasi, panorama); there is no strong kennel SERP |
| "lulu da pomerânia" x "lulu ... e spitz alemão é a mesma raça" | 5 | same cluster | The naming question sits inside the head-term cluster |
| "lulu da pomerânia" x "lulu da pomerânia cores" | 4 | same cluster | |
| "lulu da pomerânia" x "cuidados lulu da pomerânia" | 4 | same cluster | |
| "lulu da pomerânia" x "tamanho adulto peso altura" | 3 | interlink | Owner: peso-desenvolvimento (growth chart) |
| "spitz alemão anão" x "filhote lulu preço" | 3 | interlink | |
| "filhote lulu preço" x "canil lulu" | 1 | separate | |
| "filhote lulu preço" x "spitz alemão preto preço" | 3 | interlink | |
| "filhote lulu preço" x "quanto custa manter por mês" | 1 | separate | Keeping a purchase-price post and a monthly-cost post apart is correct |
| "lulu cores" x "lulu preto" | 6 | same cluster | The black-coat post is a spoke of the colours hub |
| "lulu cores" x "lulu laranja filhote" | 4 | same cluster | No dedicated orange post needed; colours hub plus `/filhotes/cor/laranja` cover it |
| "lulu preto" x "spitz alemão preto preço" | 2 | interlink | Informational and transactional intents split: blog = coat/genetics, landing = price |
| "mesma raça" x "pomeranian é lulu" | 3 | interlink | `/pomeranian` can keep "pomeranian"; the two "mesma raça" pages cannot both exist |
| "cuidados lulu" x "tosa lulu tipos" | 4 | same cluster | Tosa can be its own spoke (not 7+, so no merge into the coat post) |
| "cuidados lulu" x "fase do patinho feio / queda de pelo" | 2 | interlink | Separate spoke |
| "tosa tipos" x "patinho feio" | 1 | separate | |
| "tosa tipos" x "mini micro tipo ursinho" | 5 | same cluster | "ursinho" is a tosa query; keep "ursinho" out of the mini/micro post's primary keyword |
| "cuidados lulu" x "doenças traqueia patela" | 1 | separate | Disease deep-dives are separate posts |
| "alimentação ração quantidade" x any other | 0 | separate | The SERP is product listings (Royal Canin, Premier), so it is near-transactional |

## 2. Cannibalization check (existing URLs)

There are 10 conflicts. Most come from the same pattern: a `/guias/*` page, a `/blog/*` post and sometimes a landing page all target one query.

| # | Severity | URLs competing for the same SERP | Evidence | Recommendation (decision is the user's) |
|---|---|---|---|---|
| C1 | HIGH | `/blog/quanto-custa-manter-spitz-alemao` vs `/guias/quanto-custa-ter-spitz-alemao-anao` | Same intent, near-identical titles ("Quanto Custa Manter/Ter ... por Mês"). search-topics already names the guide as owner and the blog post as support | Pick one owner. Suggested: the blog post (deeper, has sources), 301 the guide to it, and update `search-topics.ts` `custo-mensal.href` |
| C2 | HIGH | `/blog/alimentacao-spitz-alemao-anao` vs `/guias/spitz-alemao-anao-alimentacao` (+ `/alimentacao`, canonical to the guide) | Same title pattern "Alimentação do Spitz Alemão Anão (Lulu da Pomerânia): Guia Completo" | Merge into one URL. `/alimentacao` already canonicalizes to the guide, so either keep the guide and 301 the blog post, or the reverse plus a canonical change |
| C3 | HIGH | `/blog/lulu-pomerania-ou-spitz-alemao` vs `/guias/spitz-alemao-anao-vs-lulu-pomerania` | Identical question ("São o mesmo cão?" / "Entenda de uma vez") | Merge into one URL. `/pomeranian` can stay (overlap 3) as the "pomeranian" page |
| C3b | HIGH (bug) | `/temperamento` has the title "Temperamento do Spitz..." but renders the naming guide body and canonicalizes to `/guias/spitz-alemao-anao-vs-lulu-pomerania` | `app/(public)/temperamento/page.tsx` lines 11-19 | The title signal points at temperament while the canonical points at the naming guide. The temperament owner is `/blog/spitz-alemao-anao-temperamento`. Suggest a 301 from `/temperamento` to the blog post |
| C4 | HIGH | `/blog/spitz-alemao-anao-filhote-primeiros-dias` vs `/guias/preparando-chegada-filhote-spitz` vs `/filhote-de-spitz-alemao` | Three pages on "receber/primeiros dias do filhote" | Blog post owns "primeiros dias filhote"; the guide owns "enxoval" only, or is merged; `/filhote-de-spitz-alemao` owns "filhote de spitz alemão" (commercial, choosing the puppy) |
| C5 | HIGH | `/blog/spitz-alemao-anao-preto` (title "...Preto (Lulu da Pomerânia): Preço") vs `/spitz-alemao-preto` ("Preto — Preço e Filhotes") vs `/filhotes/cor/preto` | Both editorial pages put "Preço" in the title; SERP shows info vs price intent split (overlap 2) | Remove "Preço" from the blog title and retarget it to "lulu da pomerânia preto" (genetics, coat, care). `/spitz-alemao-preto` keeps "spitz alemão preto preço" |
| C6 | MED | `/blog/como-escolher-canil-spitz-alemao` vs `/criador-spitz-confiavel` vs `/guias/como-escolher-spitz-alemao-anao` | All "como escolher criador/canil confiável" | Blog post = "como escolher canil" (red flags / golpe). `/criador-spitz-confiavel` = brand proof. Guide = choosing the puppy (temperament, sex), with no canil wording |
| C7 | MED | `/blog/spitz-alemao-anao-braganca-paulista` ("Canil de ... em Bragança Paulista") vs `/lulu-da-pomerania-braganca-paulista` vs `/canil-spitz-alemao-interior-sp` | Three local pages on one city/region | Landing `/lulu-da-pomerania-braganca-paulista` owns the city query. The blog post should be de-optimized or merged into it; `/canil-spitz-alemao-interior-sp` keeps "interior SP" |
| C8 | MED | `/blog/guia-spitz-alemao` ("Guia Definitivo") vs `/spitz-alemao` (OG "Tudo Sobre a Raça") vs `/lulu-da-pomerania` (OG "Guia Completo da Raça") vs `/guias/cuidados-basicos-spitz-alemao-anao` (owner of "cuidados lulu" in search-topics) | Head term covered by four pages | See section 3: `/lulu-da-pomerania` = head-term pillar; `/blog/guia-spitz-alemao` = tutor-care pillar ("cuidados lulu da pomerânia"); `/guias/cuidados-basicos...` merged into it |
| C9 | MED | `/blog/spitz-alemao-anao-creme` vs `/filhotes/cor/creme` vs `/spitz-alemao-branco` ("Branco ou Creme") | Creme appears in three titles | Blog = coat genetics and care of light coats; `/filhotes/cor/creme` = listing; `/spitz-alemao-branco` should drop "ou Creme" from its title |
| C10 | LOW | `/blog/preco-spitz-alemao-anao` vs `/blog/cores-spitz-alemao-anao-qual-mais-cara` | Both have "como comparar preços por cor" and "o que está incluso no preço" sections; the cores title is a price question | Keep both. Cores post owns "cores lulu da pomerânia", with "qual a mais cara" as secondary; replace its duplicated "incluso no preço" section with a link to the price post |

Not a conflict: `/blog/spitz-alemao-anao-macho-ou-femea` vs `/filhotes/sexo/*` (one informational, one listing). `/preco-spitz-anao` already 308s to `/filhotes`.

## 3. Architecture: two hubs

The 31 posts plus landings exceed the limits for a single pillar (2-5 clusters, 2-4 posts each, max 20 spokes). The plan therefore uses two hubs that link to each other.

### HUB A: Raça e compra. Pillar `/lulu-da-pomerania` (kw "lulu da pomerânia", template ultimate-guide; existing landing page)
Co-pillar `/spitz-alemao` (kw "spitz alemão anão"). The two pillars must link to each other (overlap 2, so they stay separate pages).

| Cluster | Posts (kw / template / status) |
|---|---|
| A1 Nome e tipo da raça | `/blog/lulu-pomerania-ou-spitz-alemao` (lulu e spitz alemão é a mesma raça / explainer / written; merge target for C3) · `/blog/spitz-alemao-anao-vs-pinscher-chihuahua` (spitz vs pinscher vs chihuahua / comparison / written) · `/spitz-alemao-baby-face` (spitz baby face / explainer / written landing) · **NEW** "Lulu da Pomerânia mini, micro ou teacup existe?" (kw "lulu da pomerânia mini" / explainer / planned) |
| A2 Cores | `/blog/cores-spitz-alemao-anao-qual-mais-cara` (lulu da pomerânia cores / listicle / written; colour hub) · `/blog/spitz-alemao-anao-creme` (spitz alemão creme / explainer / written) · `/blog/spitz-alemao-anao-preto` (lulu da pomerânia preto / explainer / written; retitle per C5) · `/blog/spitz-alemao-anao-wolf-sable` (existing only; no new wolf-sable content) |
| A3 Preço e compra | `/blog/preco-spitz-alemao-anao` (filhote lulu da pomerânia preço / explainer, "a partir de" only / written) · `/blog/quanto-custa-manter-spitz-alemao` (quanto custa manter lulu por mês / how-to / written) · `/blog/documentacao-registro-spitz-alemao` (registro pedigree spitz alemão / explainer / written) · `/blog/spitz-alemao-anao-macho-ou-femea` (spitz macho ou fêmea / comparison / written) |
| A4 Canil e entrega | `/blog/como-escolher-canil-spitz-alemao` (canil lulu da pomerânia confiável / listicle / written) · `/blog/spitz-alemao-anao-braganca-paulista` (see C7) · `/blog/spitz-alemao-anao-entrega-brasil` (spitz alemão entrega brasil / how-to / written) |

Conversion targets (not spokes, linked from spokes): `/filhotes`, `/filhotes/cor/*`, `/filhotes/sexo/*`, `/criador-spitz-confiavel`, `/comprar-spitz-anao`, `/reserve-seu-filhote`, `/lulu-da-pomerania-braganca-paulista`.

### HUB B: Tutor e cuidados. Pillar `/blog/guia-spitz-alemao` (retarget to kw "cuidados lulu da pomerânia" / "guia do tutor", template ultimate-guide; written, roughly 1,300 words today, so it must grow to 2,500+ to reach pillar spec)

| Cluster | Posts |
|---|---|
| B1 Pelagem e higiene | `/blog/cuidados-pelo-spitz-alemao-anao` (escovação e banho lulu / how-to) · `/blog/spitz-alemao-anao-dentes` (dentes lulu / how-to) · **NEW** "Tosa do Lulu da Pomerânia: tipos, tosa ursinho/Boo e riscos" (kw "tosa lulu da pomerânia" / listicle) · **NEW** "Fase do patinho feio: a troca de pelagem do filhote" (kw "lulu da pomerânia fase do patinho feio" / explainer) |
| B2 Saúde e crescimento | `/blog/saude-spitz-alemao-anao` (doenças lulu da pomerânia / listicle) · `/blog/vacinas-spitz-alemao-anao-filhote` (vacinas lulu filhote / how-to) · `/blog/spitz-alemao-anao-peso-desenvolvimento` (tamanho e peso lulu adulto / explainer; also owns "tabela de crescimento") · **NEW** "Colapso de traqueia no Lulu da Pomerânia" (kw "colapso de traqueia lulu da pomerânia" / explainer; needs vet review) |
| B3 Filhote em casa | `/blog/spitz-alemao-anao-filhote-primeiros-dias` (primeiros dias filhote lulu / how-to) · `/blog/alimentacao-spitz-alemao-anao` (alimentação lulu / how-to; see C2) · `/blog/nomes-lulu-da-pomerania` (nomes para lulu / listicle) · `/blog/spitz-alemao-anao-exercicios-passeios` (exercícios lulu / how-to) |
| B4 Comportamento e treino | `/blog/spitz-alemao-anao-temperamento` (temperamento lulu / explainer) · `/blog/spitz-alemao-anao-latido` (lulu late muito / how-to) · `/blog/adestramento-spitz-alemao-anao` (adestramento lulu / how-to) · `/blog/spitz-alemao-anao-ansiedade-separacao` (ansiedade de separação lulu / how-to) |
| B5 Combina com sua rotina? | `/blog/spitz-alemao-anao-bom-para-apartamento` (lulu é bom para apartamento / explainer) · `/blog/spitz-alemao-anao-com-criancas` (lulu com crianças / explainer) · `/blog/spitz-alemao-anao-outros-animais` (lulu com gatos e cães / how-to) · `/blog/spitz-alemao-anao-idoso-adulto-solo` (lulu para idosos / explainer) |

Counts: Hub A has 15 spokes (14 existing, 1 new). Hub B has 20 spokes (17 existing, 3 new). All 31 posts are mapped, and every cluster has 3-4 posts.

## 4. Internal link matrix (current gap)

**Current state:** in the bodies of all 31 posts there is exactly **one** blog-to-blog contextual link (`cores-...-qual-mais-cara` -> `spitz-alemao-anao-wolf-sable`). `/blog/guia-spitz-alemao` links to no spoke at all. Navigation comes only from template asides (`getRelatedUnified`, plus `relatedSearchTopics` from `search-topics.ts`). Those asides are not contextual body links, and only 3 topics are shown. In practice every mandatory link below is missing.

Rules applied: pillar to every spoke and every spoke to its pillar (mandatory); 2-3 sibling links per spoke (recommended); at most 1 cross-cluster link (optional). With that, every spoke receives at least 3 contextual incoming links, and no page is orphaned.

```
MANDATORY (bidirectional)
/lulu-da-pomerania <-> /spitz-alemao
/lulu-da-pomerania <-> /blog/guia-spitz-alemao
/lulu-da-pomerania <-> each Hub A spoke (15)
/blog/guia-spitz-alemao <-> each Hub B spoke (20)

RECOMMENDED (sibling, within cluster)
A1: lulu-pomerania-ou-spitz-alemao <-> vs-pinscher-chihuahua <-> /spitz-alemao-baby-face <-> [NEW mini-micro] (each -> 2-3 siblings)
A2: cores-qual-mais-cara <-> spitz-alemao-anao-creme <-> spitz-alemao-anao-preto ; cores -> wolf-sable (exists) ; wolf-sable -> cores
A3: preco-spitz-alemao-anao <-> quanto-custa-manter-spitz-alemao ; preco <-> documentacao-registro-spitz-alemao ; preco <-> spitz-alemao-anao-macho-ou-femea ; documentacao <-> macho-ou-femea
A4: como-escolher-canil-spitz-alemao <-> spitz-alemao-anao-braganca-paulista <-> spitz-alemao-anao-entrega-brasil
B1: cuidados-pelo <-> spitz-alemao-anao-dentes ; cuidados-pelo <-> [NEW tosa] <-> [NEW patinho-feio] ; patinho-feio -> cuidados-pelo
B2: saude <-> vacinas <-> peso-desenvolvimento ; saude <-> [NEW colapso-traqueia]
B3: filhote-primeiros-dias <-> alimentacao <-> exercicios-passeios ; primeiros-dias <-> nomes
B4: temperamento <-> latido <-> adestramento <-> ansiedade-separacao
B5: bom-para-apartamento <-> com-criancas <-> outros-animais <-> idoso-adulto-solo

OPTIONAL (cross-cluster, 0-1 per post)
latido -> bom-para-apartamento ; ansiedade-separacao -> idoso-adulto-solo
alimentacao -> quanto-custa-manter ; vacinas -> filhote-primeiros-dias
cores-qual-mais-cara -> preco-spitz-alemao-anao ; macho-ou-femea -> temperamento
peso-desenvolvimento -> [NEW mini-micro] ; [NEW colapso-traqueia] -> exercicios-passeios (peitoral x coleira)
como-escolher-canil -> documentacao-registro ; entrega-brasil -> filhote-primeiros-dias
```

Anchor diversity: on each target, vary the anchors between "Lulu da Pomerânia ..." and "Spitz Alemão Anão ...", keeping any single anchor under 40%. This also fits the "Lulu da Pomerânia em toda frase" rule.

## 5. Top 5 content gaps (no new wolf-sable topic)

1. **Tosa do Lulu da Pomerânia** (tipos: higiênica, filhote/ursinho, Boo; risco de alopecia pós-tosa). The SERP has dedicated pages from petz and petlove. Today this sits only as an H2 in `cuidados-pelo`. Cluster B1. Overlap with "cuidados" is 4, so it works as a separate spoke.
2. **Fase do patinho feio / troca de pelagem do filhote** (4-12 meses, quando é normal, quando procurar o veterinário). Today it gets one paragraph in the guia and an H2 ("Período de Muda") in cuidados-pelo. Overlap with tosa is 1 and with cuidados is 2, so it is its own SERP. Cluster B1.
3. **"Lulu da Pomerânia mini / micro / teacup existe?"** This is buyer protection: the terms are not official, according to the American Pomeranian Club source in the SERP. Today it is only a section ("Denominações Enganosas") in lulu-ou-spitz. Keep "ursinho" out of its keyword, because that term belongs to tosa (overlap 5). Cluster A1.
4. **Colapso de traqueia no Lulu da Pomerânia** (sinais, peitoral x coleira, quando ir ao vet). Today it is an H3 in saude. The SERP has academic sources and dedicated pages. Cluster B2. Needs veterinary review and sources.
5. **Luxação de patela no Lulu da Pomerânia** (backlog). It has the same profile as #4, but B2 is already at 4 posts. Adding it needs a split of B2 into "Saúde preventiva" (vacinas, peso) and "Doenças da raça" (saude, traqueia, patela).

Not gaps (already covered; strengthen the owner rather than adding a post): tamanho adulto (peso-desenvolvimento), expectativa de vida (saude H2), castração (macho-ou-femea H2), cor laranja (cores hub + `/filhotes/cor/laranja`), banho (cuidados-pelo).

## 6. Pre-delivery checklist

- [x] No two planned posts share a primary keyword. This assumes C1-C9 are resolved; until then they do.
- [x] Every spoke links to its pillar and every pillar links to all its spokes (planned; currently 0 implemented)
- [x] Every spoke has at least 3 planned incoming links: pillar + 2-3 siblings (A4 has 3 posts: pillar + 2 siblings = 3)
- [x] No orphan pages in the plan
- [x] Templates match intent (explainer/how-to/listicle for informational; comparison for macho-fêmea and vs-pinscher)
- [~] Word counts: Hub B pillar `/blog/guia-spitz-alemao` is roughly 1,300 words today, below the 2,500-4,000 spec, so it needs expansion. Spokes not measured individually.
- [x] Cluster sizes: Hub A has 4 clusters and Hub B has 5, each with 3-4 posts
- [~] SERP support: most groupings are at 4-6. A1 (naming vs pinscher) and B5 rest on topical logic rather than measured overlap, because of the limited query budget and the non-BR SERP tool.

## 7. Structured data (audit-data.json, Content Architecture)

```json
{
  "category": "Content Architecture",
  "version": "2.2.5",
  "created_at": "2026-11-17",
  "seed_keywords": ["lulu da pomerânia","spitz alemão anão","filhote lulu da pomerânia preço","canil lulu da pomerânia","lulu da pomerânia cores","cuidados lulu da pomerânia"],
  "data_caveat": "SERP overlap from US-located WebSearch, not Google BR; volumes unavailable (null).",
  "hubs": [
    {
      "pillar": {"title":"Lulu da Pomerânia","keyword":"lulu da pomerânia","volume":null,"template":"ultimate-guide","url":"/lulu-da-pomerania","status":"written","co_pillar":"/spitz-alemao"},
      "clusters": [
        {"name":"A1 Nome e tipo da raça","posts":[
          {"url":"/blog/lulu-pomerania-ou-spitz-alemao","keyword":"lulu e spitz alemão é a mesma raça","template":"explainer","status":"written"},
          {"url":"/blog/spitz-alemao-anao-vs-pinscher-chihuahua","keyword":"spitz alemão vs pinscher vs chihuahua","template":"comparison","status":"written"},
          {"url":"/spitz-alemao-baby-face","keyword":"spitz alemão baby face","template":"explainer","status":"written"},
          {"url":null,"title":"Lulu da Pomerânia mini, micro ou teacup existe?","keyword":"lulu da pomerânia mini","template":"explainer","wordCount":1500,"status":"planned"}]},
        {"name":"A2 Cores","posts":[
          {"url":"/blog/cores-spitz-alemao-anao-qual-mais-cara","keyword":"lulu da pomerânia cores","template":"listicle","status":"written"},
          {"url":"/blog/spitz-alemao-anao-creme","keyword":"spitz alemão anão creme","template":"explainer","status":"written"},
          {"url":"/blog/spitz-alemao-anao-preto","keyword":"lulu da pomerânia preto","template":"explainer","status":"written","action":"retitle, drop 'Preço'"},
          {"url":"/blog/spitz-alemao-anao-wolf-sable","keyword":"(existing, frozen)","template":"explainer","status":"written","action":"no new content"}]},
        {"name":"A3 Preço e compra","posts":[
          {"url":"/blog/preco-spitz-alemao-anao","keyword":"filhote lulu da pomerânia preço","template":"explainer","status":"written","note":"price only as 'a partir de'"},
          {"url":"/blog/quanto-custa-manter-spitz-alemao","keyword":"quanto custa manter lulu da pomerânia por mês","template":"how-to","status":"written"},
          {"url":"/blog/documentacao-registro-spitz-alemao","keyword":"registro pedigree spitz alemão","template":"explainer","status":"written"},
          {"url":"/blog/spitz-alemao-anao-macho-ou-femea","keyword":"spitz alemão macho ou fêmea","template":"comparison","status":"written"}]},
        {"name":"A4 Canil e entrega","posts":[
          {"url":"/blog/como-escolher-canil-spitz-alemao","keyword":"como escolher canil lulu da pomerânia","template":"listicle","status":"written"},
          {"url":"/blog/spitz-alemao-anao-braganca-paulista","keyword":"(de-optimize; city owned by /lulu-da-pomerania-braganca-paulista)","template":"explainer","status":"written"},
          {"url":"/blog/spitz-alemao-anao-entrega-brasil","keyword":"spitz alemão entrega brasil","template":"how-to","status":"written"}]}
      ]
    },
    {
      "pillar": {"title":"Guia do tutor do Spitz Alemão Anão (Lulu da Pomerânia)","keyword":"cuidados lulu da pomerânia","volume":null,"template":"ultimate-guide","wordCount":3000,"url":"/blog/guia-spitz-alemao","status":"written","action":"expand from ~1300 words; absorb /guias/cuidados-basicos-spitz-alemao-anao"},
      "clusters": [
        {"name":"B1 Pelagem e higiene","posts":[
          {"url":"/blog/cuidados-pelo-spitz-alemao-anao","keyword":"escovação e banho lulu da pomerânia","template":"how-to","status":"written"},
          {"url":"/blog/spitz-alemao-anao-dentes","keyword":"dentes lulu da pomerânia","template":"how-to","status":"written"},
          {"url":null,"title":"Tosa do Lulu da Pomerânia","keyword":"tosa lulu da pomerânia","template":"listicle","wordCount":1500,"status":"planned"},
          {"url":null,"title":"Fase do patinho feio no Lulu da Pomerânia","keyword":"lulu da pomerânia fase do patinho feio","template":"explainer","wordCount":1300,"status":"planned"}]},
        {"name":"B2 Saúde e crescimento","posts":[
          {"url":"/blog/saude-spitz-alemao-anao","keyword":"doenças lulu da pomerânia","template":"listicle","status":"written"},
          {"url":"/blog/vacinas-spitz-alemao-anao-filhote","keyword":"vacinas lulu da pomerânia filhote","template":"how-to","status":"written"},
          {"url":"/blog/spitz-alemao-anao-peso-desenvolvimento","keyword":"tamanho lulu da pomerânia adulto","template":"explainer","status":"written"},
          {"url":null,"title":"Colapso de traqueia no Lulu da Pomerânia","keyword":"colapso de traqueia lulu da pomerânia","template":"explainer","wordCount":1500,"status":"planned","note":"vet review required"}]},
        {"name":"B3 Filhote em casa","posts":[
          {"url":"/blog/spitz-alemao-anao-filhote-primeiros-dias","keyword":"filhote lulu da pomerânia primeiros dias","template":"how-to","status":"written"},
          {"url":"/blog/alimentacao-spitz-alemao-anao","keyword":"alimentação lulu da pomerânia","template":"how-to","status":"written"},
          {"url":"/blog/nomes-lulu-da-pomerania","keyword":"nomes para lulu da pomerânia","template":"listicle","status":"written"},
          {"url":"/blog/spitz-alemao-anao-exercicios-passeios","keyword":"exercícios lulu da pomerânia","template":"how-to","status":"written"}]},
        {"name":"B4 Comportamento e treino","posts":[
          {"url":"/blog/spitz-alemao-anao-temperamento","keyword":"temperamento lulu da pomerânia","template":"explainer","status":"written"},
          {"url":"/blog/spitz-alemao-anao-latido","keyword":"lulu da pomerânia late muito","template":"how-to","status":"written"},
          {"url":"/blog/adestramento-spitz-alemao-anao","keyword":"adestramento lulu da pomerânia","template":"how-to","status":"written"},
          {"url":"/blog/spitz-alemao-anao-ansiedade-separacao","keyword":"ansiedade de separação lulu","template":"how-to","status":"written"}]},
        {"name":"B5 Combina com sua rotina?","posts":[
          {"url":"/blog/spitz-alemao-anao-bom-para-apartamento","keyword":"lulu da pomerânia apartamento","template":"explainer","status":"written"},
          {"url":"/blog/spitz-alemao-anao-com-criancas","keyword":"lulu da pomerânia com crianças","template":"explainer","status":"written"},
          {"url":"/blog/spitz-alemao-anao-outros-animais","keyword":"lulu da pomerânia com gatos","template":"how-to","status":"written"},
          {"url":"/blog/spitz-alemao-anao-idoso-adulto-solo","keyword":"lulu da pomerânia para idosos","template":"explainer","status":"written"}]}
      ]
    }
  ],
  "serp_matrix_pairs": [
    ["lulu da pomerânia","spitz alemão anão",2],["lulu da pomerânia","canil lulu da pomerânia",6],
    ["lulu da pomerânia","mesma raça",5],["lulu da pomerânia","lulu cores",4],["lulu da pomerânia","cuidados lulu",4],
    ["lulu da pomerânia","tamanho adulto",3],["spitz alemão anão","filhote lulu preço",3],["filhote lulu preço","canil lulu",1],
    ["filhote lulu preço","spitz preto preço",3],["filhote lulu preço","custo mensal",1],["lulu cores","lulu preto",6],
    ["lulu cores","lulu laranja filhote",4],["lulu preto","spitz preto preço",2],["mesma raça","pomeranian é lulu",3],
    ["cuidados lulu","tosa tipos",4],["cuidados lulu","patinho feio",2],["tosa tipos","patinho feio",1],
    ["tosa tipos","mini micro ursinho",5],["cuidados lulu","doenças traqueia patela",1],["alimentação ração","*",0]
  ],
  "cannibalization": [
    {"id":"C1","severity":"high","urls":["/blog/quanto-custa-manter-spitz-alemao","/guias/quanto-custa-ter-spitz-alemao-anao"]},
    {"id":"C2","severity":"high","urls":["/blog/alimentacao-spitz-alemao-anao","/guias/spitz-alemao-anao-alimentacao","/alimentacao"]},
    {"id":"C3","severity":"high","urls":["/blog/lulu-pomerania-ou-spitz-alemao","/guias/spitz-alemao-anao-vs-lulu-pomerania"]},
    {"id":"C3b","severity":"high","urls":["/temperamento","/guias/spitz-alemao-anao-vs-lulu-pomerania","/blog/spitz-alemao-anao-temperamento"],"note":"title/canonical mismatch"},
    {"id":"C4","severity":"high","urls":["/blog/spitz-alemao-anao-filhote-primeiros-dias","/guias/preparando-chegada-filhote-spitz","/filhote-de-spitz-alemao"]},
    {"id":"C5","severity":"high","urls":["/blog/spitz-alemao-anao-preto","/spitz-alemao-preto","/filhotes/cor/preto"]},
    {"id":"C6","severity":"medium","urls":["/blog/como-escolher-canil-spitz-alemao","/criador-spitz-confiavel","/guias/como-escolher-spitz-alemao-anao"]},
    {"id":"C7","severity":"medium","urls":["/blog/spitz-alemao-anao-braganca-paulista","/lulu-da-pomerania-braganca-paulista","/canil-spitz-alemao-interior-sp"]},
    {"id":"C8","severity":"medium","urls":["/blog/guia-spitz-alemao","/spitz-alemao","/lulu-da-pomerania","/guias/cuidados-basicos-spitz-alemao-anao"]},
    {"id":"C9","severity":"medium","urls":["/blog/spitz-alemao-anao-creme","/filhotes/cor/creme","/spitz-alemao-branco"]},
    {"id":"C10","severity":"low","urls":["/blog/preco-spitz-alemao-anao","/blog/cores-spitz-alemao-anao-qual-mais-cara"]}
  ],
  "gaps": ["tosa lulu da pomerânia","fase do patinho feio","lulu mini/micro/teacup existe","colapso de traqueia","luxação de patela (backlog)"],
  "scorecard": {"coverage":0.86,"linkDensity":0.0,"orphanPages":0,"cannibalization":11,"contentGaps":5,
    "notes":"coverage = 31 existing of 36 planned slots (31 posts + 5 gaps); cannibalization = 11 entries (C1-C10 + C3b); linkDensity ~0 = 1 contextual blog-to-blog link in 31 posts; orphans 0 only because template asides (related posts / search-topics) give every post some inbound link"}
}
```
