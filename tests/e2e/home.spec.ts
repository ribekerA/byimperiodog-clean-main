import { test, expect } from '@playwright/test';

test.describe('Home', () => {
  test('carrega título e navegação', async ({ page }) => {
    await page.goto('/');
  await expect(page).toHaveTitle(/Imperio Dog/i);
  const nav = page.getByRole('navigation', { name: /principal/i });
  await expect(nav).toBeVisible();
  });
});
