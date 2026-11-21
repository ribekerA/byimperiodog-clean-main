import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const base = "http://localhost:3000";
const slug = "spitz-alemao-anao-merle-femea";
const photo = "/filhotes/merle/merle-femea-20261120-01.jpg";
const out = new URL("./", import.meta.url);
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    await context.route("**/*", (route) => {
      const request = route.request();
      const url = new URL(request.url());
      return url.origin !== base || request.method() !== "GET" || url.pathname.startsWith("/api/")
        ? route.abort() : route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    for (const path of ["/", "/filhotes", "/filhotes/sexo/femea", "/filhotes/cor/merle", "/filhotes/" + slug, "/blog/lulu-da-pomerania-merle", "/blog/cores-spitz-alemao-anao-qual-mais-cara"]) {
      const response = await page.goto(base + path, { waitUntil: "networkidle", timeout: 120000 });
      assert.equal(response.status(), 200, path);
      const reject = page.getByRole("button", { name: "Rejeitar", exact: true });
      if (await reject.isVisible()) await reject.click();
      if (path === "/" || path === "/filhotes") {
        const filter = page.getByRole("button", { name: "Merle", exact: true }).first();
        await filter.click();
        await expect(filter).toHaveAttribute("aria-pressed", "true");
      }
      if (path === "/" || path === "/filhotes" || path === "/filhotes/sexo/femea" || path === "/filhotes/cor/merle") {
        const link = page.locator('a[href="/filhotes/' + slug + '"]').first();
        await expect(link).toBeVisible();
        await link.scrollIntoViewIfNeeded();
        const card = link.locator("xpath=ancestor::li[1]");
        await expect(card).toContainText("Olhos Azuis");
        await expect(card).toContainText("A partir de");
        await expect(card).toContainText("6.500");
        await expect.poll(() => card.locator("img").first().evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
        await card.screenshot({ path: new URL("card-" + width + "-" + (path === "/" ? "home" : path.replaceAll("/", "-")) + ".png", out).pathname.replace(/^\/([A-Z]:)/, "$1") });
      }
      if (path === "/filhotes/" + slug) {
        await expect(page.locator("h1")).toContainText("Fêmea Merle Olhos Azuis");
        await expect(page.getByRole("button", { name: /^Ver foto [0-9]+$/ })).toHaveCount(13);
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(photo.replaceAll(".", "\\.")));
      }
      if (path === "/filhotes/cor/merle" || path === "/blog/lulu-da-pomerania-merle") {
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(photo.replaceAll(".", "\\.")));
        assert(!(await page.locator("body").innerText()).includes("As fotos desta cor ainda não foram publicadas"));
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, path + " overflow at " + width);
      if (path === "/filhotes/" + slug || path === "/filhotes/cor/merle") {
        await page.evaluate(() => scrollTo(0, 0));
        await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
        await page.screenshot({ path: new URL((path.includes("/cor/") ? "color" : "detail") + "-" + width + ".png", out).pathname.replace(/^\/([A-Z]:)/, "$1") });
      }
      results.push({ width, path, status: response.status(), overflow });
      console.log(width, path, "OK");
    }
    await context.close();
  }
  await fs.writeFile(new URL("validation.json", out), JSON.stringify({ base, results }, null, 2));
} finally {
  await browser.close();
}
