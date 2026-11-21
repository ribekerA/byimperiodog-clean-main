# Performance / Core Web Vitals - byimperiodog.com.br (2026-11-17)

Method: Lighthouse (npx, headless Chrome, mobile preset, simulated Slow 4G + 4x CPU), 1 run per page, no consent given (so no GTM/GA4/Ads in the lab). Public PSI API returned 429 (no key, quota). No CrUX. Lab is a single noisy run; field baseline of 06/11/2026 is origin-wide, next fair comparison ~04/12/2026. No field regression conclusions.

## Lab results (mobile)
| Page | Score | LCP | FCP | TBT | CLS | Doc TTFB (lab) | Weight | DOM |
|---|---|---|---|---|---|---|---|---|
| / | 61 | 4.4 s | 1.6 s | 1030 ms | 0 | 10 ms | 848 KiB (img ~308 KB, JS 263 KB/23 files) | 1240 |
| /filhotes | 69 | 3.6 s | 1.7 s | 640 ms | 0.004 | 340 ms (1.4 s TTFB in LCP breakdown, see F2) | 729 KiB | 755 |
| /filhotes/spitz-alemao-anao-branco-macho | 64 | 4.1 s | 1.5 s | 960 ms | 0 | 390 ms | 758 KiB (img 210 KB, JS 286 KB/27) | 460 |
| /blog/nomes-lulu-da-pomerania | 65 | 3.3 s | 2.0 s | 1070 ms | 0 | 390 ms | 727 KiB | 568 |

Average ~65. LCP: poor on home and puppy page, needs improvement on the other two. TBT (INP proxy) 640-1070 ms is high; INP itself not measurable in lab. CLS passes everywhere. Warm curl TTFB from Netlify Edge: ~45-65 ms (home, /filhotes). Cold/miss paths: puppy page 210 ms, blog 620 ms (Edge miss, served from Netlify Durable cache). Cache-Control is `public,max-age=0,must-revalidate`; Edge ttl on home ~217 s, so frequent misses.

## LCP element and breakdown
All LCP elements are `<img fetchpriority="high">`, discoverable in HTML, not lazy.
- Home: puppy card image "Branco Macho" (next/image fill), 65 KB at w=768. TTFB 43 ms, load delay 58, load 56, element render delay 1151 ms.
- /filhotes: creme puppy photo 1024x600. TTFB 1439 ms (edge miss), load 213, render delay 988 ms.
- Puppy page: branco-macho-20261105-01.jpg at w=768, 106 KB JPEG. TTFB 430, delay 36, load 286, render delay 576.
- Blog: post cover 1400x933 JPEG, 132 KB at w=768, decoding="sync". TTFB 428, load 433, render delay 1492 ms.
Conclusion: discovery/network is not the bottleneck; the image is ready 0.5-1.5 s before it paints. Main thread (hydration + style/layout) blocks paint.

## Findings

F1 (High) Main thread blocked by hydration/script evaluation and style+layout; drives TBT and LCP render delay.
- Evidence: 8-14 long tasks per page; shared chunk `_next/static/chunks/2n_95vkrc_bfl.js` 1.0-2.8 s total, 0.6-1.5 s scripting, tasks 130-400 ms; `turbopack-*.js` runtime task 260-330 ms; `3reic5s-*.js` 3.8 s on puppy page; Style & Layout 2.1-5.2 s (simulated); HTML document boot-up 2.3-2.6 s on home/blog; unused JS 21-31 KiB, legacy JS ~13 KiB.
- Fix: run bundle analyzer to identify the shared chunk (likely site-wide components: `src/components/common/Header.tsx`, `Footer.tsx`, `src/components/PixelsByConsent.tsx`, root `src/app/layout.tsx`); load non-critical client widgets (cookie banner, WhatsApp bar, horario/visita strip, favorite buttons) with `next/dynamic` or after idle; keep above-the-fold as Server Components; break long tasks. Expected TBT -300 to -500 ms, LCP render delay about halved.

F2 (High) TTFB variance / cache misses (field blocker was 2.4 s TTFB). Warm hits are 45-65 ms today but misses 210-620 ms, and /filhotes showed 1.4 s in lab. Headers `public,max-age=0,must-revalidate`, short Edge ttl.
- Fix: `Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400` via `next.config.mjs` headers, or ISR `revalidate` + `revalidateTag` on puppy/blog edits; confirm `/filhotes`, `/filhotes/[slug]`, `/blog/[slug]` are not dynamic (cookies()/headers()/force-dynamic, per-request Supabase). Expected cold TTFB <200 ms.

F3 (Medium) Oversized LCP images. Puppy page `filhotes/branco/branco-macho-20261105-01.jpg` 106 KB (est. 78 KB saving); blog cover `filhotes/branco/branco-femea-jardim-01.jpg` 132 KB (est. 35 KB); home card `cartoes/preto-00.webp` 65 KB (est. 14 KB). Blog cover has decoding="sync".
- Fix: re-export as WebP/AVIF (`images.formats` in `next.config.mjs`), q 60-65, right `sizes` for mobile, drop decoding="sync" on blog cover. Expected LCP load -150-300 ms on 4G.

F4 (Medium) Home head preloads 8+ decorative images (coroa, louro-esq/dir, pata-esq/dir, selo-procedencia/acompanhamento) plus hero `topo-quatro`, competing with the real LCP card image; `coroa.webp` flagged on every page (9.5 KB, ~8.8 KB wasted). Preloaded hero (17 KB) is not the measured mobile LCP element; confirm intent.
- Fix: remove `rel=preload as=image` for decorative assets (components referencing `/images/home/*` in `src/`), recompress/resize coroa.webp, preload only the true LCP image.

F5 (Low, positive) Before consent: zero third-party hosts (all 868 KB first-party). `src/components/PixelsByConsent.tsx` injects GTM with `lazyOnload` only after analytics/marketing consent. Cost for consenting users NOT measured; CSP allows GTM, GA4, Ads, Meta, TikTok, Hotjar, Clarity, Pinterest. Recommend a second Lighthouse run with consent preset and review which tags GTM fires.

F6 (Low) Two render-blocking CSS files (`11g2kdom-i4jt.css`, `150rbmw1-ccpx.css`, est. 150 ms up to 2.5 s on puppy page); FCP 1.5-2.0 s. Fix: trim route CSS or try `experimental.inlineCss` in `next.config.mjs`.

Passing: CLS 0-0.004, font-display + preloaded woff2, DOM 460-1240 (<1500), LCP discovery, HTTPS/HSTS, edge caching active.

## Priority
1. F2 cache/ISR. 2. F1 hydration/long tasks. 3. F3 images. 4. F4 preloads. 5. F6 CSS. 6. Re-test with consent; compare field ~04/12/2026.

Estimated score: ~65/100 (lab, mobile, no consent).
Caveats: single run per page, simulated throttling inflates JS/layout time; no INP field data; first Lighthouse attempts failed with NO_NAVSTART and were rerun (valid runs used, with --throttling-method=simulate except blog default).

```json
{"performance":{"score":65,"pages":{"home":{"score":61,"lcp_s":4.4,"tbt_ms":1030,"cls":0},"filhotes":{"score":69,"lcp_s":3.6,"tbt_ms":640,"cls":0.004},"puppy":{"score":64,"lcp_s":4.1,"tbt_ms":960,"cls":0},"blog":{"score":65,"lcp_s":3.3,"tbt_ms":1070,"cls":0}},"findings":["F1 high hydration/long tasks","F2 high TTFB variance/cache","F3 medium image weight","F4 medium image preloads","F5 low third-party consent ok","F6 low render-blocking CSS"]}}
```
