import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.AUDIT_ORIGIN ?? 'https://byimperiodog.com.br';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results: unknown[] = [];
try {
  for (const state of ['none', 'analytics', 'all']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    if (state !== 'none') await context.addInitScript((current) => {
      localStorage.setItem('byimperiodog_consent_v1', JSON.stringify({ necessary: true, functional: false, analytics: true, marketing: current === 'all', version: '1.0', timestamp: Date.now() }));
    }, state);
    const attempts: string[] = [];
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'ct.pinterest.com' || /\/g\/collect|\/ccm\/|\/pagead\//.test(url.pathname)) {
        attempts.push(url.hostname + url.pathname);
        return route.abort();
      }
      if (route.request().method() === 'POST') return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    await page.goto(origin, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(4000);
    const scripts = await page.locator('script[src]').evaluateAll((elements) => elements.map((element) => (element as HTMLScriptElement).src).filter((src) => /pinimg|googletagmanager/.test(src)));
    const pinterest = attempts.filter((url) => url.startsWith('ct.pinterest.com'));
    const result = { state, scripts, collectionAttempts: attempts, passed: state === 'all' ? pinterest.length > 0 : pinterest.length === 0 && !scripts.some((url) => url.includes('pinimg')) };
    results.push(result);
    console.log(JSON.stringify(result));
    await context.close();
    if (!result.passed) process.exitCode = 1;
  }
} finally {
  await browser.close();
  await mkdir('reports', { recursive: true });
  await writeFile('reports/consent-remediation-verification-20260913.json', JSON.stringify({ origin, testedAt: new Date().toISOString(), collectionIntercepted: true, results }, null, 2));
}
