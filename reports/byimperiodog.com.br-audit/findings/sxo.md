# SXO (Search Experience) findings: byimperiodog.com.br

Date: 17/11/2026. Pages rendered with render_page.py `--mode auto`. None was a SPA (`is_spa: false`), so the raw DOM is what users see. No sandbox warning was raised.
SERP source: the WebSearch tool, run once per keyword. It is not a logged-in google.com.br session, so ads, the local pack and the AI Overview could not be seen (see Limitations).

## SXO Gap Score: 64 / 100 (separate from the SEO Health Score)

| Dimension | Score | Evidence |
|---|---|---|
| Page Type | 8/15 | The price keyword lands on a blog post, which matches the SERP. "spitz alemão anão" and "filhote de lulu da pomerânia" show mostly breed-guide results, but the home H1 ("Canil Spitz Alemão Anão (Lulu da Pomerânia)") and /filhotes (H1 "Spitz Alemão Anão (Lulu da Pomerânia) — filhotes") are commercial pages. The matching guide pages (/spitz-alemao, /lulu-da-pomerania) exist but compete with them on the same head terms. |
| Content Depth | 8/15 | Extracted body text: /filhotes 298 words, puppy page 296, /lulu-da-pomerania 574, Bragança page 324, price post about 850. The guide-style SERP results (Petz, Petlove, Cobasi, growth-table pages) cover growth, coat change and care. None of the money pages has a growth table, and 4 of 18 results for "filhote de lulu da pomerânia" are growth tables. |
| UX Signals | 11/15 | Good: "A partir de R$ 4.500 no PIX" appears above the fold on /filhotes and on puppy pages; WhatsApp CTAs are everywhere (24 to 55 per page); hours "8h às 22h"; reservation of 50% stated on puppy pages. Bad: the home contradicts itself (see M5); the 10 puppy cards say "Disponibilidade a confirmar" or "referência visual"; the Christmas banner repeats on every page. |
| Schema | 10/15 | LocalBusiness, PostalAddress, OpeningHours, CollectionPage, ItemList, BreadcrumbList, and Article with a Person author on the post. Puppy pages only have WebPage plus an Offer inside the site-wide OfferCatalog, with no Product schema per puppy. The home still emits FAQPage/Question/Answer even though the project rule says no FAQPage, so this is flagged for the owner and is not a recommendation. |
| Media | 10/15 | Real photos: 43 images on the home, 15 on /filhotes, 16 on the puppy page. The breed guide /lulu-da-pomerania has only 2 images, while the SERP breed guides are image-rich. |
| Authority | 9/15 | "4,9/5 no Google, 35 no perfil"; "desde 2013"; post signed by Karen Cristina with a Fontes section. Not seen on any money page: per-litter proof (parents, birth date, vet report per puppy). The trust claims are generic ("Procedência confiável", "Filhotes legítimos"). |
| Freshness | 8/10 | Price post updated 2026-09-14; /lulu-da-pomerania and the Bragança page show 2026-11-17; the others show 2026-11-06. |

## SERP consensus per keyword (page-type taxonomy)

| Keyword | Results seen | Dominant type (confidence) | Other types | Site target | Mismatch |
|---|---|---|---|---|---|
| filhote de lulu da pomerânia | 18 | Blog Post / breed guide: Petz x4, Petlove x2, Cobasi x2, 3 growth tables, UFAPE, Royal Canin (about 80%) | Marketplace listing (Mercado Livre) about 6%, news about 10% | /filhotes (category/listing) and the home | **HIGH** |
| lulu da pomerânia preço | 19 | Blog Post / Q&A price article: auditorioibirapuera x4, vocepergunta, Petlove x3, Petz blog, Diário PE, UAI (about 65%) | Marketplace listings: ML x3, Magalu, Cobasi product (about 30%) | /blog/preco-spitz-alemao-anao (the old /preco-spitz-anao sends a 308 to /filhotes) | **MEDIUM** (type matches, angle does not) |
| canil lulu da pomerânia | 16 | Breed guide / news (about 70%) | OLX classified listing in position 1, price Q&A x2. No breeder home page among the organic results | Home (Landing + LocalBusiness) | **MEDIUM**, because the real local pack was not visible |
| spitz alemão anão | 25 | Breed encyclopedia: InfoEscola x2, Cobasi x2, Petlove x2, Royal Canin x2, Portal São Francisco, Panorama Pet (about 80%) | ML listing, price Q&A x2, listicles | Home (H1 = "Canil Spitz Alemão Anão") | **HIGH**. The aligned page /spitz-alemao exists but is not the main target |

SERP features observed: price ranges inside snippets (R$ 1.800 to R$ 7.000 on listings, R$ 3.000 to R$ 15.000 in articles, R$ 30 mil as an outlier). Marketplace listings with real per-animal prices (OLX, ML). Repeated warnings to "buscar canis idôneos, pedir pedigree" and the note that "merle não é aceito pela FCI" (Diário do Nordeste). Growth tables cluster for "filhote".

## Page-type mismatches (primary finding)

- **M1. HIGH, "spitz alemão anão" pointed at the home.** Google rewards breed encyclopedias for the bare term. The home is a commercial landing page whose H1 uses the bare term. /spitz-alemao (title "Spitz Alemão Anão (Lulu da Pomerânia) — Características, Porte e Cuidados") is the page type the SERP wants. Make /spitz-alemao the target for the bare term through internal anchors ("Spitz Alemão Anão" anchors pointing to /spitz-alemao instead of / or /filhotes). Let the home keep the "canil ..." variant. The H1 wording is the only home change suggested. This is not a redesign.
- **M2. HIGH, "filhote de lulu da pomerânia" pointed at /filhotes.** About 80% of the SERP is informational: what a puppy is like, growth by month, coat change, socialization. /filhotes is a listing page with 298 words. Either (a) make /filhote-de-spitz-alemao (which already exists) the informational target, with a growth table by month, coat change from 4 to 12 months, and the first weeks at home, linking to /filhotes, or (b) keep /filhotes for the transactional slice that the ML/OLX results show. Option (a) fits the SERP.
- **M3. MEDIUM, price post angle.** The SERP answers "quanto custa" with a market range first, then the reasons. The post opens with the kennel's own price. The SERP H1 pattern is "Quanto custa um Lulu da Pomerânia"; the post leads with "Spitz Alemão Anão". Suggestion: after the first sentence, add a short block explaining why prices across the market vary so much (size, line, documentation, health tests). Only use ranges with a cited source, and keep "A partir de R$ 4.500 no PIX" as the site's own figure. The post is about 850 words against longer competitors.
- **M4. MEDIUM, puppy pages are "Product pages" with no product.** The pages say "Esta página é uma referência visual ... as fotos são reais e ficam no ar de forma permanente". The marketplace part of the SERP (OLX/ML) shows specific animals. For a buyer this reads as a catalog, not a puppy, and that weakens trust (P2). Without inventing data, the page could say exactly what will be shown in the WhatsApp conversation (birth date, parents, vet report, registration) and offer a video call.
- **M5. Consistency bug (UX/trust).** The home ColorGallery (`src/components/sections/ColorGallery.tsx:66`) says "Cada cor tem o seu valor de partida". /filhotes, the price post and `content/guides/index.ts` say "A cor não muda esse valor de partida". A price-comparing buyer sees two answers.

## User stories (from SERP signals)

1. **Awareness.** "As someone thinking about a Lulu, I want to know how big a puppy gets month by month, so I know if it fits my apartment." Signal: 4 growth-table results for "filhote de lulu da pomerânia", plus Petlove's height of 18 to 22 cm.
2. **Consideration.** "As a first-time buyer, I want to understand why prices go from R$ 2 mil to R$ 15 mil, so I can tell if a cheap ad is a trap." Signal: the price SERP mixes ML listings at R$ 2.000 to 4.500 with articles quoting R$ 3.000 to 15.000.
3. **Consideration.** "As a cautious buyer, I want proof that the kennel is legitimate (registration, visit, documents) before sending a Pix deposit." Signal: "buscar canis e criadores idôneos ... peça pedigree" (Diário do Nordeste) and the OLX "canil" listings above every real kennel.
4. **Decision.** "As someone in São Paulo or the Bragança region, I want to know if I can visit and how far it is, so I can pick the puppy up myself." Signal: the "canil" query mixes city-tagged OLX results, which suggests a local pack exists.
5. **Consideration.** "As a researcher, I want to know if Lulu da Pomerânia and Spitz Alemão Anão are the same dog." Signal: Cobasi and the InfoEscola snippets for "spitz alemão anão" answer exactly this.

## Persona scores (weakest first)

| Persona | Relevance | Clarity | Trust | Action | Total | Page scored |
|---|---|---|---|---|---|---|
| P4 Breed researcher ("spitz alemão anão", "filhote ...") | 12 | 14 | 18 | 12 | **56** | Home and /filhotes |
| P2 Buyer worried about scams and health | 17 | 14 | 14 | 15 | **60** | Puppy page and /filhotes |
| P3 Local visitor (Bragança, SP capital) | 18 | 15 | 16 | 15 | **64** | /lulu-da-pomerania-braganca-paulista and home |
| P1 First-time buyer comparing price | 20 | 21 | 15 | 18 | **74** | Price post and /filhotes |

- **P4 (56).** The commercial pages answer "buy" and not "what is it". Fix M1 and M2 with internal anchors to /spitz-alemao and /filhote-de-spitz-alemao. Add a growth table and coat-change section to /filhote-de-spitz-alemao. Add more real photos to /lulu-da-pomerania, which has only 2.
- **P2 (60).** Trust comes from generic claims ("Procedência confiável", "Filhotes legítimos"). The puppy pages say they are references. "Merle" appears among the 7 advertised colors and as a /filhotes filter, while the SERP warns that merle is not accepted by the FCI. A scam-worried buyer reading both will hesitate. Recommendations:
  - Bring the existing "Guia passo a passo para não cair em golpes" (currently a small card on the home) next to the price and reservation block on puppy pages and /filhotes.
  - List exactly which documents the buyer can check before the 50% reservation (registry entity, vet report, contract), using only facts the owner confirms.
  - Add a short, honest note on merle (standard status, how the kennel handles it), to be written by the owner.
- **P3 (64).** The Bragança page has city, about 100 km / 1h30 from SP, hours and visits "por agendamento". However, the FAQ says "A possibilidade e o formato da visita são combinados" and the SP page says "combinadas caso a caso", which is vague for someone planning a drive. A map embed and a visible street or area could not be confirmed on the page (PostalAddress exists in schema). Recommendations:
  - Use one clear visit sentence everywhere, matching the new top bar.
  - Link /filhotes/sao-paulo and the Bragança page to each other.
  - Run `/seo local` for the GBP and local pack.
- **P1 (74).** Price is visible and consistent in the "A partir de R$ X no PIX" format, and the reservation of R$ 2.250 (50%) is explicit. Weaknesses: the color price contradiction (M5), no market context (M3), and "Parcelamento e condições confirmados no atendimento" with no indication of what is possible. Recommendations: fix M5, and add the market-variation block to the price post.

## Structured findings (audit-data.json, category "Search Experience")

```json
{"category":"Search Experience","sxo_gap_score":64,"findings":[
 {"id":"SXO-1","severity":"high","title":"'spitz alemão anão' SERP is breed-encyclopedia; home targets it with a commercial H1","pages":["/","/spitz-alemao"],"fix":"Point bare-term anchors to /spitz-alemao; home keeps 'canil' variant"},
 {"id":"SXO-2","severity":"high","title":"'filhote de lulu da pomerânia' SERP ~80% informational; /filhotes is a 298-word listing","pages":["/filhotes","/filhote-de-spitz-alemao"],"fix":"Make /filhote-de-spitz-alemao the informational target with growth table and coat change"},
 {"id":"SXO-3","severity":"medium","title":"Price post leads with own price; SERP leads with market range","pages":["/blog/preco-spitz-alemao-anao"],"fix":"Add sourced market-variation block; keep 'A partir de R$ 4.500 no PIX'"},
 {"id":"SXO-4","severity":"medium","title":"Puppy pages declare themselves visual references, not available puppies","pages":["/filhotes/*"],"fix":"State what proof is shown in the conversation before the reservation; link the anti-scam guide"},
 {"id":"SXO-5","severity":"medium","title":"Contradiction: home says each color has its own starting price; other pages say color does not change it","pages":["/"],"file":"src/components/sections/ColorGallery.tsx:66","fix":"Align copy to 'a cor não muda o valor de partida'"},
 {"id":"SXO-6","severity":"low","title":"Merle advertised without context while SERP flags merle as non-FCI","pages":["/filhotes","/spitz-alemao"],"fix":"Owner-written transparency note"},
 {"id":"SXO-7","severity":"info","title":"Home emits FAQPage schema, conflicting with the project's no-FAQPage rule","pages":["/"],"fix":"Owner decision"}
]}
```

## Cross-skill follow-ups
- `/seo local`: the "canil" intent and the local visitor persona need a GBP and local pack check.
- `/seo schema`: decide whether puppy pages need Product schema.
- `/seo content`: E-E-A-T proof on puppy pages (P2).

## Limitations
- The SERP came from the WebSearch tool, not a geo-located google.com.br session. Exact ranks, ads, local pack, AI Overview, PAA and shopping units were not seen. Page-type percentages are approximate.
- The site's own ranking positions were not measured (no Search Console data used).
- Content depth comes from the trafilatura-extracted body text, which leaves out boilerplate, and competitor word counts are estimates (competitors were not rendered).
- Core Web Vitals, mobile above-the-fold screenshots and conversion data were not assessed.
- The source was read-only. No changes were made to the site.

Generate a PDF report? Use `/seo google report`.

Sources: [Petz filhote](https://www.petz.com.br/blog/cachorros/lulu-da-pomerania-filhote/), [Petlove](https://www.petlove.com.br/dicas/lulu-da-pomerania), [Cobasi](https://www.cobasi.com.br/lulu-da-pomerania), [Mercado Livre](https://lista.mercadolivre.com.br/lulu-pomerania-ursinho), [OLX](https://www.olx.com.br/anuncios/canil-lulu-pomerania), [Diário do Nordeste](https://diariodonordeste.verdesmares.com.br/estilo-de-vida/pets/lulu-da-pomerania-entenda-mais-sobre-a-raca-1.3143289), [Auditório Ibirapuera](https://www.auditorioibirapuera.com.br/quanto-custa-um-lulu-da-pomerania-mini/), [Você Pergunta](https://vocepergunta.com/library/artigo/read/728973-quanto-custa-um-cachorro-da-raca-lulu-da-pomerania), [InfoEscola](https://www.infoescola.com/animais/spitz-alemao), [Royal Canin](https://www.royalcanin.com/br/dogs/breeds/german-spitz), [Saber Tecnologias growth table](https://sabertecnologias.com.br/conteudo/tabela-de-crescimento-do-lulu-da-pomerania-guia-completo)
