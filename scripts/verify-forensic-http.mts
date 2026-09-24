import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const origin = process.env.AUDIT_ORIGIN ?? "http://localhost:3107";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) throw new Error("Smokes internos somente locais");
await mkdir(".audit-evidence", { recursive: true });
async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((e) => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]))).flat();
}
const results: Record<string, unknown>[] = [];
const admin = (await files("app/api/admin")).filter((f) => f.endsWith("route.ts"))
  .map((file) => "/" + file.replaceAll("\\", "/").replace(/^app\//, "").replace(/\/route.ts$/, "").replace(/\[[^\]]+\]/g, "forensic-invalid"))
  .filter((path) => !["/api/admin/login", "/api/admin/logout"].includes(path));
for (const path of admin) {
  const response = await fetch(origin + path, { redirect: "manual" });
  results.push({ check: "unauthenticated-admin-api", path, status: response.status, pass: [401, 403].includes(response.status) });
}
for (const path of ["/admin", "/admin/contracts", "/admin/blog/preview/forensic-invalid", "/blog/preview/forensic-invalid", "/contract/1", "/contract/" + "A".repeat(32) + "/documento"]) {
  const response = await fetch(origin + path, { redirect: "manual" });
  const body = await response.text();
  const noindex = /noindex/.test(body) || /noindex/.test(response.headers.get("x-robots-tag") ?? "");
  const noPersonalData = !/Assinatura do comprador|CPF:|hemograma_path|signature_path|service_role/.test(body);
  const denied = [401, 403, 404].includes(response.status) || ([307, 308, 303].includes(response.status) && (response.headers.get("location") ?? "").includes("/admin/login"));
  const privateHeaders = !path.startsWith("/contract/") || (
    response.headers.get("referrer-policy") === "no-referrer" && /no-store/.test(response.headers.get("cache-control") ?? "")
  );
  results.push({ check: "private-page", path, status: response.status, location: response.headers.get("location"),
    noindex, noPersonalData, privateHeaders,
    pass: denied && noindex && noPersonalData && privateHeaders,
  });
}
const bundleFindings: { file: string; rule: string }[] = [];
const identifierMentions: { file: string; rule: string }[] = [];
const bundleFiles = (await files(join(process.env.NEXT_DIST_DIR || ".next", "static"))).filter((f) => /\.(js|map)$/.test(f));
for (const file of bundleFiles) {
  const source = await readFile(file, "utf8");
  for (const rule of ["SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "ADMIN_PASS", "ADMIN_SESSION_SECRET", "BEGIN PRIVATE KEY"]) {
    if (!source.includes(rule)) continue;
    // Nome de variável em ajuda administrativa não é valor secreto.
    // A tela /admin/reviews contém esse texto; manter a ocorrência auditável.
    identifierMentions.push({ file, rule });
    if (rule === "BEGIN PRIVATE KEY" || source.includes(".env." + rule) ||
      source.includes('env["' + rule + '"]') || source.includes("env['" + rule + "']")) {
      bundleFindings.push({ file, rule });
    }
  }
  for (const match of source.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    try {
      const payload = JSON.parse(Buffer.from(match[0].split(".")[1], "base64url").toString());
      if (payload.role === "service_role") bundleFindings.push({ file, rule: "service-role JWT" });
    } catch { /* não é JWT interpretável */ }
  }
}
results.push({ check: "client-bundle-known-secret-signatures", files: bundleFiles.length, findings: bundleFindings,
  identifierMentions, limitation: "Busca por assinaturas conhecidas, não prova ausência de qualquer segredo. Menções nominais exigem revisão; não são vazamento por si só.",
  pass: bundleFindings.length === 0 });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.route("**/*", (route) => {
  if (route.request().method() !== "GET" || new URL(route.request().url()).origin !== origin) return route.abort();
  return route.continue();
});
try {
  await page.goto(origin + "/preco-spitz-anao");
  const expected = [
    ["Particolor", "5.500", "6.200", "6.500", "7.200"],
    ["Laranja", "6.500", "7.200", "7.500", "8.200"],
    ["Creme", "7.500", "8.200", "8.500", "9.200"],
    ["Preto", "8.500", "9.200", "9.500", "10.200"],
    ["Branco", "9.500", "10.200", "10.500", "11.200"],
  ];
  for (const [color, ...prices] of expected) {
    const row = page.locator("table tbody tr").filter({ has: page.getByRole("cell", { name: color, exact: true }) });
    const text = await row.innerText();
    const pass = prices.every((value) => text.includes("R$ " + value)) && text.includes("Pix") && text.includes("cartão");
    results.push({ check: "ten-prices-rendered-html", color, pass });
  }
  await page.goto(origin + "/blog/preco-spitz-alemao-anao");
  const meta = await page.evaluate(() => ({
    robots: document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content,
    image: document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content,
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? "{}")),
  }));
  assert.match(meta.robots ?? "", /max-image-preview:large/);
  assert.ok(meta.image?.startsWith("https://byimperiodog.com.br/"));
  const image = await fetch(origin + new URL(meta.image!).pathname);
  results.push({ check: "editorial-image-html", pass: image.status === 200, ...meta });
} finally { await browser.close(); }
await writeFile(".audit-evidence/forensic-http.json", JSON.stringify({ testedAt: new Date().toISOString(), origin, results }, null, 2));
const failed = results.filter((r) => !r.pass);
console.log(JSON.stringify({ checks: results.length, passed: results.length - failed.length, failed }));
if (failed.length) process.exitCode = 1;
