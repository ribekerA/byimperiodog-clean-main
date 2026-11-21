# Local SEO - byimperiodog.com.br (2026-11-17)
Score: 71/100. GBP 18/25, Reviews 11/20, On-page 16/20, NAP 12/15, Schema 8/10, Authority 6/10.
Type: hybrid (visit by appointment, city-only address, ships Brazil-wide). Vertical: breeder (no dedicated schema type; LocalBusiness is acceptable).

## NAP
| Source | Name | Address | Phone |
| JSON-LD LocalBusiness | By Imperio Dog - Canil Spitz Alemao Anao Lulu da Pomeranica | Braganca Paulista, SP, BR (no street, by owner decision) | +55 11 96863-3239 |
| HTML / wa.me (34 links) | same | Braganca Paulista, SP | 5511968633239 (same) |
| Instagram bio (fetched) | n/a | Braganca Paulista, SP | none | site link ok |
| GBP (cid/placeid/kgmid in config) | Not verifiable (Maps is JS-rendered, fetch returned nothing) | - | - |
No discrepancies found on-site. Phone is a mobile/WhatsApp number; confirm identical on GBP.

## Findings
- [Medium] Contato page emits a second schema node `Organization` with no @id, same name/url as the global `#business` LocalBusiness (app/(public)/contato/page.tsx ~L99). Risks a split entity. Fix: add `@id` = BUSINESS_ID or drop it.
- [Medium] No aggregateRating in schema (deliberate, correct: self-serving). But no on-page review display was verified; the site links to GBP reviews (GOOGLE_REVIEWS_URL). Rating/count/velocity/response rate could not be read. Fix: show real GBP rating and count as visible text with link (not schema), only with real data; keep review-request flow (g.page/r link exists) running for steady velocity.
- [Medium] geo omitted by owner choice (city only). Acceptable; optionally add areaServed (Brazil + Braganca Paulista/Bragantina) to the LocalBusiness to express hybrid model. Not present in the emitted node.
- [Medium] Only @type LocalBusiness. Consider ["LocalBusiness","Store"] is NOT required; keep, but verify the GBP primary category (the #1 ranking factor) matches "Criador de caes"/"Pet breeder" and not "Pet store". Not verifiable from here.
- [Low] Citations: sameAs covers Instagram, GBP, Maps, YouTube, TikTok, Facebook, Pinterest. Not checked/found: Yelp, BBB (not relevant in BR). Better BR targets: Apontador, Telelistas, Guia Mais, CBKC kennel listing (registroCbkc 980/15 is in schema as identifier; link to the CBKC record if public), Bing Places, Apple Business Connect. Unverified.
- [Low] Dead domains: 0 occurrences in app/ or src/ (only in FINAL_CONSOLIDATED_AUDIT.md and scratchpad notes). Public citations pointing to canilspitzalemao / canillulupomerania could not be searched without a search API; manual check recommended (site:-search, GBP website field, Instagram link, directories). Instagram currently links www.byimperiodog.com.br: OK.
- [Low] Hours 8h-22h every day are in schema and /contato and Header; confirm GBP hours match, and that "by appointment" is stated (GBP "appointment required" attribute).
- [Info] Proximity (55% of ranking variance) is outside control; city-only address limits local-pack reach, so organic and service pages carry the load.

## Strengths
- Single global LocalBusiness @id with name, url, telephone, email, address(city/region/country), openingHoursSpecification, foundingDate 2013, sameAs, hasMap, identifier CBKC, makesOffer, logo, images.
- Local landing pages with real presence: /lulu-da-pomerania-braganca-paulista, /canil-spitz-alemao-interior-sp, /contato (all 200). Plus dedicated service/money pages (comprar-spitz-anao, preco-spitz-anao, criador-spitz-confiavel, reserve-seu-filhote). Dedicated service pages are the top local organic factor. No doorway city pages: keep it that way.
- Removed fabricated aggregateRating and "180+ familias" claim; compliant with no-invented-reviews rule.
- GBP linked: review link, reviews list, Maps profile, kgmid; Instagram active (about 3,005 followers).

## Top actions
1. High: Verify GBP primary category, hours, appointment attribute, website URL, phone against site (manual in GBP).
2. High: Search for citations with old domains (canilspitzalemao, canillulupomerania) in GBP, directories, social bios, YouTube descriptions; update or request removal; 301 from old domains if still owned.
3. Medium: Merge contato Organization node into #business via @id.
4. Medium: Show real GBP rating/count visibly (no schema), and keep a steady review-request cadence.
5. Medium: Add areaServed to the LocalBusiness (Brazil, Bragantina).
6. Low: Add Brazilian directory citations (Apontador, Telelistas, Guia Mais, Bing Places, Apple Business Connect) with identical NAP.
7. Low: Link the CBKC record if publicly verifiable.
8. Low: Embed Maps on /contato only if it does not expose the street (city-level view).

## Limitations
No DataForSEO or paid tools; GBP rating, count, velocity, category, and any old-domain citations could not be read (Maps is JS-rendered; no search API). Rendered with raw fetch (mode never); client-injected widgets not seen.
