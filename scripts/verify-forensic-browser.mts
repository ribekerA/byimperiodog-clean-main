import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import type { AxeResults } from "axe-core";
import { chromium, firefox, webkit, type BrowserType } from "playwright";

const require = createRequire(import.meta.url);
const origin = process.env.AUDIT_ORIGIN ?? "http://localhost:3107";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) throw new Error("Este teste com fixtures só pode rodar localmente");
const output = ".audit-evidence/forensic-browser";
const reportPath = output + (process.env.AUDIT_BROWSERS ? "/results-filtered.json" : "/results.json");
await mkdir(output, { recursive: true });
const results: Record<string, unknown>[] = [];
const configurations: { name: string; engine: BrowserType; channel?: string; width: number; height: number; mobile?: boolean }[] = [
  { name: "chromium", engine: chromium, width: 1440, height: 900 },
  { name: "chrome", engine: chromium, channel: "chrome", width: 1440, height: 900 },
  { name: "edge", engine: chromium, channel: "msedge", width: 1440, height: 900 },
  { name: "firefox", engine: firefox, width: 1440, height: 900 },
  { name: "webkit", engine: webkit, width: 1440, height: 900 },
  { name: "chromium-mobile-emulated", engine: chromium, width: 390, height: 844, mobile: true },
  { name: "webkit-mobile-emulated", engine: webkit, width: 390, height: 844, mobile: true },
];
const routes = ["/", "/filhotes", "/filhotes/spitz-alemao-anao-branco-femea", "/preco-spitz-anao", "/blog", "/blog/preco-spitz-alemao-anao", "/contato"];
const selected = process.env.AUDIT_BROWSERS?.split(",");
for (const config of configurations.filter((c) => !selected || selected.includes(c.name))) {
  let browser;
  try { browser = await config.engine.launch({ headless: true, channel: config.channel }); }
  catch (error) {
    results.push({ browser: config.name, status: "BLOCKED", reason: String(error).split("\n")[0] });
    console.log(config.name + ": BLOCKED");
    continue;
  }
  try {
  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    isMobile: config.mobile, hasTouch: config.mobile, deviceScaleFactor: config.mobile ? 2 : 1,
  });
  let mockedLeads = 0;
  await context.route("**/*", async (route) => {
    const req = route.request();
    if (req.url() === origin + "/api/leads" && req.method() === "POST") {
      mockedLeads++;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, id: "forensic-local-fixture" }) });
    }
    // Nenhum lead, curtida, mensagem ou evento real é enviado.
    if (req.method() !== "GET" || new URL(req.url()).origin !== origin) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of routes) {
    const errorsBefore = errors.length;
    const limitations: Record<string, unknown>[] = [];
    try {
      const response = await page.goto(origin + path, { waitUntil: "domcontentloaded" });
      assert.equal(response?.status(), 200);
      await page.locator("h1").waitFor();
      await page.waitForTimeout(700);
      if (path === "/") {
        await page.getByRole("button", { name: "Rejeitar", exact: true }).click();
        const consent = await page.evaluate(() => JSON.parse(localStorage.getItem("byimperiodog_consent_v1") ?? "{}"));
        assert.equal(consent.marketing, false);
        assert.equal(consent.analytics, false);
        if (config.mobile) {
          await page.getByRole("button", { name: "Abrir menu de navegação" }).click();
          await page.getByRole("navigation", { name: "Navegação mobile" }).waitFor();
          await page.getByRole("button", { name: "Fechar menu", exact: true }).click();
        }
      }
      const facts = await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
        robots: document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content,
        structured: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? "{}")),
        visibleImageFailures: [...document.querySelectorAll<HTMLImageElement>("main img")].filter((img) => {
          const box = img.getBoundingClientRect();
          return box.bottom > 0 && box.top < innerHeight && box.width > 0 && img.complete && !img.naturalWidth;
        }).map((img) => img.getAttribute("src")),
        waLinks: [...document.querySelectorAll<HTMLAnchorElement>('a[href*="wa.me/"]')].map((a) => a.href),
      }));
      assert.equal(facts.h1, 1);
      assert.equal(facts.overflow, false);
      assert.equal(facts.canonical?.replace(/\/$/, ""), ("https://byimperiodog.com.br" + path).replace(/\/$/, ""));
      assert.match(facts.robots ?? "", /max-image-preview:large/);
      assert.equal(facts.visibleImageFailures.length, 0);
      assert.ok(facts.waLinks.length > 0);
      if (path.includes("branco-femea")) {
        const text = await page.locator("main").innerText();
        assert.match(text, /R\$ 8\.500/);
        assert.match(text, /R\$ 9\.200/);
        await page.getByRole("button", { name: "Ampliar foto", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: /^Galeria de/ });
        await dialog.waitFor();
        await page.keyboard.press("Tab");
        assert.equal(await dialog.evaluate((node) => node.contains(document.activeElement)), true);
        await page.getByRole("button", { name: "Fechar galeria", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        await page.getByRole("button", { name: /^Ver 4 vídeos/ }).click();
        const video = page.locator("video:visible").first();
        await video.waitFor();
        const playback = await video.evaluate(async (node) => {
          const v = node as HTMLVideoElement;
          v.muted = true;
          try { await v.play(); await new Promise((resolve) => setTimeout(resolve, 400)); v.pause(); return { playable: true, readyState: v.readyState }; }
            catch (error) {
              return { playable: false, error: String(error), mediaError: v.error?.code,
                canPlayH264: v.canPlayType('video/mp4; codecs="avc1.42E01E"') };
            }
        });
        if (!playback.playable && config.engine === webkit && playback.canPlayH264 === "") {
          limitations.push({ check: "video-playback", status: "BLOCKED", reason: "WebKit instalado não oferece H.264 neste sistema; Safari real ainda não testado", ...playback });
        } else {
          assert.equal(playback.playable, true, "Reprodução: " + JSON.stringify(playback));
        }
        if (config.mobile) {
          await page.getByRole("button", { name: "Ver fotos", exact: true }).first().click();
        }
      }
      if (path === "/contato") {
        await page.locator("#contato-nome").fill("Teste local da auditoria");
        await page.locator("#contato-telefone").fill("11900000000");
        await page.locator("#contato-cidade").fill("Bragança Paulista");
        await page.locator("#contato-estado").selectOption("SP");
        await page.locator("#contato-consent").check();
        const previous = mockedLeads;
        await page.locator('form:has(#contato-nome) button[type="submit"]').click();
        await page.waitForTimeout(600);
        assert.equal(mockedLeads, previous + 1, "Formulário deve chamar apenas a API interceptada");
      }
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      const a11y = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: { run: (node: Document, options: unknown) => Promise<AxeResults> } }).axe;
        const report = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
        return report.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));
      });
      assert.deepEqual(a11y, []);
      assert.deepEqual(errors.slice(errorsBefore), []);
      const status = limitations.length ? "PARTIAL" : "PASS";
      results.push({ browser: config.name, version: browser.version(), path, status, ...facts, a11y, limitations });
      console.log(config.name + " " + path + ": " + status);
    } catch (error) {
      results.push({ browser: config.name, path, status: "FAIL", reason: String(error), errors: errors.slice(errorsBefore) });
      console.log(config.name + " " + path + ": FAIL " + String(error).slice(0,300));
      await page.screenshot({ path: output + "/" + config.name + "-" + path.replaceAll("/", "_") + ".png" }).catch(() => {});
    }
  }
  if (config.name === "webkit-mobile-emulated" || config.name === "chromium-mobile-emulated") {
    for (const [width, height] of [[320,844],[360,844],[375,844],[412,844],[430,932],[820,1180],[1180,820]]) {
      await page.setViewportSize({ width, height });
      await page.goto(origin + "/filhotes/spitz-alemao-anao-branco-femea");
      await page.waitForTimeout(350);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      results.push({ browser: config.name, viewport: { width, height }, status: overflow ? "FAIL" : "PASS", check: "horizontal-overflow" });
    }
  }
  } catch (error) {
    results.push({ browser: config.name, status: "BLOCKED", reason: String(error).slice(0, 1000) });
    console.log(config.name + ": BLOCKED " + String(error).split("\n")[0]);
  } finally {
    await browser.close().catch(() => {});
    await writeFile(reportPath, JSON.stringify({ testedAt: new Date().toISOString(), origin, results }, null, 2));
  }
}
await writeFile(reportPath, JSON.stringify({ testedAt: new Date().toISOString(), origin, results }, null, 2));
const counts = results.reduce<Record<string, number>>((all, r) => ({ ...all, [String(r.status)]: (all[String(r.status)] ?? 0) + 1 }), {});
console.log(JSON.stringify(counts));
if (counts.FAIL) process.exitCode = 1;
