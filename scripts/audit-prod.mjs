#!/usr/bin/env node
/**
 * Portao de vulnerabilidades das dependencias de PRODUCAO.
 *
 * `npm audit --omit=dev --audit-level=high` faria quase o mesmo, com um defeito
 * pratico: ou ele passa, ou ele reprova tudo. Quando existe UMA vulnerabilidade
 * conhecida sem correcao disponivel, a escolha vira "CI vermelho para sempre" ou
 * "baixar o nivel para moderate" — e baixar o nivel apaga junto todas as altas
 * que aparecerem depois. As duas opcoes terminam no mesmo lugar: ninguem olha.
 *
 * Este script separa as duas coisas. Vulnerabilidade alta ou critica reprova,
 * exceto as que estao listadas aqui embaixo com motivo e data de revisao. A
 * lista e curta de proposito e cada item vence: passada a data, o portao reprova
 * ate alguem reavaliar. Vulnerabilidade nova, mesmo no mesmo pacote, nao entra
 * na isencao — a isencao e por identificador de aviso, nao por pacote.
 *
 * Uso: node scripts/audit-prod.mjs
 * Saida: 0 quando passa, 1 quando reprova.
 */
import { spawnSync } from "node:child_process";

/**
 * Isencoes. Cada uma precisa de: os identificadores exatos, por que nao da para
 * corrigir hoje, o que reduz o risco enquanto isso, e ate quando vale.
 */
const EXCECOES = [
  {
    pacote: "next",
    revisarAte: "2026-11-22",
    motivo:
      "Todos estes avisos so tem correcao na linha 15.5.x. O projeto roda 14.2.35, " +
      "que ja e a ultima versao 14 e onde as duas criticas (cache poisoning e DoS do " +
      "otimizador de imagem) foram fechadas. Subir para o Next 15 nao e atualizacao de " +
      "dependencia: muda cookies/headers/params para async, exige React 19 e inverte o " +
      "padrao de cache do App Router. Precisa de migracao planejada e autorizada, nao " +
      "de um `npm install` no meio de um endurecimento de seguranca.",
    reducaoDeRisco:
      "As reincidentes sao DoS em Server Components e Server Actions. O que esta no " +
      "nosso alcance — limite de tamanho de payload, rate limit e timeout nas rotas " +
      "publicas — esta sendo tratado na fase de APIs. As de SSRF em rewrites e em " +
      "servidor customizado nao se aplicam: o next.config nao declara `rewrites` e o " +
      "site roda no runtime da Netlify, nao em servidor proprio. A de bypass de " +
      "middleware e do Pages Router com i18n, que o projeto nao usa.",
    ids: [
      "GHSA-h25m-26qc-wcjf",
      "GHSA-q4gf-8mx6-v5v3",
      "GHSA-8h8q-6873-q5fj",
      "GHSA-c4j6-fc7j-m34r",
      "GHSA-36qx-fr4f-26g5",
      "GHSA-m99w-x7hq-7vfj",
      "GHSA-89xv-2m56-2m9x",
      "GHSA-p9j2-gv94-2wf4",
    ],
  },
];

const GRAVES = new Set(["high", "critical"]);

function rodarAudit() {
  const r = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === "win32",
    windowsHide: true,
  });
  // `npm audit` sai com 1 quando encontra vulnerabilidade: e o caso normal aqui.
  if (!r.stdout) {
    throw new Error(`npm audit nao devolveu JSON: ${(r.stderr || "").trim().slice(0, 300)}`);
  }
  return JSON.parse(r.stdout);
}

/** Extrai o GHSA do campo `url` do aviso. */
function idDoAviso(aviso) {
  const m = String(aviso.url || "").match(/GHSA-[a-z0-9-]+/i);
  return m ? m[0] : `sem-id-${aviso.source ?? "?"}`;
}

function coletarAvisos(relatorio) {
  const avisos = new Map();
  for (const [pacote, v] of Object.entries(relatorio.vulnerabilities || {})) {
    for (const via of v.via || []) {
      if (typeof via === "string") continue; // vulnerabilidade herdada de outro pacote
      if (!GRAVES.has(via.severity)) continue;
      const id = idDoAviso(via);
      if (!avisos.has(id)) {
        avisos.set(id, { id, pacote, severidade: via.severity, titulo: via.title });
      }
    }
  }
  return [...avisos.values()];
}

function main() {
  const relatorio = rodarAudit();
  const resumo = relatorio.metadata?.vulnerabilities ?? {};
  console.log(
    `audit:prod — critica ${resumo.critical ?? 0}, alta ${resumo.high ?? 0}, ` +
      `moderada ${resumo.moderate ?? 0}, baixa ${resumo.low ?? 0}.`
  );

  const hoje = new Date().toISOString().slice(0, 10);
  const isentos = new Map();
  const vencidas = [];

  for (const e of EXCECOES) {
    if (e.revisarAte < hoje) vencidas.push(e);
    for (const id of e.ids) isentos.set(id, e);
  }

  const avisos = coletarAvisos(relatorio);
  const bloqueiam = avisos.filter((a) => !isentos.has(a.id));
  const perdoados = avisos.filter((a) => isentos.has(a.id));

  if (perdoados.length) {
    console.log(`\n${perdoados.length} aviso(s) grave(s) sob isencao registrada:`);
    for (const a of perdoados) {
      console.log(`  [${a.severidade}] ${a.pacote} ${a.id} — ${a.titulo}`);
    }
    for (const e of EXCECOES) {
      const usados = e.ids.filter((id) => avisos.some((a) => a.id === id));
      if (!usados.length) continue;
      console.log(`\n  ${e.pacote}: revisar ate ${e.revisarAte}.`);
      console.log(`  motivo: ${e.motivo}`);
      console.log(`  reducao de risco: ${e.reducaoDeRisco}`);
    }
    // Isencao que nao corresponde mais a nenhum aviso e lista velha: avisa, para
    // a lista nao virar entulho, mas nao reprova o build por isso.
    for (const e of EXCECOES) {
      const orfaos = e.ids.filter((id) => !avisos.some((a) => a.id === id));
      if (orfaos.length) {
        console.log(
          `\n  NOTA: ${orfaos.length} isencao(oes) de ${e.pacote} nao correspondem mais a ` +
            `nenhum aviso e podem sair da lista: ${orfaos.join(", ")}`
        );
      }
    }
  }

  if (vencidas.length) {
    console.error("\naudit:prod REPROVADO — isencao vencida.");
    for (const e of vencidas) {
      console.error(`  ${e.pacote}: a isencao valia ate ${e.revisarAte} e hoje e ${hoje}.`);
      console.error("  Reavalie: ou a correcao ja existe, ou a data precisa de nova justificativa.");
    }
    return 1;
  }

  if (bloqueiam.length) {
    console.error(`\naudit:prod REPROVADO — ${bloqueiam.length} aviso(s) grave(s) sem isencao:`);
    for (const a of bloqueiam) {
      console.error(`  [${a.severidade}] ${a.pacote} ${a.id} — ${a.titulo}`);
    }
    console.error(
      "\nCorrija com `npm audit fix`, suba a dependencia, ou — se nao houver correcao —" +
        "\nacrescente uma isencao em scripts/audit-prod.mjs com motivo e data de revisao."
    );
    return 1;
  }

  console.log("\naudit:prod aprovado: nenhuma vulnerabilidade alta ou critica sem isencao.");
  return 0;
}

process.exit(main());
