# GEO / AI Search Readiness: byimperiodog.com.br

Audit date: 2026-11-17. Method: live fetches (render_page.py in auto mode; every page was SSR, `is_spa: false`, so Playwright never ran and the browser sandbox did not apply), crawler user-agent probes, read-only source review, and public brand checks (YouTube, Wikipedia/Wikidata APIs, Bing).

## GEO Readiness Score: 69 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 68 | 17.0 |
| Structural Readability | 20% | 75 | 15.0 |
| Multi-Modal Content | 15% | 55 | 8.3 |
| Authority & Brand Signals | 20% | 50 | 10.0 |
| Technical Accessibility | 20% | 92 | 18.4 |
| **Total** | | | **68.7 rounds to 69** |

Platform estimates: Google AI Overviews 66, ChatGPT Search 60, Perplexity 66, Bing Copilot 58.

## AI crawler access (robots.txt)

| Bot | What it controls | Status |
|---|---|---|
| OAI-SearchBot | ChatGPT Search citations | Allowed (explicit group), returns 200 |
| ChatGPT-User | Fetches when a ChatGPT user asks | Allowed |
| Claude-SearchBot | Claude search citations | Allowed, returns 200 |
| Claude-User | Fetches when a Claude user asks | Allowed |
| PerplexityBot / Perplexity-User | Perplexity index and user fetches | Allowed, returns 200 |
| Googlebot | Google Search and AI Overviews inclusion | Allowed |
| Bingbot | Bing and Copilot grounding | Allowed |
| GPTBot | OpenAI model training only | Allowed, returns 200 |
| ClaudeBot | Anthropic model training only | Allowed |
| Google-Extended | Gemini/Vertex training and grounding; does not affect Search or AIO | Allowed |
| Applebot-Extended | Apple Intelligence training only | Allowed |
| CCBot | Common Crawl (training corpora) | Allowed |
| cohere-ai | Training | No group, so it falls under `*` and is allowed |

Every disallow is limited to /admin/, /api/admin/, /blog/preview/ and /contract/. No crawler gets a WAF challenge (Netlify served 200 with the same byte count to each AI user-agent). There is no X-Robots-Tag. The `Host:` line is non-standard and harmless. Allowing the training bots is a business choice, not a defect.

## llms.txt and licensing

- `/llms.txt`: **present and well-formed** (14.4 KB). It has an H1 and a `>` summary with the confirmed facts (2013, Bragança Paulista, R$ 4.500 for males and R$ 6.500 for females in PIX), plus H2 sections that link to the catalog, colors, states, breed pages, guides, the kennel pages, all 31 posts and the sitemaps. Its facts match the pages.
- `/llms-full.txt`: 404 (optional).
- RSL 1.0 (`/license.xml` or a robots `License:` line): absent (optional; this matters only if the owner wants machine-readable licensing terms).
- Info (owner judgment): llms.txt lists the Wolf Sable / Cinza-Lobo article by its own title. That is the article's own entry, but if the ban also covers index files, change the anchor text.

## Technical accessibility (92)

- Every audited page is server-rendered with full text in the raw HTML: home 1,155 extracted words, /spitz-alemao 816, /lulu-da-pomerania 574, /sobre 411, /guias/spitz-alemao-anao-vs-lulu-pomerania 321, /blog/preco-spitz-alemao-anao 866, /blog/como-escolher-canil-spitz-alemao 1,326.
- Sitemaps: sitemap-index, sitemap.xml (96 URLs), posts (31), images (23) and videos (13 entries with full video:* fields) all return 200.
- Points lost: no llms-full.txt, and seasonal and boilerplate text pollutes the extracted text (see Structure).

## Citability (68)

Strengths:
- The first H2 of /blog/preco-spitz-alemao-anao answers directly: "Os machos partem de R$ 4.500 e as fêmeas de R$ 6.500 no PIX, em qualquer cor." That sentence is the citable fact for "spitz alemão anão preço".
- /spitz-alemao has a fact table (21 cm ± 3 cm, FCI nº 97, 12–16 anos, Grupo V, the 7 colors) and FAQ answers that open with "Sim, …".
- The guide "São o mesmo cão" opens with "Sim, o Spitz Alemão Anão e o Lulu da Pomerânia são a mesma raça", which is good for the naming queries.
- Blog posts have a "Fontes" section, plus `citation` JSON-LD pointing to CBKC, FCI nº 97 and WSAVA.

Issues:
1. **Medium: an answer under a question heading dodges the question.** On the price post, the H2 "Como o Preço Varia Entre Fêmeas e Machos?" answers "O valor pode variar entre opções, mas sexo e cor não determinam sozinhos…". The numbers that answer it sit in the previous section. AI engines extract the passage under the matching heading, so this passage gives them no answer. Fix: open that section with "Machos a partir de R$ 4.500 e fêmeas a partir de R$ 6.500 no PIX; a cor não muda o valor de partida." Then keep the advice.
2. **Medium: an imprecise fact in a guide that llms.txt links to.** `content/guides/index.ts:192` says "O padrão FCI N° 97 descreve o Spitz Alemão — Lulu da Pomerânia — (Deutsche Spitz) em cinco variedades". The breed-name rule inserted "Lulu da Pomerânia" so that it equates the name with all five sizes, while the same page says it is only the Anão. An engine can extract the contradiction. Fix: "O padrão FCI nº 97 descreve o Spitz Alemão (Deutsche Spitz) em cinco variedades… a menor, Zwergspitz/Anão, é a que no Brasil se chama Lulu da Pomerânia." That sentence still names the Lulu da Pomerânia.
3. **Low/Medium: unsourced historical claims.** Line 179 of the same file says the name "se popularizou nas décadas de 1980 e 1990 por influência americana", and the guide says registrations as "Spitz Alemão Anão" and as "Lulu da Pomerânia" are "documentalmente idênticos" (the CBKC registers the breed as Spitz Alemão). Fix: cite a source or remove the claim. Do not invent a citation.
4. **Low: cost figures without a source or date.** The "Custos Mensais" list (ração R$ 150–250 and so on) has no "valores de referência, nov/2026, Bragança Paulista". Fix: add a reference line with month and year. Only use numbers the owner can stand behind.
5. **Low: few question-shaped H2s on the hub pages.** /lulu-da-pomerania and /spitz-alemao use topic labels ("Temperamento", "Cuidados essenciais"). Fix: rephrase 2–3 H2s per hub as questions that people search, such as "Quanto pesa um Lulu da Pomerânia adulto?" and "Lulu da Pomerânia é bom para apartamento?". Open each with a 1–2 sentence answer.

## Structural readability (75)

- Good: a clean H1 to H2 to H3 hierarchy, lists on every page, a table on /spitz-alemao, BreadcrumbList, Article with datePublished and dateModified on posts and hubs, and a shared LocalBusiness `@id`.
- **Low/Medium: the holiday banner sits inside the main extracted text.** The text "Família nova neste Natal… / Boas festas e um ano novo…" from `src/components/common/FaixaSazonal.tsx` (rendered in `app/(public)/layout.tsx:185`) lands between content sections in trafilatura's output on /spitz-alemao and /sobre. Fix: render it inside an `<aside>` or `role="region"` outside `<main>`, and make sure it is not placed between article paragraphs in the DOM.
- **Low: two headings are concatenated.** Seasonal variants of the same H2 both ship in the HTML: "Conte o que você procuraConte qual Lulu da Pomerânia…" on home, and "Cada filhote tem uma família esperando por ele.Um Lulu da Pomerânia para aquecer o Natal…" in the footer of every page. Fix: render only the active variant in the H2, or keep the hidden one out of the heading element.
- Info: FAQPage JSON-LD is on home, /contato and /faq-do-tutor. It came back on 17/11/2026 by the owner's decision (`src/lib/structured-data.ts` comment) and matches the visible questions. No action needed; this audit does not recommend adding it anywhere else.

## Multi-modal (55)

- Images: 43 on home, 0 without alt text.
- Videos: /galeria serves `.mp4` files and a video sitemap (13 entries) exists, but no audited page has `VideoObject` JSON-LD or an embedded YouTube video.
- YouTube @byimperiodog: 393 subscribers, 68 videos. The channel title is "By Imperio Dog Spitz Alemão Lulu da Pomerânia Anão". YouTube mentions are the strongest known correlate of AI citation, and no breed page or post embeds a video.
- **Medium fix:** embed one relevant YouTube video in the price post, /spitz-alemao, /lulu-da-pomerania and /sobre, and add `VideoObject` (name, description, thumbnailUrl, uploadDate, contentUrl/embedUrl) that matches the video sitemap. Give each video a pt-BR description that states the facts in text form.

## Authority & brand signals (50)

On-site:
- LocalBusiness schema: foundingDate 2013, CBKC kennel registration identifier 980/15, address in Bragança Paulista, hours, publishingPrinciples pointing to /politica-editorial, and 7 sameAs links (Instagram, Google KG `/g/11gpnjwc18`, Google Maps cid, YouTube, TikTok, Facebook, Pinterest). This is solid.
- Blog posts carry a Person author (for example "Karen Cristina", with description "Cria o Spitz Alemão Anão (Lulu da Pomerânia) desde 2013…" and worksFor the business).
- **Medium: authors have no profile page or Person `@id`.** /autores returns 404, and the Person node is repeated inline with no `url` and no `sameAs`. Fix: create /sobre#karen-cristina (or /autores/karen-cristina and /autores/arthur-ribeker) using only confirmed facts: name, role at the kennel, and since 2013 for Karen if the owner confirms it. No invented credentials. Then point `author.url` and `@id` there.
- **Medium: /sobre never names the founder in body text.** The only "Karen" on it is inside a customer review. The page has 411 words and its timeline has no years in the extracted text. Fix: one paragraph that names who runs the kennel, says 2013 and Bragança Paulista, and says that not every puppy was born at the kennel (a confirmed fact that also builds trust). Add years to the timeline only where the owner confirms them.
- **Medium: dates on the guides are stale.** `content/guides/index.ts` keeps `updatedAt: "2025-05-01"` on every guide, yet the file changed on 06/11 and 17/11/2026. The guide's Article `dateModified` therefore says May 2025, and freshness counts toward AI selection. The guides are also authored by the business, not a Person. Fix: update `updatedAt` when the content changes, and use the same Person author as the blog.

Off-site (public checks):
- Wikipedia (pt): 0 hits for "Imperio Dog". Wikidata: no entity. Expected for a local kennel, so do not create a Wikipedia article. A Wikidata item is optional and only worth doing with independent references.
- Reddit: the API blocked automated queries, so this could not be verified. Assume no presence.
- YouTube: an active channel with low reach (393 subscribers).
- Google Business Profile: present (KG id and Maps cid in sameAs), and reviews from Google are shown on site. This is the strongest third-party signal for local AI answers.
- LinkedIn: no profile in sameAs (low priority for this business).

## Visibility for target queries (pt-BR)

I tried to observe live AI answers for "canil lulu da pomerânia", "spitz alemão anão preço" and "canil spitz alemão bragança paulista". The results were **inconclusive**: DuckDuckGo returned nothing to the scraper, and Bing returned bot-filtered or unrelated pages for 4 of 5 queries. In the one usable Bing result ("spitz alemão anão preço"), byimperiodog.com.br was **not in the top 10**. The top 10 were premierpet, olx (x2), peritoanimal, adoropets, animaisvaliosos, pt.wikipedia, doglife, meuspitzalemao and spitzlove. No DataForSEO tools were available. Manual check: run the 3 queries logged out in ChatGPT (search on), Perplexity, Gemini and Copilot, and record whether the brand or domain is cited. Check again around 04/12/2026, alongside the CWV baseline.

## Top 5 highest-impact changes

| # | Change | Severity | Effort | Files / place |
|---|---|---|---|---|
| 1 | Author entities: named author section or pages for Karen Cristina and Arthur Ribeker (confirmed facts only); `author.url` and `@id` on posts and guides; name the founder in /sobre body text | Medium | 2–3 h | app/(public)/sobre, src/lib/blog/seo.ts, content/guides/index.ts |
| 2 | Fix the FCI sentence (line 192) and source or remove the unsourced claims (line 179, "documentalmente idênticos") in the guide that llms.txt links to | Medium | 30 min | content/guides/index.ts |
| 3 | Embed YouTube videos and add VideoObject on the price post, breed hubs and /sobre | Medium | 2–4 h | blog post template, hub pages |
| 4 | Answer-first rewrite of question H2s (price post "Fêmeas e Machos" section) and question-style H2s on /spitz-alemao and /lulu-da-pomerania | Medium | 1–2 h | blog content, hub pages |
| 5 | Real `updatedAt` on the guides; move FaixaSazonal out of the main content flow; render only the active seasonal H2 | Low/Medium | 1 h | content/guides/index.ts, FaixaSazonal.tsx, home and footer seasonal headings |

Off-site (ongoing, owner-led): get more Google reviews that mention "Lulu da Pomerânia" and "Bragança Paulista" naturally (never scripted or incentivized). Publish YouTube videos whose titles and descriptions answer the price, color and size questions. Get listed in genuine local and breed directories.

## Structured findings (audit-data.json, category "AI Search Readiness")

```json
{
  "category": "AI Search Readiness",
  "score": 69,
  "dimensions": {"citability": 68, "structural_readability": 75, "multimodal": 55, "authority_brand": 50, "technical_accessibility": 92},
  "platform_scores": {"google_aio": 66, "chatgpt": 60, "perplexity": 66, "bing_copilot": 58},
  "crawlers": {"OAI-SearchBot": "allowed", "ChatGPT-User": "allowed", "Claude-SearchBot": "allowed", "Claude-User": "allowed", "PerplexityBot": "allowed", "Googlebot": "allowed", "Bingbot": "allowed", "GPTBot": "allowed", "ClaudeBot": "allowed", "Google-Extended": "allowed", "Applebot-Extended": "allowed", "CCBot": "allowed", "cohere-ai": "allowed (via *)"},
  "llms_txt": "present_valid",
  "llms_full_txt": "missing",
  "rsl": "missing",
  "findings": [
    {"id": "geo-author-entity", "severity": "medium", "title": "Authors without profile/@id; /sobre does not name the founder", "evidence": "/autores 404; Person inline without url/sameAs; 'Karen' on /sobre only inside a review", "fix": "Author section/pages with confirmed facts only; author.url/@id; founder paragraph on /sobre"},
    {"id": "geo-guide-fci-sentence", "severity": "medium", "title": "Guide equates Lulu da Pomerânia with all 5 Spitz sizes", "evidence": "content/guides/index.ts:192", "fix": "Reword so Lulu da Pomerânia = Zwergspitz/Anão only"},
    {"id": "geo-guide-unsourced", "severity": "low", "title": "Unsourced historical/registration claims", "evidence": "content/guides/index.ts:179; 'documentalmente idênticos'", "fix": "Cite a real source or remove"},
    {"id": "geo-video-schema", "severity": "medium", "title": "No VideoObject or YouTube embeds on key pages", "evidence": "0 VideoObject on audited pages; channel 393 subs / 68 videos", "fix": "Embed videos and add VideoObject"},
    {"id": "geo-answer-first", "severity": "medium", "title": "Question H2 not answered directly", "evidence": "/blog/preco-spitz-alemao-anao 'Como o Preço Varia Entre Fêmeas e Machos?'", "fix": "Lead with the R$ 4.500 / R$ 6.500 PIX values"},
    {"id": "geo-stale-guide-dates", "severity": "medium", "title": "Guide dateModified stuck at 2025-05-01", "evidence": "content/guides/index.ts updatedAt; file edited 2026-11-17", "fix": "Update updatedAt on content edits"},
    {"id": "geo-seasonal-noise", "severity": "low", "title": "Seasonal banner and duplicate seasonal H2s in extracted text", "evidence": "FaixaSazonal text mid-content in /spitz-alemao, /sobre; concatenated H2 on home/footer", "fix": "aside outside main; render only active variant"},
    {"id": "geo-cost-attribution", "severity": "low", "title": "Monthly cost figures without date/source", "evidence": "price post 'Custos Mensais'", "fix": "Add reference month/year line"},
    {"id": "geo-serp-unverified", "severity": "info", "title": "Live AI/SERP visibility not verifiable automatically", "evidence": "Bing usable for 1 query: domain not in top 10 for 'spitz alemão anão preço'", "fix": "Manual logged-out checks in ChatGPT, Perplexity, Gemini, Copilot"}
  ]
}
```
