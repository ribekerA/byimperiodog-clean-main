import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import type { AxeResults } from 'axe-core';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const origin = process.env.AUDIT_ORIGIN ?? 'http://localhost:3107';
const output = '.audit-evidence';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results: unknown[] = [];
try {
  for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
    // Never create leads, likes or analytics/conversion records while auditing.
    await context.route('**/*', (route) => {
      const request = route.request();
      if (request.method() !== 'GET' || /google-analytics|googletagmanager|googleadservices|doubleclick|pinimg|pinterest|facebook|tiktok/.test(request.url())) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    const routes = width === 390 ? ['/filhotes', '/filhotes/spitz-alemao-anao-preto-femea', '/blog/preco-spitz-alemao-anao', '/blog/cores-spitz-alemao-anao-qual-mais-cara', '/preco-spitz-anao', '/pomeranian', '/contato'] : ['/filhotes/spitz-alemao-anao-branco-femea'];
    for (const path of routes) {
      await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.waitForTimeout(1600);
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const result = await page.evaluate(async () => {
        const main = document.querySelector('main') ?? document.body;
        const cta = main.querySelector<HTMLAnchorElement>('a[data-wa-placement="puppy_page"], a[data-wa-placement="hero"]');
        const banner = document.querySelector('[aria-labelledby="consent-title"]');
        const rect = cta?.getBoundingClientRect();
        const issues = await (window as unknown as { axe: { run: (node: Document, options: unknown) => Promise<AxeResults> } }).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
        return {
          title: document.title,
          canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
          h1: [...document.querySelectorAll('h1')].map((e) => e.textContent),
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          primaryCta: rect ? { top: rect.top, bottom: rect.bottom, inViewport: rect.top >= 0 && rect.bottom <= innerHeight } : null,
          bannerHeight: banner?.getBoundingClientRect().height ?? 0,
          displayedPrices: [...(main.textContent ?? '').matchAll(/R\$\s*[\d.]+/g)].map((m) => m[0]),
          issues: issues.violations.map((v) => ({ id: v.id, impact: v.impact, elements: v.nodes.map((n) => n.target) })),
        };
      });
      results.push({ width, path, ...result });
      console.log(JSON.stringify({ width, path, ...result }));
      if (width === 320 || path.includes('preto-femea')) await page.screenshot({ path: output + '/ui-' + width + '-' + path.replaceAll('/', '_') + '.png' });
    }
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(output + '/ui-verification.json', JSON.stringify(results, null, 2));
