import { execFile } from "node:child_process";
import { access, mkdir, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { promisify } from "node:util";
import { chromium } from "playwright";

// LIGHTHOUSE_CLI aponta para o CLI instalado separadamente via npm exec.
// Não altera dependências do site nem usa perfil pessoal do Chrome.
const cli = process.env.LIGHTHOUSE_CLI;
const origin = process.env.AUDIT_ORIGIN ?? "http://127.0.0.1:3109";
const runLabel = process.env.AUDIT_RUN ?? "";
if (!/^[a-z0-9-]*$/.test(runLabel)) throw new Error("Rótulo de medição inválido");
if (!cli || !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) throw new Error("CLI e origem local obrigatórios");
await access(cli);
const portReservation = createServer();
await new Promise<void>((resolve) => portReservation.listen(0, "127.0.0.1", resolve));
const address = portReservation.address();
if (!address || typeof address === "string") throw new Error("Sem porta local");
await new Promise<void>((resolve, reject) => portReservation.close((e) => e ? reject(e) : resolve()));
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--remote-debugging-address=127.0.0.1", "--remote-debugging-port=" + address.port] });
await mkdir(".audit-evidence", { recursive: true });
try {
  for (const [name, path] of [["catalogo", "/filhotes"], ["branca", "/filhotes/spitz-alemao-anao-branco-femea"], ["precos", "/preco-spitz-anao"]]) {
    const output = ".audit-evidence/lh-controlled-" + new Date().toISOString().slice(0,10) + "-" + (runLabel ? runLabel + "-" : "") + name + ".json";
    await promisify(execFile)(process.execPath, [cli, origin + path, "--port=" + address.port,
      "--hostname=127.0.0.1", "--only-categories=performance", "--output=json", "--output-path=" + output, "--quiet"],
      { timeout: 150_000, maxBuffer: 2 * 1024 * 1024, windowsHide: true });
    const report = JSON.parse(await readFile(output, "utf8"));
    if (report.runtimeError) throw new Error(JSON.stringify(report.runtimeError));
    console.log(JSON.stringify({ path, testedAt: report.fetchTime, performance: report.categories.performance.score,
      lcpMs: report.audits["largest-contentful-paint"].numericValue,
      cls: report.audits["cumulative-layout-shift"].numericValue,
      tbtMs: report.audits["total-blocking-time"].numericValue }));
  }
} finally { await browser.close(); }
