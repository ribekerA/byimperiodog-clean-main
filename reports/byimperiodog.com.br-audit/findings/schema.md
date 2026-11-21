# Schema / JSON-LD audit — byimperiodog.com.br (live, 2026-11-17)

Pages fetched: /, /filhotes, 3 puppy pages (branco-femea, branco-femea-2, sao-paulo), /blog, 2 posts (guia-spitz-alemao, lulu-pomerania-ou-spitz-alemao), /contato, /sobre, /galeria, /galeria/creme-dupla, /politica-editorial. Raw HTML (server-rendered); all JSON-LD blocks parse (valid=true). Only JSON-LD, no Microdata/RDFa.

## Detection
- Sitewide: LocalBusiness (#business), WebSite (#website), SiteNavigationElement.
- Home: + FAQPage (9+ Q). /filhotes: CollectionPage + ItemList(10) + BreadcrumbList. Puppy: WebPage + ImageObject[] + BreadcrumbList. /blog: Blog(+BlogPosting[]) + BreadcrumbList. Post: Article + BreadcrumbList. /contato: Organization + FAQPage(5) + BreadcrumbList. /sobre, /politica-editorial: WebPage + Breadcrumb. /galeria: CollectionPage/ItemList(13). /galeria/[slug]: VideoObject + WebPage + Breadcrumb.

## Findings
| # | Sev | Finding | Evidence | Fix |
|---|-----|---------|----------|-----|
| 1 | Info / decision conflict | FAQPage is live on /, /contato (and /faq-do-tutor in source). Brief says FAQPage was removed 26/08/2026, but commit/comment says it was re-added 17/11/2026 "por decisão do responsável". No Google SERP benefit (rich result retired 07/05/2026). Stale comments contradict code. | app/(public)/page.tsx:163, app/(public)/contato/page.tsx:123, app/(public)/faq-do-tutor/page.tsx:199; src/lib/structured-data.ts:35 (reinstated) vs :238 and src/lib/schema.ts:6, src/components/sections/HomeFAQ.tsx:10 (say removed) | Confirm with owner which is current. If removed is intended: delete the 3 script tags + buildFaqPageLD. Either way remove the contradictory comments. Home FAQ answers state "machos R$ 4.500 / fêmeas R$ 6.500" fixed in text; keep wording "partem de" to match "A partir de". |
| 2 | Medium | Duplicate/conflicting Organization on /contato without @id: phone "+5511968633239", contactType "customer support", availableLanguage "Portuguese"; LocalBusiness has "+55 11 96863-3239", "customer service", "pt-BR". Creates a second entity for the same business. | contato.jsonld block 4 vs block 1 | Remove the block (or reference {"@id":".../#business"}); keep a single ContactPoint, E.164 phone format everywhere. File: app/(public)/contato/page.tsx |
| 3 | Medium | Blog index BlogPosting items: image URLs are relative ("/spitz-hero-desktop.webp", "/images/blog/..jpg"), no author, no dateModified; publisher is a bare Organization (not @id) | blog.jsonld block 4 | Make image absolute (SITE_URL + path), add author (Person) and dateModified, publisher {"@id":"https://byimperiodog.com.br/#business"}. File: src/lib/blog/seo.ts |
| 4 | Medium | LocalBusiness.makesOffer contains an Offer with priceCurrency but no price; conflicts with owner rule (no Offer while "A partir de"). Also priceRange "R$ 4.500 – R$ 6.500" mixes two "from" prices (6.500 is the female starting price, not a ceiling) | LocalBusiness block, src/lib/structured-data.ts:327,384-398 | Drop makesOffer (keep hasOfferCatalog as name/url only, or replace with Service/knowsAbout). Consider removing priceRange or phrasing it as "a partir de R$ 4.500". |
| 5 | Low | Post pages use "Article"; blog index lists "BlogPosting" for same URLs | guia/lulu blocks vs blog block | Use BlogPosting on posts (src/lib/schemas/article.ts or src/lib/blog/seo.ts). |
| 6 | Low | dateModified == datePublished on all posts (e.g. 2025-06-01T00:00:00.000Z); timestamps are midnight UTC (previous day 21:00 BRT) | post blocks | Feed real revision date (git/lastmod) and use offset "-03:00". |
| 7 | Low | Article author Person has no @id/url; the same person repeated inline per post; no Person node anywhere | post blocks | Define Person nodes for Karen Cristina and Arthur Ribeker once (e.g. on /sobre or /politica-editorial, with @id, name, worksFor) and reference by @id. No jobTitle/credentials, per owner. |
| 8 | Low | Article image: single 1280x853 (3:2). Google recommends 16:9, 4:3, 1:1 variants. `about` are section headings as Thing (no signal) | guia block | Add 3 ratios in image[]; replace about[] with real topics (Thing with sameAs/Wikipedia for the breed) or drop. |
| 9 | Low | isPartOf WebSite is re-declared inline (no @id) on puppy, /sobre, /politica-editorial, /filhotes instead of {"@id":".../#website"} | e.g. filhotes_..femea.jsonld block 4 | Reference by @id. File: src/lib/structured-data.ts (buildWebPageLD) |
| 10 | Low | SiteNavigationElement is one node with name[] and url[] arrays; Google/validators expect one node per item. No rich-result impact | block 3 | One node each, or remove. |
| 11 | Low | Inconsistent naming in ItemList: "Spitz Alemão (Lulu da Pomerânia) Branco Macho" (no "Anão"), "Lulu da Pomerânia Preto Macho" vs "Spitz Alemão Anão (Lulu da Pomerânia) ..." | filhotes block 5 | Normalise puppy display names. |
| 12 | Low | VideoObject uploadDate date-only ("2026-05-25"); valid, but timezone recommended. No violations otherwise (name, thumbnailUrl, uploadDate, contentUrl, duration present) | /galeria/creme-dupla | Use "2026-05-25T00:00:00-03:00". |
| 13 | Info | sameAs TikTok handle "@byimperiodogs" (trailing s) differs from other networks "byimperiodog" | LocalBusiness | Confirm handle is real. |

## Passes
- @context https://schema.org, absolute URLs (except #3), BreadcrumbList valid on all pages, ItemList/CollectionPage consistent.
- LocalBusiness matches owner decisions: addressLocality only (no street/postal), openingHours 08:00-22:00 7 days, sameAs incl. YouTube and Google Maps, foundingDate 2013, logo 150x150 (>=112), image[3], telephone. No aggregateRating/Review invented. No Product/Offer on puppy pages. No deprecated types (HowTo, SpecialAnnouncement).
- Single #business node reused sitewide via @id (publisher/about/worksFor).
- VideoObject on /galeria/[slug] complete.

## Missing opportunities (rule-compliant)
1. AboutPage type on /sobre and ContactPage on /contato (mainEntity -> #business). Low, semantic.
2. Person nodes for the two authors (see #7); ProfilePage optional.
3. Article: add `isPartOf` Blog (@id .../blog#blog), `speakable` not needed.
4. Puppy pages: keep WebPage; do NOT add Product/Offer. Optionally `mainEntity` Thing/Animal-free; no rich result available.
5. /galeria: ItemList of VideoObject (embed full VideoObject in list) for Video carousel eligibility; currently list items link to detail pages with VideoObject (adequate).
6. If genuine user Q&A pages ever exist, use QAPage, not FAQPage.
7. No Google Business-profile-specific properties needed (hasMap present). geo omitted by owner decision.

## Score: 80/100
Strong, consistent graph; deductions: duplicate Organization/contact conflict (-5), blog index relative images and missing author (-5), Offer without price in LocalBusiness (-4), FAQPage/decision contradiction in code (-3), minor consistency items (-3).
