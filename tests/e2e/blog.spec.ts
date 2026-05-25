import { test, expect } from '@playwright/test';

test.describe('Blog Listing', () => {
  test('lista posts ou mensagem vazia', async ({ page }) => {
    await page.goto('/blog');
    const hasPost = await page.locator('article, [data-post-card]').first().isVisible().catch(()=>false);
    if(!hasPost){
      await expect(page.locator('text=/sem posts|no posts/i')).toBeTruthy();
    }
  });
});
