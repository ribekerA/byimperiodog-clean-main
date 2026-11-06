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

// Desde o redesenho da vitrine (06/11/2026) a maior imagem da dobra é a foto do
// topo, não a do primeiro cartão: a prioridade mudou de dono, continua sendo uma só.
test("catálogo prioriza somente a foto do topo sem trocar a capa", async ({ page }) => {
  await page.goto("/filhotes");
  await expect(page.locator("main img.vt-topo-foto")).toHaveAttribute("fetchpriority", "high");
  await expect(page.locator('main img[fetchpriority="high"]')).toHaveCount(1);
  const photos = page.locator("main article img");
  await expect(photos.first()).toHaveAttribute("src", /branco-femea-jardim-20260926-04/);
  await expect(photos.first()).toHaveAttribute("loading", "lazy");
  await expect(photos.nth(1)).toHaveAttribute("loading", "lazy");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`links editoriais legíveis com preferência ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/blog/preco-spitz-alemao-anao");
    await page.getByRole("button", { name: "Rejeitar", exact: true }).click();
    const link = page.locator(".prose a.link-brand").first();
    await link.scrollIntoViewIfNeeded();
    // Verde da paleta creme (#17663d). Quem cobra a legibilidade é o axe, logo abaixo.
    await expect(link).toHaveCSS("color", "rgb(23, 102, 61)");
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => {
      const axe = (window as unknown as { axe: { run: (node: Document, options: unknown) => Promise<AxeResults> } }).axe;
      return (await axe.run(document, { runOnly: ["color-contrast"] })).violations.map((v) => v.id);
    });
    expect(violations).toEqual([]);
  });
}
