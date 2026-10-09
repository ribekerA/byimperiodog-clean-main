import { expect, test } from "@playwright/test";
import type { AxeResults } from "axe-core";

test.beforeEach(async ({ context, baseURL }) => {
  if (!baseURL || !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(baseURL)) {
    throw new Error("Testes de regressão apenas no build local");
  }
  await context.route("**/*", (route) => {
    const request = route.request();
    if (request.method() !== "GET" || new URL(request.url()).origin !== baseURL) return route.abort();
    return route.continue();
  });
});

test("catálogo prioriza somente a primeira foto sem trocar a capa", async ({ page }) => {
  await page.goto("/filhotes");
  const photos = page.locator("main article img");
  await expect(photos.first()).toHaveAttribute("fetchpriority", "high");
  await expect(photos.first()).toHaveAttribute("src", /branco-femea-jardim-20260926-04/);
  await expect(page.locator('main article img[fetchpriority="high"]')).toHaveCount(1);
  await expect(photos.nth(1)).toHaveAttribute("loading", "lazy");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`links editoriais legíveis com preferência ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/blog/preco-spitz-alemao-anao");
    await page.getByRole("button", { name: "Rejeitar", exact: true }).click();
    const link = page.locator(".prose a.link-brand").first();
    await link.scrollIntoViewIfNeeded();
    await expect(link).toHaveCSS("color", "rgb(4, 120, 87)");
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => {
      const axe = (window as unknown as { axe: { run: (node: Document, options: unknown) => Promise<AxeResults> } }).axe;
      return (await axe.run(document, { runOnly: ["color-contrast"] })).violations.map((v) => v.id);
    });
    expect(violations).toEqual([]);
  });
}
