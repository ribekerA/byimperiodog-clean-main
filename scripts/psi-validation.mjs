#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const AUDIT_PATHS = [
  "/", "/filhotes", "/filhotes/spitz-alemao-anao-branco-femea",
  "/reserve-seu-filhote", "/blog/preco-spitz-alemao-anao", "/filhotes/sao-paulo",
];

export function psiURL(url, strategy, key = "") {
  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", url);
  api.searchParams.set("strategy", strategy);
  for (const category of ["performance", "seo", "accessibility", "best-practices"]) {
    api.searchParams.append("category", category);
  }
  if (key) api.searchParams.set("key", key);
  return api;
}

export function summarizeLighthouse(lhr) {
  const number = (id) => lhr?.audits?.[id]?.numericValue ?? null;
  const score = (id) => {
    const value = lhr?.categories?.[id]?.score;
    return typeof value === "number" ? Math.round(value * 100) : null;
  };
  return {
    source: "Lighthouse laboratory; INP requires field data",
    fetchedAt: lhr?.fetchTime ?? null,
    version: lhr?.lighthouseVersion ?? null,
    finalUrl: lhr?.finalDisplayedUrl ?? lhr?.finalUrl ?? null,
    performance: score("performance"), seo: score("seo"),
    accessibility: score("accessibility"), bestPractices: score("best-practices"),
    lcpMs: number("largest-contentful-paint"), cls: number("cumulative-layout-shift"),
    tbtMs: number("total-blocking-time"), inpMs: null,
    runtimeError: lhr?.runtimeError ?? null,
  };
}

export function summarizeField(experience) {
  const metrics = experience?.metrics;
  if (!metrics || !Object.keys(metrics).length) return { status: "SEM DADOS SUFICIENTES" };
  return {
    status: "CrUX p75", id: experience.id, overallCategory: experience.overall_category,
    lcpMs: metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? null,
    inpMs: metrics.INTERACTION_TO_NEXT_PAINT?.percentile ?? null,
    // PSI exposes this metric multiplied by 100, unlike Lighthouse.
    cls: typeof metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile === "number"
      ? metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100 : null,
  };
}

async function main() {
  const domain = new URL(process.argv[2] || process.env.PSI_ORIGIN || "https://byimperiodog.com.br").origin;
  const directory = path.resolve(process.env.PSI_OUTPUT_DIR || ".audit-evidence/psi");
  await mkdir(directory, { recursive: true });
  const report = { testedAt: new Date().toISOString(), domain, results: [] };
  for (const route of AUDIT_PATHS) {
    for (const strategy of ["mobile", "desktop"]) {
      const url = domain + route;
      const result = { url, strategy };
      try {
        const response = await fetch(psiURL(url, strategy, process.env.PSI_API_KEY), { signal: AbortSignal.timeout(90000) });
        if (!response.ok) throw new Error(`PSI HTTP ${response.status}`);
        const data = await response.json();
        const filename = `${route === "/" ? "home" : route.slice(1).replaceAll("/", "_")}-${strategy}.json`;
        await writeFile(path.join(directory, filename), JSON.stringify(data, null, 2));
        if (!data.lighthouseResult) throw new Error("PSI returned no Lighthouse result");
        Object.assign(result, {
          status: data.lighthouseResult.runtimeError ? "ERROR" : "MEASURED",
          laboratory: summarizeLighthouse(data.lighthouseResult),
          fieldUrl: summarizeField(data.loadingExperience),
          fieldOrigin: summarizeField(data.originLoadingExperience),
          raw: filename,
        });
      } catch (error) {
        Object.assign(result, { status: "NÃO MEDIDO", error: error.message });
      }
      report.results.push(result);
      console.log(`${strategy} ${route}: ${result.status}`);
      await writeFile(path.join(directory, "summary.json"), JSON.stringify(report, null, 2));
    }
  }
  if (report.results.some((result) => result.status !== "MEASURED")) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
