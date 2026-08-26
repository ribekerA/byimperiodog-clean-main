// Auditoria de acessibilidade com o conjunto completo de regras WCAG 2.2 A/AA.
//
// O script irmao (a11y-contraste-axe.mjs) roda so a regra color-contrast, que e
// a que mais aparecia no site. Mas contraste nao e a unica exigencia: a regra
// definition-list, por exemplo, so foi descoberta porque o Lighthouse a rodou
// por conta propria -- doze paginas tinham um <dl> sem <dt>/<dd>. Este script
// fecha esse buraco: roda tudo e reprova por impacto (critical/serious).
//
// Uso:
//   BASE_URL=http://localhost:3100 ROTAS="/ /blog /contato" node scripts/a11y-wcag-axe.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const axeFonte = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const BASE = process.env.BASE_URL || "http://localhost:3100";
const ROTAS = (process.env.ROTAS || "/").trim().split(/\s+/);

// Impactos que o §14 trata como reprovacao. minor/moderate entram no relatorio
// como aviso, para nao sumirem do radar sem virarem ruido bloqueante.
const REPROVA = new Set(["critical", "serious"]);

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  // Mede com a preferencia de menos movimento ligada. Todos os componentes de
  // animacao do projeto (ScrollReveal, StaggerContainer e mais dez) respeitam
  // useReducedMotion e renderizam uma <div> comum, sem fade e com opacidade
  // cheia. Sem isso, elemento que ficou parado em opacity 0 e simplesmente
  // PULADO pelo axe -- nao vira reprovacao nem aprovacao, some do relatorio.
  reducedMotion: "reduce",
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
});

let totalGraves = 0;
let totalLeves = 0;
const porRegra = new Map();

for (const rota of ROTAS) {
  const pagina = await contexto.newPage();
  try {
    await pagina.goto(BASE + rota, { waitUntil: "networkidle", timeout: 60000 });
  } catch (e) {
    console.log("\n########## " + rota + " -> NAO CARREGOU: " + e.message.split("\n")[0]);
    await pagina.close();
    continue;
  }

  // Mesmas tres passadas do script de contraste, e pelo mesmo motivo: o axe
  // PULA EM SILENCIO elemento invisivel -- em qualquer regra, nao so na de
  // cor. Secao com content-visibility: auto nao existe para ele enquanto nao
  // entra na tela, e card que entra com fade fica parado em opacity 0 ate o
  // IntersectionObserver disparar. Rolar rapido demais (eram 120 ms por tela)
  // nao dispara o observador, e o que nao dispara nao e auditado.
  await pagina.evaluate(async () => {
    const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

    // 1) percorre devagar o bastante para o observador disparar
    const passo = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += passo) {
      window.scrollTo(0, y);
      await esperar(200);
    }
    window.scrollTo(0, 0);
    await esperar(300);

    // 2) resgata quem ficou para tras, porque depender de tempo e depender
    //    de sorte
    for (let volta = 0; volta < 4; volta++) {
      const parados = Array.from(document.querySelectorAll("[style*='opacity']")).filter(
        (el) => el.getClientRects().length > 0 && parseFloat(getComputedStyle(el).opacity) < 1
      );
      if (parados.length === 0) break;
      for (const el of parados) {
        el.scrollIntoView({ block: "center" });
        await esperar(160);
      }
      window.scrollTo(0, 0);
      await esperar(300);
    }

    // 3) espera o fade terminar antes de medir
    const limite = Date.now() + 10000;
    while (Date.now() < limite) {
      const rodando = document.getAnimations().some((a) => a.playState === "running");
      const meioDoFade = Array.from(document.querySelectorAll("body *")).some((el) => {
        const o = parseFloat(getComputedStyle(el).opacity);
        return o > 0 && o < 1;
      });
      if (!rodando && !meioDoFade) break;
      await esperar(100);
    }
    await esperar(250);
  });

  await pagina.addScriptTag({ content: axeFonte });
  const r = await pagina.evaluate(async () => {
    // @ts-ignore
    return await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
      resultTypes: ["violations"],
    });
  });

  const graves = r.violations.filter((v) => REPROVA.has(v.impact));
  const leves = r.violations.filter((v) => !REPROVA.has(v.impact));
  const nosGraves = graves.reduce((s, v) => s + v.nodes.length, 0);
  const nosLeves = leves.reduce((s, v) => s + v.nodes.length, 0);
  totalGraves += nosGraves;
  totalLeves += nosLeves;

  console.log("\n########## " + rota + " -> " + nosGraves + " grave(s), " + nosLeves + " leve(s) ##########");
  for (const v of [...graves, ...leves]) {
    porRegra.set(v.id, (porRegra.get(v.id) || 0) + v.nodes.length);
    console.log("\n--- [" + v.impact + "] " + v.id + "  (" + v.nodes.length + "x)");
    console.log("    " + v.help);
    for (const n of v.nodes.slice(0, 2)) {
      console.log("    sel : " + JSON.stringify(n.target));
      console.log("    html: " + String(n.html).replace(/\s+/g, " ").slice(0, 160));
    }
    if (v.nodes.length > 2) console.log("    ... e mais " + (v.nodes.length - 2) + " no(s)");
  }

  await pagina.close();
}

await navegador.close();

console.log("\n\n==================== RESUMO ====================");
console.log("rotas analisadas          :", ROTAS.length);
console.log("nos GRAVES (critical/serious):", totalGraves);
console.log("nos leves (minor/moderate)   :", totalLeves);
if (porRegra.size) {
  console.log("\n--- por regra ---");
  [...porRegra.entries()].sort((a, b) => b[1] - a[1]).forEach(([id, n]) =>
    console.log("  " + id.padEnd(38), String(n).padStart(4) + " no(s)"));
}

// §14 exige zero critical/serious. Sai diferente de zero so por causa deles.
process.exit(totalGraves > 0 ? 1 : 0);
