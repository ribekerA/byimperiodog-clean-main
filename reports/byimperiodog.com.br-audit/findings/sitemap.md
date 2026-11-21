# Sitemap findings - byimperiodog.com.br (2026-11-17)
Score: 88/100

Structure: robots.txt declares /sitemap-index.xml and /sitemap.xml. Index lists sitemap.xml (96 URLs), sitemaps/posts.xml (31), images.xml (23 pages), videos.xml (13). All valid XML, 200, no cross-host, no invalid locs, far below 50k/50MB.

PASS: all 96 URLs (95 fetched by loop + root) return 200 with no redirect; canonical self (home canonical has no trailing slash = equivalent); no noindex meta, no X-Robots-Tag. /preco-spitz-anao (308 to /filhotes) is absent. Crawl of 8 hub pages found no indexable internal link missing from the sitemap. /feed.xml 200 application/rss+xml, 31 items, advertised via rel=alternate. Image URLs and mp4 files sampled return 200; video entries have thumbnail, title, description, duration, date.

Findings
1. Medium - Redundant/duplicate listing: the 31 blog posts are in both sitemap.xml and posts.xml (67 cross-file duplicates in totals; 163 listed vs 96 unique), and sitemap.xml is also in the index while robots.txt lists both. Harmless but noisy; lastmod for same URL may differ. Fix: drop posts (and galeria/filhotes duplicated by images/videos if desired) from app/sitemap.ts or from the index, keep one source.
2. Medium - lastmod clusters: top values are 2025-06-01T00:00:00Z x21 (blog posts, looks like a placeholder date rather than a real edit), and today (2026-11-17) clusters 09:46:26Z x12, 13:23:05Z x9, 13:24:26Z x9, 14:23:41Z x5, 16:50:07Z x10 (about 46 of 96 URLs dated today). Verified they map to real commits (e.g. 16:50Z = 13:50-03 commit 5ef2848; 14:23Z = 11:23 commit eb82b41), so this is NOT build-time stamping; but shared-section edits (cookie banner, import order, cache) bump many routes at once, and 12 routes at 09:46Z are suspicious for non-content commits. Google may discount lastmod if pages did not materially change. Fix: narrow gen-lastmod content folders (exclude src/components/sections shared chrome) so only text changes bump; give blog posts real updatedAt instead of 2025-06-01.
3. Low - Format inconsistency: lastmod mixes date-only (2025-05-01, 2026-05-25, 12 URLs) and full datetime; both valid W3C. Index lastmod for images.xml is missing and sitemap.xml index lastmod (16:50:07Z) is newer than the live commit set (latest repo commit 14:16-03 not yet reflected = deploy lag, verify).
4. Low/Info - priority and changefreq present on all 96 URLs (ignored by Google); can remove from app/sitemap.ts and next-sitemap config. Also images.xml has no lastmod per URL (optional).
5. Info - app/sitemaps/{puppies,authors,categories,tags}.xml routes respond 200 but contain 0 URLs and are not in the index. Remove or leave unlisted; empty sitemaps if ever submitted would show warnings.
6. Info - Video sitemap pages (/galeria/*) are also in sitemap.xml: good. /galeria page itself has no VideoObject JSON-LD detected (0 matches on the listing); check detail pages if rich results are desired.
7. Info - Location pages: /filhotes/{sao-paulo,minas-gerais,rio-de-janeiro,...} plus Braganca Paulista variants are well under the 30-page gate; keep content unique per state.

Common-path probes (sitemap_index.xml, wp-sitemap.xml) return 404: expected.
