#!/usr/bin/env tsx
/**
 * Monitor contínuo de produção (§123).
 *
 * Diferente de `seo:audit`, que varre o sitemap inteiro e serve para trabalhar,
 * este script olha uma lista curta e versionada de URLs críticas e responde uma
 * pergunta só: o site continua publicando o que combinamos que ele publica?
 *
 * A lista é curta de propósito. Monitor que reclama de trezentas páginas por dia
 * vira ruído, ninguém lê, e a primeira regressão de verdade passa no meio dos
 * avisos. Ela vive em scripts/lib/seo-checks.ts (`URLS_CRITICAS`) e muda por
 * commit, não por variável de ambiente.
 *
 * Regras de saída:
 *  • qualquer erro          → código 1
 *  • zero URL verificada    → código 1  (ausência de evidência não é aprovação)
 *  • servidor indisponível  → código 1
 *  • tudo certo             → código 0, saída curta (§124: calado quando está bem)
 *
 * Uso:
 *   npm run production:seo-watch
 *   SEO_WATCH_URL=http://localhost:3000 npm run production:seo-watch
 */

import process from "node:process";

import {
  achadoDeFalha,
  auditarPagina,
  buscarEmLote,
  URLS_CRITICAS,
  type Achado,
} from "./lib/seo-checks";

const BASE_URL = process.env.SEO_WATCH_URL ?? "https://byimperiodog.com.br";
const HOST_CANONICO = process.env.SEO_WATCH_HOST ?? new URL(BASE_URL).host;

async function main(): Promise<void> {
  const caminhos = [...URLS_CRITICAS];

  if (caminhos.length === 0) {
    console.error("❌ FALHA: a lista de URLs críticas está vazia. Nada foi verificado.");
    process.exit(1);
  }

  const buscas = await buscarEmLote(BASE_URL, caminhos, 4);

  const achados: Achado[] = [];
  let verificadas = 0;

  for (const busca of buscas) {
    if (!busca.ok) {
      achados.push(achadoDeFalha(busca));
      continue;
    }
    verificadas += 1;
    achados.push(
      ...auditarPagina(busca.pagina, { hostCanonico: HOST_CANONICO, noSitemap: true }),
    );
  }

  const erros = achados.filter(a => a.severidade === "erro");
  const avisos = achados.filter(a => a.severidade === "aviso");

  // Nenhuma página respondeu: o site pode estar fora do ar, o domínio pode ter
  // caído, o DNS pode ter mudado. O que não pode é o monitor dizer que está tudo
  // bem porque não conseguiu olhar.
  if (verificadas === 0) {
    console.error(
      `❌ FALHA: nenhuma das ${caminhos.length} URLs críticas respondeu em ${BASE_URL}.\n` +
        `   Site fora do ar, DNS ou rede. Zero URL verificada é erro, não aprovação.`,
    );
    for (const a of erros.slice(0, 5)) console.error(`   • ${a.url} — ${a.detalhe}`);
    process.exit(1);
  }

  if (erros.length > 0) {
    console.error(`❌ Regressão em produção — ${erros.length} erro(s) em ${BASE_URL}\n`);
    for (const a of erros) {
      console.error(`  [${a.regra}] ${a.url}`);
      console.error(`      ${a.detalhe}`);
    }
    if (avisos.length > 0) console.error(`\n(${avisos.length} aviso(s) não bloqueante(s))`);
    console.error(
      `\n${verificadas}/${caminhos.length} URLs verificadas em ${new Date().toISOString()}`,
    );
    process.exit(1);
  }

  // §124 — calado quando está bem. Uma linha, para o log da Action ter data.
  console.log(
    `✅ ${verificadas}/${caminhos.length} URLs críticas OK em ${BASE_URL}` +
      (avisos.length > 0 ? ` (${avisos.length} aviso[s])` : ""),
  );
}

main().catch(erro => {
  console.error("❌ Erro fatal no monitor:", erro);
  process.exit(1);
});
