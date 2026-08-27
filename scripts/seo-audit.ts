#!/usr/bin/env tsx
/**
 * Auditoria de SEO sobre o site servido.
 *
 * Este arquivo era uma linha de `console.log` dizendo "placeholder - implementar
 * coleta de URLs". Ele estava ligado a `npm run seo:audit`, então quem rodasse o
 * comando via uma mensagem e um código de saída 0 — ou seja, o portão de SEO do
 * projeto aprovava tudo, sempre, sem ler uma única página. Auditor que não pode
 * reprovar não é auditor; é decoração.
 *
 * Como funciona agora:
 *  1. lê /sitemap-index.xml no servidor e extrai as URLs publicadas;
 *  2. busca cada uma e mede título, description, canonical, robots, H1, imagem,
 *     JSON-LD e vocabulário público de estoque;
 *  3. escreve reports/seo-audit.json e reports/seo-audit.md;
 *  4. sai com código ≠ 0 se houver qualquer erro — e também se não houver
 *     evidência nenhuma (servidor fora do ar, zero página, zero fetch bem
 *     sucedido). Relatório vazio nunca é relatório limpo.
 *
 * Uso:
 *   npm run seo:audit                                   # http://localhost:3000
 *   SEO_AUDIT_URL=https://byimperiodog.com.br npm run seo:audit
 *   SEO_AUDIT_LIMIT=40 npm run seo:audit                # amostra durante o dev
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  achadoDeFalha,
  auditarPagina,
  buscarEmLote,
  coletarCaminhosDoSitemap,
  URLS_CRITICAS,
  type Achado,
  type Busca,
} from "./lib/seo-checks";

const BASE_URL = process.env.SEO_AUDIT_URL ?? "http://localhost:3000";
const LIMITE = Number(process.env.SEO_AUDIT_LIMIT ?? 200);
const HOST_CANONICO = process.env.SEO_AUDIT_HOST ?? "byimperiodog.com.br";
const RAIZ = process.cwd();
const PASTA_RELATORIOS = path.join(RAIZ, "reports");

interface Relatorio {
  geradoEm: string;
  baseUrl: string;
  origemDasUrls: string;
  resumo: {
    urlsColetadas: number;
    urlsAuditadas: number;
    paginasQueResponderam: number;
    paginasInacessiveis: number;
    erros: number;
    avisos: number;
  };
  achados: Achado[];
  paginas: {
    url: string;
    status: number | null;
    tempoMs: number | null;
    erros: number;
    avisos: number;
  }[];
}

function agrupar(achados: readonly Achado[]): Map<string, Achado[]> {
  const mapa = new Map<string, Achado[]>();
  for (const a of achados) {
    const lista = mapa.get(a.regra) ?? [];
    lista.push(a);
    mapa.set(a.regra, lista);
  }
  return new Map([...mapa.entries()].sort((x, y) => y[1].length - x[1].length));
}

function montarMarkdown(relatorio: Relatorio): string {
  const { resumo } = relatorio;
  const linhas: string[] = [];

  linhas.push("# Auditoria de SEO");
  linhas.push("");
  linhas.push(`- **Origem:** ${relatorio.baseUrl}`);
  linhas.push(`- **URLs vindas de:** ${relatorio.origemDasUrls}`);
  linhas.push(`- **Gerado em:** ${relatorio.geradoEm}`);
  linhas.push("");
  linhas.push("| Medida | Valor |");
  linhas.push("| --- | ---: |");
  linhas.push(`| URLs coletadas | ${resumo.urlsColetadas} |`);
  linhas.push(`| URLs auditadas | ${resumo.urlsAuditadas} |`);
  linhas.push(`| Responderam | ${resumo.paginasQueResponderam} |`);
  linhas.push(`| Inacessíveis | ${resumo.paginasInacessiveis} |`);
  linhas.push(`| Erros | ${resumo.erros} |`);
  linhas.push(`| Avisos | ${resumo.avisos} |`);
  linhas.push("");

  const erros = relatorio.achados.filter(a => a.severidade === "erro");
  const avisos = relatorio.achados.filter(a => a.severidade === "aviso");

  for (const [titulo, lista] of [
    ["Erros", erros],
    ["Avisos", avisos],
  ] as const) {
    linhas.push(`## ${titulo} (${lista.length})`);
    linhas.push("");
    if (lista.length === 0) {
      linhas.push("Nenhum.");
      linhas.push("");
      continue;
    }
    for (const [regra, achados] of agrupar(lista)) {
      linhas.push(`### \`${regra}\` — ${achados.length}`);
      linhas.push("");
      for (const a of achados.slice(0, 40)) {
        linhas.push(`- \`${a.url}\` — ${a.detalhe}`);
      }
      if (achados.length > 40) linhas.push(`- _(+${achados.length - 40} não listados)_`);
      linhas.push("");
    }
  }

  linhas.push("## Páginas");
  linhas.push("");
  linhas.push("| URL | Status | ms | Erros | Avisos |");
  linhas.push("| --- | ---: | ---: | ---: | ---: |");
  for (const p of relatorio.paginas) {
    linhas.push(
      `| \`${p.url}\` | ${p.status ?? "—"} | ${p.tempoMs ?? "—"} | ${p.erros} | ${p.avisos} |`,
    );
  }
  linhas.push("");

  return linhas.join("\n");
}

async function main(): Promise<void> {
  console.log(`\n🔍 Auditoria de SEO em ${BASE_URL}\n`);

  const achados: Achado[] = [];

  // ── 1. Coleta ─────────────────────────────────────────────────────────────
  let caminhos: string[] = [];
  let origem = "";

  const doSitemap = await coletarCaminhosDoSitemap(BASE_URL);
  if (doSitemap && doSitemap.caminhos.length > 0) {
    caminhos = doSitemap.caminhos;
    origem = doSitemap.origem;
    console.log(`📄 ${caminhos.length} URLs coletadas de ${origem}`);
  } else {
    // Sitemap ilegível é achado, não motivo para sair calado: ou o servidor
    // está fora, ou a rota do sitemap quebrou — as duas coisas reprovam.
    achados.push({
      url: "/sitemap-index.xml",
      severidade: "erro",
      regra: "sitemap:indisponivel",
      detalhe: "não foi possível ler o índice de sitemaps; caindo para a lista crítica",
    });
    caminhos = [...URLS_CRITICAS];
    origem = "lista crítica (sitemap indisponível)";
    console.log(`⚠️  Sitemap indisponível — auditando ${caminhos.length} URLs críticas`);
  }

  // As URLs críticas entram sempre: robots.txt e o próprio índice não estão
  // listados dentro do sitemap, e são justamente os dois arquivos que o Google
  // lê primeiro.
  for (const critica of URLS_CRITICAS) {
    if (!caminhos.includes(critica)) caminhos.push(critica);
  }

  const urlsColetadas = caminhos.length;
  if (Number.isFinite(LIMITE) && LIMITE > 0 && caminhos.length > LIMITE) {
    console.log(`✂️  Limitando a ${LIMITE} URLs (SEO_AUDIT_LIMIT)`);
    caminhos = caminhos.slice(0, LIMITE);
  }

  if (caminhos.length === 0) {
    console.error(
      "\n❌ FALHA: nenhuma URL para auditar. Sem página coletada não há auditoria — " +
        "isto é falha, não aprovação.\n",
    );
    process.exit(1);
  }

  // ── 2. Busca e auditoria ──────────────────────────────────────────────────
  console.log(`\n🌐 Buscando ${caminhos.length} páginas...\n`);
  const buscas: Busca[] = await buscarEmLote(BASE_URL, caminhos, 6, (busca, i, total) => {
    const marcador = busca.ok ? `${busca.pagina.status}` : "ERR";
    process.stdout.write(`  [${String(i + 1).padStart(3)}/${total}] ${marcador} ${busca.caminho}\n`);
  });

  const doSitemapSet = new Set(doSitemap?.caminhos ?? []);
  const paginas: Relatorio["paginas"] = [];
  let responderam = 0;
  let inacessiveis = 0;

  for (const busca of buscas) {
    if (!busca.ok) {
      inacessiveis += 1;
      const achado = achadoDeFalha(busca);
      achados.push(achado);
      paginas.push({ url: busca.caminho, status: null, tempoMs: null, erros: 1, avisos: 0 });
      continue;
    }
    responderam += 1;
    const daPagina = auditarPagina(busca.pagina, {
      hostCanonico: HOST_CANONICO,
      noSitemap: doSitemapSet.has(busca.caminho),
    });
    achados.push(...daPagina);
    paginas.push({
      url: busca.caminho,
      status: busca.pagina.status,
      tempoMs: busca.pagina.tempoMs,
      erros: daPagina.filter(a => a.severidade === "erro").length,
      avisos: daPagina.filter(a => a.severidade === "aviso").length,
    });
  }

  // ── 3. Relatórios ─────────────────────────────────────────────────────────
  const relatorio: Relatorio = {
    geradoEm: new Date().toISOString(),
    baseUrl: BASE_URL,
    origemDasUrls: origem,
    resumo: {
      urlsColetadas,
      urlsAuditadas: caminhos.length,
      paginasQueResponderam: responderam,
      paginasInacessiveis: inacessiveis,
      erros: achados.filter(a => a.severidade === "erro").length,
      avisos: achados.filter(a => a.severidade === "aviso").length,
    },
    achados,
    paginas,
  };

  await fs.mkdir(PASTA_RELATORIOS, { recursive: true });
  await fs.writeFile(
    path.join(PASTA_RELATORIOS, "seo-audit.json"),
    JSON.stringify(relatorio, null, 2),
    "utf-8",
  );
  await fs.writeFile(
    path.join(PASTA_RELATORIOS, "seo-audit.md"),
    montarMarkdown(relatorio),
    "utf-8",
  );

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    RESULTADO DA AUDITORIA                    ║
╚══════════════════════════════════════════════════════════════╝

  URLs coletadas : ${relatorio.resumo.urlsColetadas}
  URLs auditadas : ${relatorio.resumo.urlsAuditadas}
  Responderam    : ${relatorio.resumo.paginasQueResponderam}
  Inacessíveis   : ${relatorio.resumo.paginasInacessiveis}
  Erros          : ${relatorio.resumo.erros}
  Avisos         : ${relatorio.resumo.avisos}

  reports/seo-audit.json
  reports/seo-audit.md
`);

  for (const [regra, lista] of agrupar(achados.filter(a => a.severidade === "erro"))) {
    console.log(`❌ ${regra} (${lista.length})`);
    for (const a of lista.slice(0, 5)) console.log(`   • ${a.url} — ${a.detalhe}`);
    if (lista.length > 5) console.log(`   • (+${lista.length - 5})`);
  }

  // ── 4. Portão ─────────────────────────────────────────────────────────────
  if (responderam === 0) {
    console.error(
      `\n❌ FALHA: nenhuma das ${caminhos.length} páginas respondeu em ${BASE_URL}.\n` +
        `   Servidor fora do ar ou porta errada. Sem página lida não há auditoria:\n` +
        `   isto é falha do auditor, não aprovação do site.\n` +
        `   Suba o servidor antes de rodar:  npm run build && npm run start\n`,
    );
    process.exit(1);
  }

  if (relatorio.resumo.erros > 0) {
    console.error(`\n❌ Auditoria reprovada: ${relatorio.resumo.erros} erro(s).\n`);
    process.exit(1);
  }

  console.log(`✅ Auditoria aprovada com ${relatorio.resumo.avisos} aviso(s).\n`);
}

main().catch(erro => {
  console.error("❌ Erro fatal na auditoria:", erro);
  process.exit(1);
});
