# Visual / mobile audit - byimperiodog.com.br (2026-11-17)
Pages: /, /filhotes, /filhotes/spitz-alemao-anao-branco-macho, /blog/preco-spitz-alemao-anao, /contato. Desktop 1366x768 and mobile 375x812 (DPR 2, touch), first visit (cookie banner shown). Screenshots in ../screenshots/ (*-desktop-atf.png, *-mobile-atf.png, home-*-full.png).
Score: 80/100

## Above the fold
- H1 present on all 5 pages, exactly one each, visible without scroll on desktop and mobile.
- WhatsApp CTA: desktop has header button "Conversar agora" on every page (48px). Mobile: no inline WhatsApp CTA above the fold on / (first at y=942), /filhotes (first at y=804) or /blog (y=7741); only the floating green bubble (57px, bottom-right, home/blog/contact) and, on /filhotes, NO bubble at all. Puppy page ("Ver disponibilidade", y=519) and contact ("Abrir WhatsApp agora", y=390) are good.
- Price: puppy page shows "A partir de R$ 4.500 no PIX" in the first screen on both viewports (good, with Pix logo). Home shows "Machos a partir de R$ 4.500 no PIX / Femeas a partir de R$ 6.500 no PIX" above the fold on mobile; on desktop 1366x768 the price cards are cut by the fold and covered by the cookie banner. /filhotes cards and blog show no price in the visible text.
- The "faixa de horario e visita" bar (commit 5fbf93a) was not seen at the top of any page live; the only hours text found is on /contato. Possibly not yet deployed - confirm.

## Cookie banner (first visit)
- Mobile: fixed bottom, 154px = 19% of the 812px viewport, three buttons wrapping onto 2 rows (Preferencias, Rejeitar / Aceitar Todos). Covers the lower part of every first screen (puppy photo, price cards, "Ver disponibilidade" on slow scroll). Not a Google interstitial violation (partial, bottom, legally required) but heavy. Floating WhatsApp bubble sits just above it (no overlap).
- Desktop: 97px bar, covers the home price cards (y 671-768).
- No other interstitial/modal/dialog found.

## Mobile
- No horizontal scroll: scrollWidth 375 on all pages. Overflowing elements found are inside horizontal carousels / chip rows (home testimonials carousel, /filhotes color-filter chips, puppy thumbnails) - intentional.
- Base font 16px. Hamburger present.
- Tap targets under 44px: /filhotes filter chips 36px tall (home 28px tall: Todos/Branco/Laranja/Preto/Creme/Particolor/Chocolate/Merle); puppy page breadcrumb links 17px tall, "Cor"/"Macho" tags 27px, gallery dots 24x44 wide x tall (8 dots 24px wide); blog breadcrumb 21px, author link 19px, inline links 17-24px, source links 17px; contact form checkbox 13x16 and privacy link 16px, "Ver perfil no Google" 19px; carousel controls 40x40 (home, desktop and mobile); footer nav links 36px on desktop.
- Home mobile page height ~15,000px with 10 near-identical "Ver disponibilidade" cards.

## Issues (severity, fix)
1. MEDIUM - Mobile above-the-fold has no inline WhatsApp CTA on /, /filhotes, blog; /filhotes has no floating bubble. Fix: show the floating bubble on /filhotes too, or add a compact "Conversar agora" button to the mobile header next to the hamburger (without redesigning the home hero).
2. MEDIUM - Cookie banner takes 19% of mobile viewport. Fix: put the 3 buttons on one row (shorter copy, smaller padding), target <=110px height.
3. LOW/MEDIUM - Tap targets <44px: filter chips (min-height 44px), gallery dots (hit area 44x44 via padding), breadcrumbs, consent checkbox (increase label hit area), carousel arrows 40->44.
4. LOW - Home desktop 1366x768: price cards fold-cut and hidden under the cookie banner on first visit.
5. LOW - "faixa de horario e visita" not visible live; verify deploy.
6. INFO - /filhotes and blog pages have no visible "A partir de R$ X no PIX" (ok if intentional; puppy and home carry it).
Sandbox note: rendered with the project's local Playwright Chromium (default launch), not the plugin renderer (the plugin runtime lacked playwright).
