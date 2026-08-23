import { expect, test } from '@playwright/test';

const EXPECTED_NAMES = [
  'Ana Paula M.',
  'Marina S.',
  'Lucas & Família',
  'Fernanda L.',
  'João',
  'Lívia',
  'Patrícia',
  'Paula',
  'Ricardo',
  'Roberto',
  'Bruno e família',
  'Camila',
  'Ana Paula',
  'Ronaldo',
] as const;

test.describe('Depoimentos da home', () => {
  test('mantém fotos e nomes na sequência definida pelo canil', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(async () => {
      const step = Math.max(240, Math.floor(window.innerHeight * 0.5));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
    });

    const sectionTitle = page.getByRole('heading', {
      name: 'Famílias que já receberam um filhote da By Império Dog',
    });
    await sectionTitle.scrollIntoViewIfNeeded();
    await expect(sectionTitle).toBeVisible();

    const testimonials = page.getByRole('list', { name: 'Depoimentos de clientes' });
    const cards = testimonials.getByRole('listitem');
    await expect(cards).toHaveCount(EXPECTED_NAMES.length);

    const images = testimonials.locator('img');
    await expect(images).toHaveCount(EXPECTED_NAMES.length);

    const renderedImages = await images.evaluateAll((elements) =>
      elements.map((image) => ({
        name: image.getAttribute('alt'),
        src: image.getAttribute('src'),
      })),
    );
    expect(renderedImages.map(({ name }) => name)).toEqual(EXPECTED_NAMES);
    expect(renderedImages.every(({ src }) => src?.includes('/_next/image'))).toBe(true);
  });
});
