#!/usr/bin/env node

/**
 * Verifica os headers de cache das mídias que a vitrine realmente publica.
 *
 * O que este script era, e por que mudou:
 *
 *  1. Ele testava DOIS caminhos fixos escritos à mão e terminava com
 *     `process.exit(0); // não quebra pipeline por padrão`. Imprimia "FAIL" e
 *     saía com sucesso — portão que nunca fecha não é portão. Agora falha
 *     reprova (exit 1), e zero mídia verificada também reprova: relatório vazio
 *     não é relatório limpo.
 *
 *  2. Ele EXIGIA `immutable` em /spitz-hero-desktop.webp. Esse arquivo mora em
 *     public/ com nome fixo e já foi trocado por outra foto mais de uma vez
 *     neste projeto. `immutable` diz ao navegador "não revalide nunca": quem já
 *     visitou continuaria vendo a foto antiga por até um ano, sem jeito de
 *     forçar atualização a não ser renomeando o arquivo. Agora é o contrário —
 *     `immutable` em asset de nome estável é FALHA. Ele só é correto onde o
 *     nome carrega hash do conteúdo, que é o caso de /_next/static.
 *
 *  3. Ele não olhava as mídias dos filhotes. A lista agora sai dos sitemaps de
 *     imagem e vídeo servidos pelo próprio site, priorizando o que está sob
 *     /filhotes, e cobre jpg/jpeg/webp/png/avif/mp4.
 *
 * Uso:
 *   npm run cache:verify                                   # http://localhost:3000
 *   npm run cache:verify -- --url=https://byimperiodog.com.br
 *   CACHE_VERIFY_LIMIT=20 npm run cache:verify
 */

const argUrl = process.argv.find(a => a.startsWith('--url='));
const baseUrl = (
  argUrl ? argUrl.split('=')[1] : process.env.PRODUCTION_BASE_URL || 'http://localhost:3000'
).replace(/\/$/, '');
const LIMITE = Number(process.env.CACHE_VERIFY_LIMIT || 12);

/** Um ano. Mídia de vitrine pode (e deve) ser cacheada por muito tempo... */
const MAX_AGE_MINIMO = 3600;
/** ...mas nunca de forma irrevogável, porque o nome do arquivo não muda. */
const EXTENSOES = /\.(jpe?g|webp|png|avif|mp4|mov)$/i;

const erros = [];
const avisos = [];
const erro = (alvo, msg) => erros.push(`${alvo} — ${msg}`);
const aviso = (alvo, msg) => avisos.push(`${alvo} — ${msg}`);

function juntar(caminho) {
  return caminho.startsWith('http') ? caminho : baseUrl + caminho;
}

function paraCaminho(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url.startsWith('/') ? url : null;
  }
}

function maxAge(cacheControl) {
  const m = /max-age=(\d+)/i.exec(cacheControl || '');
  return m ? parseInt(m[1], 10) : 0;
}

async function buscarTexto(caminho) {
  try {
    const res = await fetch(juntar(caminho), { method: 'GET' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** HEAD primeiro; se o servidor recusar, GET pedindo 1 byte (não baixa o mp4). */
async function headers(url) {
  try {
    let res = await fetch(url, { method: 'HEAD' });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
    }
    return { ok: true, status: res.status, cc: res.headers.get('cache-control') || '' };
  } catch (e) {
    return { ok: false, motivo: e.message };
  }
}

/**
 * Mídias publicadas, tiradas dos sitemaps do próprio site.
 * Prioriza o que está sob /filhotes e cobre cada extensão presente.
 */
async function coletarMidias() {
  const candidatas = [];

  const imagens = await buscarTexto('/sitemaps/images.xml');
  if (imagens) {
    for (const bloco of imagens.split(/<\/url>/i)) {
      const pagina = (bloco.match(/<loc>\s*([^<\s]+)\s*<\/loc>/i) || [])[1] || '';
      const daPagina = /\/filhotes/i.test(pagina);
      for (const m of bloco.matchAll(/<image:loc>\s*([^<\s]+)\s*<\/image:loc>/gi)) {
        const caminho = paraCaminho(m[1]);
        if (caminho && EXTENSOES.test(caminho)) candidatas.push({ caminho, prioridade: daPagina ? 0 : 1 });
      }
    }
  } else {
    erro('/sitemaps/images.xml', 'não foi possível ler o sitemap de imagens');
  }

  const videos = await buscarTexto('/sitemaps/videos.xml');
  if (videos) {
    for (const m of videos.matchAll(/<video:content_loc>\s*([^<\s]+)\s*<\/video:content_loc>/gi)) {
      const caminho = paraCaminho(m[1]);
      if (caminho && EXTENSOES.test(caminho)) candidatas.push({ caminho, prioridade: 0 });
    }
  } else {
    aviso('/sitemaps/videos.xml', 'não foi possível ler o sitemap de vídeos');
  }

  // Dedup preservando prioridade, e no máximo 3 por extensão para o teste
  // cobrir os tipos em vez de repetir doze webp da mesma pasta.
  const vistas = new Set();
  const porExtensao = new Map();
  const escolhidas = [];
  for (const c of candidatas.sort((a, b) => a.prioridade - b.prioridade)) {
    if (vistas.has(c.caminho)) continue;
    vistas.add(c.caminho);
    const ext = (c.caminho.match(EXTENSOES) || [''])[0].toLowerCase();
    const usadas = porExtensao.get(ext) || 0;
    if (usadas >= 3) continue;
    porExtensao.set(ext, usadas + 1);
    escolhidas.push(c.caminho);
    if (escolhidas.length >= LIMITE) break;
  }
  return escolhidas;
}

async function verificarMidia(caminho) {
  const url = juntar(caminho);
  const r = await headers(url);
  if (!r.ok) {
    erro(caminho, `não respondeu: ${r.motivo}`);
    return;
  }
  if (r.status !== 200 && r.status !== 206) {
    erro(caminho, `status ${r.status}`);
    return;
  }
  if (!r.cc) {
    erro(caminho, 'sem Cache-Control');
    return;
  }

  const idade = maxAge(r.cc);
  const temImmutable = /immutable/i.test(r.cc);
  const hashNoNome = /\/_next\/static\//.test(caminho);

  // §97 — nome estável + immutable = foto trocada que ninguém mais vê.
  if (temImmutable && !hashNoNome) {
    erro(caminho, `immutable em arquivo de nome fixo (cache-control: ${r.cc})`);
  }
  if (idade < MAX_AGE_MINIMO) {
    aviso(caminho, `max-age=${idade} — abaixo de ${MAX_AGE_MINIMO}s (cache-control: ${r.cc})`);
  }
  if (!/public/i.test(r.cc)) {
    aviso(caminho, `sem "public" (cache-control: ${r.cc})`);
  }
  console.log(`  ok  ${caminho}  →  ${r.cc}`);
}

(async () => {
  console.log(`\nHeaders de cache em ${baseUrl}\n`);

  const midias = await coletarMidias();

  if (midias.length === 0) {
    erro('(coleta)', 'nenhuma mídia publicada foi encontrada nos sitemaps');
  } else {
    console.log(`Mídias verificadas (${midias.length}):`);
    for (const caminho of midias) await verificarMidia(caminho);
  }

  // Asset com hash no nome: aqui immutable é o certo, e a falta dele custa
  // requisição repetida em toda visita.
  const html = await buscarTexto('/');
  if (html) {
    const estatico = (html.match(/\/_next\/static\/[^"'\s)]+\.(?:js|css)/) || [])[0];
    if (estatico) {
      const r = await headers(juntar(estatico));
      if (r.ok && r.status === 200) {
        console.log(`\n  ${/immutable/i.test(r.cc) ? 'ok ' : 'AV '} ${estatico}  →  ${r.cc}`);
        if (!/immutable/i.test(r.cc)) {
          aviso(estatico, 'asset com hash no nome sem immutable');
        }
      }
    }

    // HTML nunca pode ser imutável: é por ele que uma correção chega.
    const rHtml = await headers(baseUrl + '/');
    if (rHtml.ok) {
      console.log(`\n  INFO  /  →  ${rHtml.cc || '-'}`);
      if (/immutable/i.test(rHtml.cc)) erro('/', 'HTML servido como immutable');
    }
  } else {
    erro('/', 'a home não respondeu');
  }

  if (avisos.length) {
    console.log(`\nAvisos (${avisos.length}):`);
    for (const a of avisos) console.log(`  - ${a}`);
  }

  if (erros.length) {
    console.error(`\nFALHAS (${erros.length}):`);
    for (const e of erros) console.error(`  x ${e}`);
    console.error('');
    process.exit(1);
  }

  console.log(`\nOK — ${midias.length} mídia(s) com headers de cache coerentes.\n`);
})();
