#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium, devices } from "playwright";

const phase = (process.argv[2] || "baseline").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
const baseUrl = (process.env.MIGRATION_AUDIT_URL || "http://localhost:3000").replace(/\/$/, "");
const outputDir = path.resolve("reports", "migration-next16", "screenshots");

const captures = [
  { name: "home-desktop", path: "/", device: "Desktop Chrome" },
  { name: "filhotes-desktop", path: "/filhotes", device: "Desktop Chrome" },
  { name: "blog-desktop", path: "/blog", device: "Desktop Chrome" },
  { name: "home-mobile", path: "/", device: "Pixel 5" },
  { name: "filhotes-mobile", path: "/filhotes", device: "Pixel 5" },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  for (const capture of captures) {
    const context = await browser.newContext({
      ...devices[capture.device],
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}${capture.path}`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.evaluate(async () => {
      const step = Math.max(240, Math.floor(window.innerHeight * 0.5));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 180));
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      await Promise.all(
        [...document.images]
          .filter((image) => !image.complete)
          .map((image) => Promise.race([
            image.decode().catch(() => undefined),
            new Promise((resolve) => setTimeout(resolve, 2_000)),
          ])),
      );
      window.scrollTo(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    });
    const outputPath = path.join(outputDir, `${phase}-${capture.name}.png`);
    await page.screenshot({ path: outputPath, fullPage: true, animations: "disabled" });
    console.log(`${capture.path} (${capture.device}) -> ${outputPath}`);
    await context.close();
  }
} finally {
  await browser.close();
}
