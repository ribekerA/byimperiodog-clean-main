import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    context.setDefaultTimeout(30000);
    // Nunca carregar publicidade, chamar serviços pagos nem enviar contatos reais.
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'localhost' || /\/api\/(matchmaker|transcribe|leads|analytics|rum)/.test(url.pathname)) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    const response = await page.goto('http://localhost:3103/filhotes/sao-paulo', { waitUntil: 'domcontentloaded', timeout: 120000 });
    assert.equal(response.status(), 200);
    console.log(`Loaded catalog ${width}`);
    const search = page.getByLabel('O que você procura?', {exact: true});
    await page.getByRole('button', { name: 'Rejeitar', exact: true }).click();
    await search.fill('Quero uma fêmea branca até R$ 7.500');
    await page.waitForFunction(() => document.querySelector('#catalog-query-result')?.textContent.includes('referência(s)'));
    assert.match(await page.locator('#catalog-query-result').innerText(), /não confirma estoque/);
    await search.fill('Tem chocolate?');
    await page.waitForFunction(() => document.querySelector('#catalog-query-result')?.textContent.startsWith('0 referência'));
    assert.equal(await page.getByRole('link', { name: 'Confirmar opções atuais pelo WhatsApp' }).getAttribute('href').then(h=>h.startsWith('https://wa.me/5511968633239')), true);
    await search.fill('Vocês ficam perto de Atibaia?');
    assert.match(await page.locator('body').innerText(), /Bragança Paulista\/SP/);
    await search.fill('não quero branco');
    assert.match(await page.locator('#catalog-query-result').innerText(), /Não consegui interpretar/);
    await search.fill('');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    const axe = await page.evaluate(async () => window.axe.run(document.querySelector('#catalog-query').closest('section'), { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa'] } }));
    results.push({width,search:'passed',whatsappHref:'passed, not clicked',overflow:false,accessibilityViolations:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}))});
    await page.screenshot({path:`reports/master-seo-2026-11-03/catalog-${width}.png`,fullPage:false});
    await page.goto('http://localhost:3103/', {waitUntil:'domcontentloaded',timeout:120000});
    const reviews = page.locator('section[aria-labelledby="google-reviews-heading"]');
    await reviews.scrollIntoViewIfNeeded();
    assert.equal(await reviews.getByRole('link').getAttribute('href'), 'https://search.google.com/local/reviews?placeid=ChIJFwqx2DTLzpQRPZ-1dMMPGkA');
    await reviews.screenshot({path:`reports/master-seo-2026-11-03/google-${width}.png`});
    await context.close();
  }
} finally {
  await fs.writeFile('reports/master-seo-2026-11-03/browser-check.json',JSON.stringify(results,null,2));
  await browser.close();
}
console.log(JSON.stringify(results));
if(results.some(r=>r.accessibilityViolations.length)) process.exitCode=1;
