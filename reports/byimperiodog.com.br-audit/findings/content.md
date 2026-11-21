# Content Quality / E-E-A-T: byimperiodog.com.br

Audit date: 2026-11-17. Live fetch done with render_page `--mode never`. All pages were server-rendered (`is_spa: false`), so no browser sandbox was involved. 46 live URLs were checked: home, /filhotes, 2 puppy pages, /filhotes/cor/{preto,creme,chocolate}, /filhotes/{sao-paulo,minas-gerais}, /blog plus 13 posts, /galeria plus 2 slugs, /sobre, /contato, /politica-editorial, /faq-do-tutor, 2 /guias pages and the hub/pillar pages. All 31 `content/posts/*.mdx` files were read from the source.

## Scores

| Metric | Score |
|---|---|
| **Content quality (overall)** | **60 / 100** |
| E-E-A-T, weighted | 58 / 100 |
| AI citation readiness | 66 / 100 |

| E-E-A-T factor | Weight (skill model) | Score | Basis |
|---|---|---|---|
| Experience | 20% | 48 | Real photos and videos, a gallery, and "Enquanto estão conosco..." are positives. 24 of 31 posts have no first-hand passage at all (0 matches for canil/criação/observamos phrasing). |
| Expertise | 25% | 55 | Every post has a `sources:` block (FCI 97, CBKC, WSAVA, AVSAB) and a named author. The author bio is a single generic sentence. Feeding figures contradict each other across 3 pages. |
| Authoritativeness | 25% | 55 | CBKC kennel nº 980/15, 4.9/5 from 35 Google reviews, sameAs profiles. No external mentions or citations. |
| Trustworthiness | 30% | 68 | Strong points: the editorial policy discloses AI use, price is shown up front, there is a contract and disclaimers. Weak points: a price contradiction on the home page, a gmail address, a newsletter promise that is not delivered, and unconfirmed history claims. |

(The weights are this skill's internal model. Google publishes no numeric E-E-A-T weights.)

Templated metadata (`metadata_template.py`, 37 title/description pairs): `site_risk: low`, `templated_ratio: 0.0`, `shared_cta_phrases: {}`. Secondary findings: `description_echoes_title` on /spitz-alemao-preto, /canil-spitz-alemao-interior-sp, /spitz-alemao and /spitz-alemao-baby-face. `brand_suffix_in_description` on 7 pages (low).

## Findings

### C1. HIGH: Feeding amounts contradict each other across three pages (factual accuracy, pet health)
- /blog/quanto-custa-manter-spitz-alemao: "consome aproximadamente 100–130g de ração por dia (adulto de 3kg)"
- /blog/alimentacao-spitz-alemao-anao, table: "3 kg | 80–100g". The same table has rows for 4 kg and 5 kg, which are above the 1.5–3.5 kg adult range the site states elsewhere.
- /guias/quanto-custa-ter-spitz-alemao-anao: "come entre 40 e 80g de ração por dia"
- A 3 kg dog gets three different answers, and the 100–130 g figure is roughly double the third one. This is the kind of claim an AI answer engine quotes, and conflicting figures stop it from citing any of them.
- Fix: pick one range (the guia's 40–80 g is closest to typical label guidance for small breeds) and say it is a starting point to check against the food package and the vet. Remove the 4–5 kg rows or mark them "acima do porte típico". Recompute the monthly cost in quanto-custa so it uses the same grams.

### C2. HIGH: Topic cannibalization between /blog, /guias and the pillar/landing pages
The same intent is served by 2–4 indexable URLs:
| Intent | Competing URLs |
|---|---|
| Black colour + price | /spitz-alemao-preto ("Preto — Preço e Filhotes"), /blog/spitz-alemao-anao-preto ("Preto: Genética e Preço"), /filhotes/cor/preto |
| Cream colour | /blog/spitz-alemao-anao-creme, /filhotes/cor/creme, /spitz-alemao-branco ("Branco ou Creme") |
| Kennel in Bragança | home, /lulu-da-pomerania-braganca-paulista, /canil-spitz-alemao-interior-sp, /blog/spitz-alemao-anao-braganca-paulista. The last two descriptions are nearly the same: "Especialistas desde 2013, com registro oficial..." |
| Lulu vs Spitz naming | /blog/lulu-pomerania-ou-spitz-alemao, /guias/spitz-alemao-anao-vs-lulu-pomerania, /pomeranian, /lulu-da-pomerania, /spitz-alemao |
| Choosing a breeder / buying safely | /criador-spitz-confiavel, /comprar-spitz-anao, /blog/como-escolher-canil-spitz-alemao, /guias/como-escolher-spitz-alemao-anao |
| Monthly cost | /blog/quanto-custa-manter-spitz-alemao, /guias/quanto-custa-ter-spitz-alemao-anao (and they disagree, see C1) |
| First days with a puppy | /blog/spitz-alemao-anao-filhote-primeiros-dias, /guias/preparando-chegada-filhote-spitz, /filhote-de-spitz-alemao |
| Food / coat care | /blog/alimentacao... vs /guias/spitz-alemao-anao-alimentacao. /blog/cuidados-pelo... vs /guias/cuidados-basicos... |
| Temperament | /blog/spitz-alemao-anao-temperamento vs /temperamento (see C3) |
- Fix: choose one owner URL per intent. Commercial intent (colour, kennel, price) goes to the landing or /filhotes/cor page. Informational intent goes to the blog post. Merge the overlapping /guias content into the matching blog post and 301 the guia. Change the remaining titles so they stop targeting the same query (for example, /blog/...-preto becomes care and genetics only, with no "Preço" in the title). Interlink each cluster toward the owner page. Check Search Console "Pages" per query before merging.

### C3. HIGH: /temperamento canonical points at an unrelated page
- /temperamento title: "Temperamento do Spitz Alemão Anão (Lulu da Pomerânia)". Canonical: `/guias/spitz-alemao-anao-vs-lulu-pomerania`. Description: "Como escolher ... macho x fêmea, diferenças entre cores".
- Title, description and canonical describe three different topics. Google will probably ignore the canonical and treat the page as competing with /blog/spitz-alemao-anao-temperamento.
- /cuidados and /alimentacao also return 200 with a canonical to /guias/*.
- Fix: 301 /temperamento to /blog/spitz-alemao-anao-temperamento. 301 /cuidados and /alimentacao to their /guias (or blog) targets instead of serving duplicate 200 pages.

### C4. HIGH: Home contradicts the site's own price rule
- Home colour section: "Cada cor tem o seu valor de partida." /filhotes says "A cor não muda esse valor de partida." The home FAQ says "em qualquer cor".
- The blog/preco seo_title "...: Cor e Sexo" and the post title "Cores...: Qual é a Mais Cara?" (whose answer is "Não existe uma cor mais cara") also suggest a colour-based price.
- Fix: change the ColorGallery line (src/components/sections/ColorGallery.tsx:66) to something like "O valor de partida é o mesmo em todas as cores; muda só por sexo." Change the blog/preco seo_title to "...: O Que Define o Valor". Optionally rename the cores title to "Existe Cor Mais Cara?". The price wording stays "A partir de R$ X no PIX".

### C5. HIGH: Near-duplicate location pages
- /filhotes/sao-paulo vs /filhotes/minas-gerais: 78% text similarity (SequenceMatcher). /rio-de-janeiro uses the same template. The only differences are the state name in the H1 and one sentence. This fits the doorway-page pattern.
- Fix: give each page real, state-specific information confirmed by the owner (how pickup or delivery has actually worked for that state, families served there, travel time from Bragança). Otherwise consolidate into /filhotes with a "atendemos SP, MG, RJ" section. Do not invent cities or numbers. Also fix the H1 spacing typo: "(Lulu da Pomerânia)em São Paulo".

### C6. MEDIUM: Byline does not match the text (apartment post)
- /blog/spitz-alemao-anao-bom-para-apartamento is signed by Arthur Ribeker. The text says "A Resposta Direta da Criadora", "Escrito pela criadora da By Imperio Dog" and "Fale comigo diretamente".
- Fix: either swap the author with a Karen Cristina post so alternation stays balanced (owner decision), or change "criadora" to neutral wording. Also check "Por que o Spitz..." style first-person passages in the other Arthur posts.

### C7. MEDIUM: History and identity claims that are not in the confirmed facts
- /sobre: "a família Imperio recebeu a primeira fêmea". /criador-spitz-confiavel: "Fundada em 2013 pela família Imperio". The known people are Karen Cristina and Arthur Ribeker, and "Imperio" is the brand.
- /sobre: "A primeira ninhada com registro oficial saiu da By Imperio Dog" gives no year. /filhotes/{sp,mg,rj}: "como única raça".
- The site's rule is that a fact not confirmed by the owner does not get published.
- Fix: ask the owner to confirm. Until then, change to "Fundada em 2013 em Bragança Paulista" and drop "família Imperio".

### C8. MEDIUM: Experience signals are thin. 24 of 31 posts have no first-hand content
- For example, /blog/spitz-alemao-anao-temperamento reads as generic breed copy: "está entre as raças mais inteligentes do mundo canino" (no source; /blog/adestramento repeats it).
- Fix: ask the owner for real observations (for example, how puppies are introduced to household noise, what new owners ask most in the first week, a real anonymised case). Add one "Na nossa rotina" box per post. Rewrite the "mais inteligentes" claim with a source or soften it ("aprende rápido com reforço positivo").

### C9. MEDIUM: Author bio is one sentence and there is no author page
- JSON-LD and the byline give only "Cria o Spitz Alemão Anão (Lulu da Pomerânia) desde 2013 na By Imperio Dog, com amor e carinho."
- Fix: ask the owner for real details that can be published (role in the kennel, what each person handles, a real photo if they want one). Then create /autores/karen-cristina and /autores/arthur-ribeker linked from the byline. Do not invent titles, degrees or photos.

### C10. MEDIUM: Freshness. 26 of 31 posts share the publish date 2025-06-01, and 24 were never updated
- Byline: "Arthur Ribeker · 01 de jun. de 2025". JSON-LD dateModified equals datePublished on 24 posts.
- The identical date across 26 posts looks like a bulk import. "Custo Real Atualizado" in the title of quanto-custa-manter has cost tables (R$ ranges) with no date or source for 17 months.
- Fix: review the cost, vaccine and feeding posts first. Set `updated` only when the text actually changes, then regenerate lastmod after the commit. Add "valores de referência de <mês/ano>" to the cost tables.

### C11. MEDIUM: Newsletter CTA promises a guide that does not exist
- On every post: "Receba o guia exclusivo do 1.º ano do Spitz". NewsletterSignup only replies "Inscrição registrada com sucesso". No guide is delivered.
- This is a trust problem. The sentence also has no "Lulu da Pomerânia".
- Fix: deliver a real guide or change the copy to "Receba novidades e artigos novos sobre o Lulu da Pomerânia por e-mail" (src/components/blog/BlogCTAs.tsx:65-66). The "Tutores premium" label should go.

### C12. MEDIUM: Contact e-mail is gmail while the domain address works
- /contato, footer, privacy policy and terms show "byimperiodog@gmail.com". `contato@byimperiodog.com.br` is confirmed to work.
- Fix: switch the published address (BRAND email in src/domain/config.ts, Footer, policies) to the domain address. A domain address is a basic trust signal.

### C13. MEDIUM: Thin pages
- /galeria/* pages have about 60 words each, for example /galeria/creme-dupla: "Dois filhotes ... creme juntos, mostrando de perto a pelagem clara". These depend on real video descriptions from the owner. Until then, consider `noindex` for the slugs and keep /galeria indexed.
- Puppy reference pages have about 290 words of mostly shared template (the "Incluído no valor" block is the same on all 12).
- /filhotes/cor/chocolate uses an illustration: "Ilustração da pelagem, não é foto de filhote".
- Fix: owner-supplied video descriptions; a unique paragraph per puppy page; a real photo for chocolate when one exists.
- Blog posts are 616–1,064 words, below the skill's 1,500 floor. That floor is a coverage guide, not a target. The commercial posts most worth expanding with real content are preco (650), braganca-paulista (618), creme (616) and preto (647).

### C14. LOW: Owner rule check, "Lulu da Pomerânia" in every sentence
- 115 sentences in content/posts say "Spitz" without "Lulu da Pomerânia". The content-guard only checks once per file.
- Worst files: outros-animais (24), bom-para-apartamento (14), exercicios-passeios (10), idoso-adulto-solo (9), temperamento (8), vs-pinscher (7).
- Example from /blog/spitz-alemao-anao-exercicios-passeios: "O Spitz se satisfaz com uma combinação de:"
- Fix: apply the owner's rule in those files. To limit repetition, rewrite sentences to use "ele"/"o cão" where the rule allows (a sentence with no "Spitz" needs no Lulu).

### C15. LOW: Banned colour shown in images
- No banned colour words appear in prose outside the allowed article and the approved link line.
- But images from `/filhotes/wolf-sable/` illustrate /blog/spitz-alemao-anao-macho-ou-femea, /blog/spitz-alemao-anao-temperamento and /blog/como-escolher-canil-spitz-alemao. The colour is visible even though the word is banned.
- Fix: ask the owner whether to swap these images for one of the 7 published colours.

### C16. LOW: Metadata
- 4 descriptions open by repeating the title: /spitz-alemao-preto, /canil-spitz-alemao-interior-sp, /spitz-alemao, /spitz-alemao-baby-face. Open them with the page's differentiator instead.
- /sobre, /contato and /politica-editorial have no datePublished/dateModified, so parsers fall back to 2013-01-01.

## Positives (keep)
- /politica-editorial openly discloses AI-assisted drafting plus human review. This is QRG-aligned transparency.
- Every post has a "Fontes" list linking primary sources (FCI 97, CBKC, WSAVA, AVSAB).
- Honest disclaimers ("não substitui a orientação do médico-veterinário", "a vitrine não confirma estoque"), no fake ranking claims ("desconfie de quem se anuncia como o melhor"), and transparent pricing and contract terms.
- Body-text duplication between posts is low: the highest 6-gram Jaccard is 0.042 (cores vs preco), and no H2 is shared by more than 2 posts.
- Readability: average sentence length is 8–15 words. The Flesch PT adaptation scores 37–68, average about 53 (medium). The hardest are braganca-paulista (37), saude (39) and entrega-brasil (41).

## AI citation readiness (66/100)
- Plus: FAQ blocks at the end of posts, comparison tables (peso por idade, custos), a "Fontes" list, llms.txt, a clear H2 hierarchy, and Article JSON-LD with a Person author.
- Minus: numeric facts conflict across pages (C1, C4). Duplicate URLs split authority (C2). Opening paragraphs are generic and lack a quotable definition ("Aqui está uma visão honesta e completa..."). Fix: start each post with a 40–60 word direct answer containing the key number.

## Structured findings (audit-data.json, category "Content Quality")
```json
[
 {"id":"C1","severity":"high","title":"Quantidades de ração contraditórias em 3 páginas","urls":["/blog/quanto-custa-manter-spitz-alemao","/blog/alimentacao-spitz-alemao-anao","/guias/quanto-custa-ter-spitz-alemao-anao"]},
 {"id":"C2","severity":"high","title":"Canibalização blog x guias x landing pages (9 clusters)"},
 {"id":"C3","severity":"high","title":"/temperamento com canonical para página de outro tema","urls":["/temperamento","/cuidados","/alimentacao"]},
 {"id":"C4","severity":"high","title":"Home diz que cada cor tem valor de partida; regra é preço igual em qualquer cor","urls":["/","/blog/preco-spitz-alemao-anao"]},
 {"id":"C5","severity":"high","title":"Páginas de estado 78% idênticas (doorway)","urls":["/filhotes/sao-paulo","/filhotes/minas-gerais","/filhotes/rio-de-janeiro"]},
 {"id":"C6","severity":"medium","title":"Post assinado por Arthur Ribeker diz 'escrito pela criadora'","urls":["/blog/spitz-alemao-anao-bom-para-apartamento"]},
 {"id":"C7","severity":"medium","title":"'família Imperio' e marcos históricos não confirmados","urls":["/sobre","/criador-spitz-confiavel"]},
 {"id":"C8","severity":"medium","title":"24/31 posts sem sinal de experiência própria"},
 {"id":"C9","severity":"medium","title":"Bio de autor mínima e sem página de autor"},
 {"id":"C10","severity":"medium","title":"26/31 posts com a mesma data 2025-06-01; 24 nunca atualizados"},
 {"id":"C11","severity":"medium","title":"CTA promete 'guia exclusivo' inexistente","urls":["/blog/*"]},
 {"id":"C12","severity":"medium","title":"E-mail público é gmail","urls":["/contato"]},
 {"id":"C13","severity":"medium","title":"Páginas finas: /galeria/* (~60 palavras), fichas de filhote templadas"},
 {"id":"C14","severity":"low","title":"115 frases com 'Spitz' sem 'Lulu da Pomerânia' (regra do dono)"},
 {"id":"C15","severity":"low","title":"Fotos da cor vetada ilustram 3 posts"},
 {"id":"C16","severity":"low","title":"4 descrições repetem o título; páginas institucionais sem datas"}
]
```
