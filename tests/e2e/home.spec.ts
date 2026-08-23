import { test, expect } from '@playwright/test';

test.describe('Home', () => {
  test('carrega título e navegação', async ({ page }) => {
    const runtimeErrors: Error[] = [];
    page.on('pageerror', (error) => runtimeErrors.push(error));

    await page.goto('/');
    await expect(page).toHaveTitle(/Império Dog/i);
    const nav = page.getByRole('navigation', { name: /principal/i });
    await expect(nav).toBeVisible();
    await page.waitForTimeout(1_000);

    expect(
      runtimeErrors.map((error) => error.message),
      'A home não deve gerar erros JavaScript no navegador',
    ).toEqual([]);
  });

  test('mantém vídeo e tags opcionais fora do carregamento inicial', async ({ page }) => {
    let videoRequested = false;
    const optionalThirdPartyRequests: string[] = [];

    await page.route('**/filhotes/videos/apresentacao-canil.mp4', async (route) => {
      videoRequested = true;
      await route.abort();
    });
    page.on('request', (request) => {
      const url = request.url();
      if (/googletagmanager|google-analytics|pinimg|facebook\.net|tiktok\.com/i.test(url)) {
        optionalThirdPartyRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2_500);

    expect(videoRequested, 'o MP4 de 25 MB não deve baixar automaticamente').toBe(false);
    expect(optionalThirdPartyRequests, 'pixels opcionais exigem consentimento').toEqual([]);
    await expect(page.locator('img[fetchpriority="high"]')).toBeVisible();

    await page.getByRole('button', { name: 'Reproduzir vídeo' }).click();
    await expect.poll(() => videoRequested).toBe(true);
  });
});
