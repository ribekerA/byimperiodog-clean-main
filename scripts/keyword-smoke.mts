import assert from "node:assert/strict";

import { chromium } from "playwright";

import { puppiesPublicados } from "../content/puppies-static";
import { puppySearchCopy } from "../content/puppy-search-copy";
import { SEARCH_CLUSTERS, SEARCH_TOPICS } from "../content/search-topics";
import { formatarPreco } from "../src/domain/pricing";

// Só diagnóstico local. Não envia formulários, aceita cookies ou abre WhatsApp.
const origin = process.argv[2] ?? "http://127.0.0.1:3106";
assert(["127.0.0.1", "localhost"].includes(new URL(origin).hostname), "Use apenas servidor local neste teste de interface.");
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage();
  for (const path of ["/guias", "/filhotes", "/preco-spitz-anao", "/blog/nomes-lulu-da-pomerania", "/blog/spitz-alemao-anao-bom-para-apartamento"]) {
    const response = await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200, path);
    assert.equal(await page.locator("h1").count(), 1, `H1 único em ${path}`);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), `https://byimperiodog.com.br${path}`);
    assert(await page.locator('meta[name="description"]').getAttribute("content"), `Descrição em ${path}`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `Layout mobile em ${path}`);
    if (path === "/guias") {
      for (const cluster of SEARCH_CLUSTERS) assert.equal(await page.locator(`#temas-${cluster.id}`).count(), 1);
      for (const topic of SEARCH_TOPICS) assert(await page.locator(`main a[href="${topic.href}"]`).count(), `Link para ${topic.href}`);
    }
    if (path.endsWith("bom-para-apartamento")) assert(await page.locator('aside[aria-label="Links relacionados"] a[href="/blog/spitz-alemao-anao-latido"]').count());
    console.log(`OK mobile, H1 e canonical: ${path}`);
  }
  for (const puppy of puppiesPublicados) {
    const response = await page.goto(`${origin}/filhotes/${puppy.slug}`, { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal((await page.locator("h1").innerText()).trim(), puppySearchCopy(puppy)?.heading);
    assert((await page.title()).includes(formatarPreco(puppy.priceCents)), puppy.slug);
    console.log(`OK título, H1 e preço: ${puppy.slug}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/guias`, { waitUntil: "domcontentloaded" });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  console.log("OK desktop. Nenhum formulário enviado ou acesso a terceiros permitido.");
} finally {
  await browser.close();
}
