import { test, expect } from '@playwright/test';

/**
 * O breakpoint da navegação é `lg` (1024px). Acima dele o Header mostra
 * `<nav aria-label="Navegação principal">`; abaixo, esse nav fica `hidden` e o
 * visitante navega pelo botão que abre o menu.
 *
 * A asserção original cobrava a nav "principal" visível em qualquer projeto —
 * markup de desktop cobrado de um Pixel 5. O teste reprovava sem que nada
 * estivesse quebrado e, pior, não encostava no caminho que o visitante de
 * celular realmente usa. Agora cada largura é verificada pelo que existe nela,
 * e o menu mobile passou a ser aberto de verdade: se o botão parar de abrir o
 * menu, isso agora reprova.
 */
const LARGURA_DESKTOP = 1024;

test.describe('Home', () => {
  test('carrega título e navegação', async ({ page }) => {
    const runtimeErrors: Error[] = [];
    page.on('pageerror', (error) => runtimeErrors.push(error));

    await page.goto('/');
    await expect(page).toHaveTitle(/Império Dog/i);

    const largura = page.viewportSize()?.width ?? LARGURA_DESKTOP;

    if (largura >= LARGURA_DESKTOP) {
      await expect(page.getByRole('navigation', { name: /principal/i })).toBeVisible();
    } else {
      const abrirMenu = page.getByRole('button', { name: /abrir menu de navega/i });
      await expect(abrirMenu).toBeVisible();
      await abrirMenu.click();

      const navMobile = page.getByRole('navigation', { name: /mobile/i });
      await expect(navMobile).toBeVisible();
      await expect(navMobile.getByRole('link').first()).toBeVisible();
    }

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
