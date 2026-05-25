import { test, expect } from '@playwright/test';
import fs from 'node:fs';

function firstLocalPostSlug(): string | null {
  const dir = 'content/posts';
  if(!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.mdx'));
  if(!files.length) return null;
  return files[0].replace(/\.mdx$/, '');
}

const slug = firstLocalPostSlug();

test.describe('Blog Post', () => {
  test.skip(!slug, 'Nenhum MDX local encontrado para teste de post');
  test('renderiza conteúdo principal', async ({ page }) => {
    await page.goto(`/blog/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Verificação básica de meta (client-side acessível via document.title)
    await expect(page).toHaveTitle(/.+/);
  });
});
