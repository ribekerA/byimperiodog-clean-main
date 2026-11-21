# Technical SEO findings - byimperiodog.com.br (2026-11-17)

Score: 90/100. No Critical or High issues.

## Passed
- Crawlability: robots.txt has valid rules and declares 2 sitemaps. Both are valid (sitemap-index.xml is a sitemapindex, sitemap.xml is a urlset). All 96 URLs in sitemap.xml return 200 for the first 30 checked; the 31 URLs in posts.xml all return 200.
- Canonicals: self-referencing and consistent on the 30 sitemap pages sampled. Robots meta is index,follow with max-image-preview:large.
- HTTPS and redirects: http:// and www both go to the https apex in a single 301 hop. /preco-spitz-anao is a single redirect to /filhotes (intentional).
- Security headers: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP and HSTS are all present.
- TTFB: home is 0.05-0.07 s and sitemap pages are 0.04-0.55 s, served from the Netlify edge. The 2.4 s TTFB blocker is gone from the lab measurement. Field CRUX data is still needed to confirm.
- Rendering: SSR/prerendered HTML (x-nextjs-prerender: 1), lang=pt-BR, viewport correct, font preload, hero images preloaded, hashed assets immutable for 1 year.

## Issues
### Medium
1. HSTS has no includeSubDomains or preload. Evidence: the `Strict-Transport-Security: max-age=31536000` header on /. Fix: netlify.toml line ~330 should use `max-age=63072000; includeSubDomains; preload`. First confirm no subdomain is still on HTTP.
2. The sitemap-index.xml lists only 4 child sitemaps: sitemap.xml, posts, images and videos. app/sitemaps/ also has authors, categories, puppies and tags, which the index omits. Two readings are possible: they are intentionally excluded, or puppy/category/tag/author URLs are missing from discovery. Fix: confirm in app/sitemap-index.xml/route.ts that the omission is deliberate, or add them. Evidence: the sitemap-index.xml body.
3. The sitemap index shows `lastmod` 2026-11-17T16:50:07Z for sitemap.xml, which is the build time. That conflicts with the per-URL lastmod discipline in the notes. Evidence: sitemap-index.xml. Fix: derive the index entry from the max per-URL lastmod. images.xml also has no lastmod.

### Low
4. The 404 page emits two robots metas: `noindex` and `index, follow, max-image-preview:large`. Evidence: https://byimperiodog.com.br/zzz returns 404 and has both tags. Google takes the most restrictive, so noindex wins, but the layout default should not leak into not-found. Fix: set `robots: {index:false}` in the root not-found metadata and ensure the layout default is not merged.
5. The 404 TTFB is 0.7-1.2 s, slower than normal pages. Low impact.
6. Trailing slash: /filhotes/ returns a 308 to /filhotes with `Cache-Control: no-cache`. Correct, but the canonical is the non-slash form. No action needed unless internal links use trailing slashes.
7. CSP uses `script-src 'unsafe-inline'`, which is a tradeoff with GTM and the pixels. Consider nonces later.
8. Home HTML is 324 KB uncompressed (content-length), which is heavy. Cache-Control on HTML is `max-age=0,must-revalidate`, normal for Netlify with edge caching (cache hit seen).
9. robots.txt has a `Host:` directive, which Google ignores. Harmless.
10. Two sitemap declarations in robots.txt overlap, because sitemap.xml is both a child of the index and declared directly. Harmless.

## Not re-raised (per context)
lastmod coverage, the long-titles claim, the /preco-spitz-anao 308, admin noindex, and FAQPage removal.
Note: /admin returns a 307 to the login page, as in netlify.toml.

## Method notes
Fetched via curl. The sitemap_discovery.py helper confirmed both sitemaps are valid. The Playwright render was not needed because the HTML is SSR. No sandbox warning.
