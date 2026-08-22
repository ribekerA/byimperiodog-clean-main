#!/usr/bin/env node
/**
 * Lighthouse honesto.
 *
 * O comando anterior era:
 *   lighthouse http://localhost:3000/ ... || exit 0
 * e o irmão dele terminava em `|| echo 'LHCI optional'`. Nos dois casos, se o
 * Chrome não abrisse a página, o comando saía com código 0 — falha vestida de
 * sucesso. Foi assim que reports/lighthouse-mobile.report.json ficou guardado
 * com runtimeError CHROME_INTERSTITIAL_ERROR e finalUrl chrome-error://, e
 * mesmo assim virou citação de performance.
 *
 * Aqui o roteiro é:
 *   1. sobe o servidor de produção (a menos que já exista um alvo remoto);
 *   2. espera a URL responder 200 de verdade antes de medir;
 *   3. roda o Lighthouse;
 *   4. confere runtimeError e finalUrl no JSON gerado;
 *   5. classifica PASSOU / AVISO / FALHOU / NAO EXECUTADO e sai com código
 *      coerente. Relatório inválido nunca vira número de performance.
 *
 * Variáveis:
 *   LH_BASE_URL     mede outra origem (ex.: https://byimperiodog.com.br)
 *   LH_PORT         porta do servidor local (padrão: a do lighthouserc.json)
 *   LH_NO_SERVER=1  não sobe servidor nenhum
 *   NEXT_DIST_DIR   repassado ao next start (o build local usa .next-build)
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
const rcPath = path.join(root, 'lighthouserc.json');

const EXIT = { PASS: 0, FAIL: 1, NAO_EXECUTADO: 2 };

function lerUrls() {
  const rc = JSON.parse(fs.readFileSync(rcPath, 'utf8'));
  const urls = rc?.ci?.collect?.url ?? [];
  if (!urls.length) throw new Error('lighthouserc.json não lista nenhuma URL');
  const base = process.env.LH_BASE_URL?.replace(/\/$/, '');
  const limites = rc?.ci?.assert?.assertions ?? {};
  return {
    urls: base ? urls.map((u) => base + new URL(u).pathname) : urls,
    limites,
  };
}

function slug(url) {
  const p = new URL(url).pathname.replace(/\/$/, '');
  return p === '' ? 'home' : p.replace(/^\//, '').replace(/\//g, '-');
}

async function responde(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: controller.signal });
    return r.status;
  } catch {
    return 0;
  } finally {
    clearTimeout(id);
  }
}

async function esperarServidor(url, tentativas = 60) {
  for (let i = 0; i < tentativas; i++) {
    const status = await responde(url);
    if (status === 200) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function rodar(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: process.platform === 'win32', ...opts });
    let out = '';
    let err = '';
    child.stdout?.on('data', (d) => { out += d; });
    child.stderr?.on('data', (d) => { err += d; });
    child.on('error', (e) => resolve({ code: -1, out, err: String(e.message || e) }));
    child.on('close', (code) => resolve({ code, out, err }));
  });
}

function ms(v) { return v === undefined || v === null ? null : Math.round(v); }

async function main() {
  fs.mkdirSync(reportsDir, { recursive: true });
  const { urls, limites } = lerUrls();
  const remoto = !!process.env.LH_BASE_URL && !/localhost|127\.0\.0\.1/.test(process.env.LH_BASE_URL);
  const precisaServidor = !remoto && process.env.LH_NO_SERVER !== '1';

  const porta = process.env.LH_PORT || new URL(urls[0]).port || '3000';
  let servidor = null;

  if (precisaServidor) {
    console.log(`Subindo next start na porta ${porta}…`);
    servidor = spawn('npx', ['next', 'start', '-p', String(porta)], {
      shell: process.platform === 'win32',
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    servidor.stdout.on('data', (d) => process.env.LH_VERBOSE && process.stdout.write(`[server] ${d}`));
    servidor.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  }

  const pronto = await esperarServidor(urls[0]);
  if (!pronto) {
    console.error(`\nFALHOU: ${urls[0]} não respondeu 200 dentro do tempo. Nada foi medido.`);
    servidor?.kill();
    process.exit(EXIT.FAIL);
  }
  console.log(`Servidor respondendo em ${urls[0]}\n`);

  const resultados = [];
  let naoExecutado = false;

  for (const url of urls) {
    const status = await responde(url);
    if (status !== 200) {
      resultados.push({ url, veredito: 'FALHOU', motivo: `a URL respondeu ${status} antes da medição` });
      continue;
    }

    const nome = slug(url);
    const destino = path.join(reportsDir, `lh-${nome}`);
    console.log(`Medindo ${url} …`);
    const { code, err } = await rodar('npx', [
      'lighthouse', url,
      '--quiet',
      '--output=json', '--output=html',
      `--output-path=${destino}`,
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--max-wait-for-load=45000',
    ]);

    const jsonPath = `${destino}.report.json`;
    if (!fs.existsSync(jsonPath)) {
      const semChrome = /Chrome|CHROME_PATH|not found|ENOENT/i.test(err);
      resultados.push({
        url,
        veredito: semChrome ? 'NAO EXECUTADO' : 'FALHOU',
        motivo: `lighthouse saiu com código ${code}: ${err.trim().split('\n').slice(-3).join(' ') || '(sem saída)'}`,
      });
      if (semChrome) naoExecutado = true;
      continue;
    }

    const rel = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const finalUrl = rel.finalDisplayedUrl || rel.finalUrl || '';
    if (rel.runtimeError || /^chrome-error:/.test(finalUrl)) {
      resultados.push({
        url,
        veredito: 'FALHOU',
        motivo: `relatório inválido — ${rel.runtimeError?.code || 'finalUrl ' + finalUrl}`,
      });
      continue;
    }
    if (new URL(finalUrl).pathname !== new URL(url).pathname) {
      resultados.push({ url, veredito: 'FALHOU', motivo: `mediu outra página: ${finalUrl}` });
      continue;
    }

    const a = rel.audits || {};
    const metricas = {
      performance: rel.categories?.performance?.score ?? null,
      acessibilidade: rel.categories?.accessibility?.score ?? null,
      lcp: ms(a['largest-contentful-paint']?.numericValue),
      cls: a['cumulative-layout-shift']?.numericValue ?? null,
      tbt: ms(a['total-blocking-time']?.numericValue),
      si: ms(a['speed-index']?.numericValue),
      fcp: ms(a['first-contentful-paint']?.numericValue),
      bytes: ms(a['total-byte-weight']?.numericValue),
    };

    const avisos = [];
    const limite = (chave) => limites[chave]?.[1]?.maxNumericValue;
    const minScore = limites['categories:performance']?.[1]?.minScore;
    if (minScore && metricas.performance !== null && metricas.performance < minScore) {
      avisos.push(`performance ${(metricas.performance * 100).toFixed(0)} < ${(minScore * 100).toFixed(0)}`);
    }
    if (limite('largest-contentful-paint') && metricas.lcp > limite('largest-contentful-paint')) {
      avisos.push(`LCP ${metricas.lcp}ms > ${limite('largest-contentful-paint')}ms`);
    }
    if (limite('total-blocking-time') !== undefined && metricas.tbt > limite('total-blocking-time')) {
      avisos.push(`TBT ${metricas.tbt}ms > ${limite('total-blocking-time')}ms`);
    }
    if (limite('cumulative-layout-shift') !== undefined && metricas.cls > limite('cumulative-layout-shift')) {
      avisos.push(`CLS ${metricas.cls} > ${limite('cumulative-layout-shift')}`);
    }

    resultados.push({ url, veredito: avisos.length ? 'AVISO' : 'PASSOU', metricas, avisos, arquivo: path.relative(root, jsonPath) });

    // A home guardada é a referência citada em relatório: fica com nome fixo.
    if (new URL(url).pathname === '/') {
      fs.copyFileSync(jsonPath, path.join(reportsDir, 'lighthouse-mobile.report.json'));
      const htmlPath = `${destino}.report.html`;
      if (fs.existsSync(htmlPath)) fs.copyFileSync(htmlPath, path.join(reportsDir, 'lighthouse-mobile.report.html'));
    }
  }

  servidor?.kill();

  console.log('\n=== LIGHTHOUSE ===');
  for (const r of resultados) {
    const linha = `${r.veredito.padEnd(14)} ${new URL(r.url).pathname}`;
    if (r.metricas) {
      console.log(
        `${linha}  perf ${(r.metricas.performance * 100).toFixed(0)} | LCP ${r.metricas.lcp}ms | CLS ${r.metricas.cls} | TBT ${r.metricas.tbt}ms | SI ${r.metricas.si}ms`
      );
      for (const aviso of r.avisos) console.log(`               ↳ ${aviso}`);
    } else {
      console.log(`${linha}  ${r.motivo}`);
    }
  }

  const resumo = {
    geradoEm: new Date().toISOString(),
    base: process.env.LH_BASE_URL || `http://localhost:${porta}`,
    resultados,
  };
  fs.writeFileSync(path.join(reportsDir, 'lighthouse-summary.json'), JSON.stringify(resumo, null, 2));

  const falhou = resultados.some((r) => r.veredito === 'FALHOU');
  if (falhou) {
    console.log('\nResultado: FALHOU (nenhum número deste run pode ser citado como performance).');
    process.exit(EXIT.FAIL);
  }
  if (naoExecutado || !resultados.length) {
    console.log('\nResultado: NAO EXECUTADO.');
    process.exit(EXIT.NAO_EXECUTADO);
  }
  console.log(resultados.some((r) => r.veredito === 'AVISO') ? '\nResultado: AVISO (medido, fora de alguma meta).' : '\nResultado: PASSOU.');
  process.exit(EXIT.PASS);
}

main().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(EXIT.FAIL);
});
