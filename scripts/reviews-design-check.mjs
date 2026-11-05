import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1100 }, reducedMotion: 'reduce' });
    context.setDefaultTimeout(30000);
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.hostname !== 'localhost' || /\/api\/(rum|analytics|leads|matchmaker|transcribe)/.test(url.pathname) ? route.abort() : route.continue();
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3103/', { waitUntil: 'networkidle', timeout: 120000 });
    const reject = page.getByRole('button', { name: 'Rejeitar', exact: true });
    if (await reject.count()) { await reject.click(); await expect(reject).toBeHidden(); }
    // Preservar content-visibility/contain reais durante a verificação de layout.
    await page.addStyleTag({ content: 'nextjs-portal {display:none !important}' });
    const section = page.locator('section[aria-labelledby="family-stories-heading"]');
    await section.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const list = section.getByRole('list');
    await expect(list.locator('li[data-review-source="google"]')).toHaveCount(33);
    await expect(list.locator('li')).toHaveCount(48);
    await expect(section.getByText('35 avaliações no Google', { exact: true })).toBeVisible();
    await expect(section.getByText('4,9', { exact: true })).toBeVisible();
    await section.getByRole('button', { name: 'Próximo depoimento' }).click();
    await expect.poll(() => list.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    await section.getByRole('button', { name: 'Depoimento anterior' }).click();
    await expect.poll(() => list.evaluate(el => el.scrollLeft)).toBeLessThan(2);
    const expand = list.locator('li[data-review-source="google"]').first().getByRole('button');
    await expand.click();
    await expect(expand).toHaveAttribute('aria-expanded', 'true');
    await expand.click();
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector('section[aria-labelledby="family-stories-heading"]'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id));
    assert.equal(violations.length, 0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false);
    // Evitar sobreposição do menu fixo na captura da seção (após os testes).
    await page.addStyleTag({ content: 'header, a[href="#conteudo-principal"] {visibility:hidden !important}' });
    await section.screenshot({ path: `reports/reviews-design/google-reviews-${width}.png` });
    results.push({ width, cards: await list.locator('li').count(), overflow, carousel: 'passed', violations });
    await context.close();
  }
  await fs.writeFile('reports/reviews-design/google-import-validation.json', JSON.stringify(results, null, 2));
  console.log(results);
} finally { await browser.close(); }
