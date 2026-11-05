import { mkdir, writeFile } from "node:fs/promises";

// Somente GET de URLs públicas; sem cookies, credenciais ou envio de contatos.
const urls = ["http://byimperiodog.com.br/", "https://www.byimperiodog.com.br/",
  "https://byimperiodog.com.br/", "https://byimperiodog.com.br/robots.txt",
  "https://byimperiodog.com.br/sitemap-index.xml", "https://byimperiodog.com.br/forensic-page-not-found-20260914"];
const results = [];
for (const url of urls) {
  try {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
    results.push({ url, status: response.status,
      headers: Object.fromEntries(["location", "strict-transport-security", "x-frame-options", "x-content-type-options", "referrer-policy", "content-security-policy", "cache-control", "content-type"].map((name) => [name, response.headers.get(name)])) });
    await response.body?.cancel();
  } catch (error) { results.push({ url, error: String(error) }); }
}
await mkdir(".audit-evidence", { recursive: true });
await writeFile(".audit-evidence/live-public-headers.json", JSON.stringify({ testedAt: new Date().toISOString(), note: "Produção anterior ao deploy deste delta", results }, null, 2));
console.log(JSON.stringify(results));
