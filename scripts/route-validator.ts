#!/usr/bin/env node

/**
 * Route Validator
 *
 * O que ele prova (e o que a versão anterior não provava):
 *  - "zero 404" agora vale para TODAS as URLs publicadas, não para uma lista
 *    de 15 rotas escrita à mão. A descoberta começa pelo sitemap — que é o que
 *    o Google recebe — e é conferida contra a varredura de app/.
 *  - a varredura de app/ atravessa route groups. `app/(public)/sobre/page.tsx`
 *    é a URL `/sobre`: o parêntese não entra no caminho, mas a pasta precisa
 *    ser percorrida. A versão anterior dava `continue` em tudo que começava
 *    com "(", ou seja, ignorava a árvore pública inteira.
 *  - redirecionamento é seguido à mão (redirect: "manual"), então dá para ver
 *    a cadeia inteira: quantos saltos, para onde, e qual o status final.
 *  - a proteção do /admin é medida no primeiro salto. Com redirect: "follow" o
 *    código enxergava o 200 da tela de login e concluía "admin acessível sem
 *    auth" — diagnóstico invertido.
 *  - links internos das páginas públicas são conferidos um a um: destino 404,
 *    cadeia de redirect desnecessária, host errado e âncora inexistente.
 *  - uma URL que não existe precisa responder 404 de verdade. 200 ou redirect
 *    para a home nesse caso é erro.
 *
 * Uso:
 *   npm run route:validate                  # http://localhost:3000
 *   npm run route:validate:prod             # https://byimperiodog.com.br
 *   npx cross-env ROUTE_VALIDATOR_URL=https://outro-host npm run route:validate
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(PROJECT_ROOT, 'app');

/** Rotas do admin que exigem sessão. /admin/login fica de fora: é a tela de
 *  login, tem de responder 200 para qualquer visitante. */
const ADMIN_PROTECTED_ROUTES = ['/admin', '/admin/dashboard', '/admin/leads'];
const ADMIN_LOGIN_ROUTE = '/admin/login';

/** URLs que não existem. O site pode mostrar uma página bonita, mas o status
 *  tem de continuar 404 — senão o Google indexa erro como conteúdo. */
const NOT_FOUND_PROBES = [
  '/esta-pagina-nao-existe-teste-404',
  '/filhotes/filhote-que-nao-existe-teste-404',
  '/blog/post-que-nao-existe-teste-404',
];

const TIMEOUT_MS = Number(process.env.ROUTE_VALIDATOR_TIMEOUT || 20000);
const CONCURRENCY = Number(process.env.ROUTE_VALIDATOR_CONCURRENCY || 5);
const MAX_HOPS = 5;

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Hop {
  url: string;
  status: number;
  location: string | null;
}

interface PageResult {
  route: string;
  origin: 'sitemap' | 'app' | 'sitemap+app';
  finalUrl: string;
  finalStatus: number;
  hops: Hop[];
  redirected: boolean;
  title: string | null;
  titleLanguage: string | null;
  canonical: string | null;
  contentLength: number;
  responseTime: number;
  error?: string;
}

interface LinkResult {
  target: string;
  status: number;
  finalUrl: string;
  hops: number;
  foundOn: string[];
  problem: string | null;
}

interface AdminResult {
  route: string;
  firstStatus: number;
  location: string | null;
  verdict: 'PROTEGIDO' | 'ACESSIVEL_SEM_AUTH' | 'INDEFINIDO';
}

interface ValidationReport {
  timestamp: string;
  baseUrl: string;
  discovery: {
    sitemapUrl: string | null;
    sitemapCount: number;
    appRouteCount: number;
    appDynamicRoutes: string[];
    appRoutesForaDoSitemap: string[];
    testedCount: number;
  };
  summary: {
    totalRoutesTested: number;
    sitemapTested: number;
    sitemapTotal: number;
    successCount: number;
    errorCount: number;
    warningCount: number;
    internalLinksChecked: number;
    internalLinksBroken: number;
    redirectChains: number;
  };
  errors: {
    route404: PageResult[];
    route5xx: PageResult[];
    adminAccessible: AdminResult[];
    titleMissing: PageResult[];
    notFoundProbeFailed: { route: string; status: number; finalUrl: string }[];
    internalBrokenLinks: LinkResult[];
    canonicalMismatch: { route: string; canonical: string | null; esperado: string }[];
    fetchFailed: PageResult[];
  };
  warnings: {
    unexpectedRedirect: PageResult[];
    redirectChains: LinkResult[];
    titleNotPt: PageResult[];
    slowResponse: PageResult[];
    canonicalHosts: string[];
  };
  admin: AdminResult[];
  notFoundProbes: { route: string; status: number; finalUrl: string; ok: boolean }[];
  canonicalRedirects: { from: string; hops: Hop[]; finalUrl: string; ok: boolean }[];
  rawData: PageResult[];
}

// ─── HTTP com cadeia de redirecionamento visível ─────────────────────────────

async function fetchOnce(url: string, method: 'GET' | 'HEAD') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'RouteValidator/2.0 (By Imperio Dog QA)' },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Segue redirecionamento na mão para poder contar os saltos. `redirect:
 * "manual"` devolve a resposta 3xx crua, com o Location no header — é assim
 * que se distingue "protegido, redirecionou para o login" de "abriu".
 */
async function request(
  url: string,
  method: 'GET' | 'HEAD' = 'GET'
): Promise<{ hops: Hop[]; finalUrl: string; status: number; body: string; timeMs: number }> {
  const started = Date.now();
  const hops: Hop[] = [];
  let current = url;
  let body = '';
  let status = 0;

  for (let i = 0; i <= MAX_HOPS; i++) {
    const response = await fetchOnce(current, method);
    status = response.status;
    const location = response.headers.get('location');
    hops.push({ url: current, status, location });

    if (status >= 300 && status < 400 && location && i < MAX_HOPS) {
      current = new URL(location, current).toString();
      continue;
    }

    const contentType = response.headers.get('content-type') || '';
    if (method === 'GET' && contentType.includes('text/html')) {
      body = await response.text();
    } else {
      // Descarta o corpo para o socket não ficar preso.
      try { await response.arrayBuffer(); } catch { /* ignore */ }
    }
    break;
  }

  return { hops, finalUrl: current, status, body, timeMs: Date.now() - started };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

// ─── Descoberta: sitemap ─────────────────────────────────────────────────────

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

/** O sitemap publica URLs absolutas com o domínio canônico. Quando o teste roda
 *  contra localhost, o host tem de ser trocado — o caminho é o que interessa. */
function toPath(absoluteOrPath: string): string {
  try {
    const u = new URL(absoluteOrPath);
    return u.pathname + u.search;
  } catch {
    return absoluteOrPath.startsWith('/') ? absoluteOrPath : `/${absoluteOrPath}`;
  }
}

async function discoverFromSitemap(
  baseUrl: string
): Promise<{ urls: string[]; sitemapUrl: string | null }> {
  const candidates = ['/sitemap-index.xml', '/sitemap.xml'];
  for (const candidate of candidates) {
    try {
      const { status, body } = await request(new URL(candidate, baseUrl).toString());
      if (status !== 200 || !body.includes('<loc>')) continue;

      let locs = extractLocs(body);
      if (body.includes('<sitemapindex')) {
        const children = locs;
        locs = [];
        for (const child of children) {
          const childUrl = new URL(toPath(child), baseUrl).toString();
          const childResponse = await request(childUrl);
          if (childResponse.status === 200) locs.push(...extractLocs(childResponse.body));
        }
      }
      const urls = [...new Set(locs.map(toPath))].sort();
      if (urls.length) return { urls, sitemapUrl: candidate };
    } catch {
      // tenta o próximo candidato
    }
  }
  return { urls: [], sitemapUrl: null };
}

// ─── Descoberta: árvore app/ ─────────────────────────────────────────────────

interface AppScan {
  staticRoutes: string[];
  dynamicRoutes: string[];
}

/**
 * Route group — `(public)`, `(admin)` — é organização de pasta, não segmento de
 * URL: entra na recursão sem entrar no caminho. Rota paralela (`@modal`) e
 * pasta privada (`_lib`) não produzem URL. Segmento dinâmico (`[slug]`) produz
 * URL, mas só o sitemap sabe quais valores existem: fica registrado à parte.
 */
async function scanAppDirectory(dir: string, urlPath = ''): Promise<AppScan> {
  const out: AppScan = { staticRoutes: [], dynamicRoutes: [] };

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    console.error(`Erro ao ler ${dir}:`, error);
    return out;
  }

  const hasPage = entries.some((e) => e.isFile() && /^page\.(tsx|ts|jsx|js)$/.test(e.name));
  if (hasPage) {
    const route = urlPath === '' ? '/' : urlPath;
    if (route.includes('[')) out.dynamicRoutes.push(route);
    else out.staticRoutes.push(route);
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const { name } = entry;
    if (name === 'node_modules' || name.startsWith('.') || name.startsWith('_') || name.startsWith('@')) continue;
    if (urlPath === '' && name === 'api') continue; // app/api não devolve página

    const full = path.join(dir, name);
    const isRouteGroup = name.startsWith('(') && name.endsWith(')');
    const childPath = isRouteGroup ? urlPath : `${urlPath}/${name}`;
    const child = await scanAppDirectory(full, childPath);
    out.staticRoutes.push(...child.staticRoutes);
    out.dynamicRoutes.push(...child.dynamicRoutes);
  }

  return out;
}

// ─── Leitura do HTML ─────────────────────────────────────────────────────────

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractCanonical(html: string): string | null {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!match) return null;
  const href = match[0].match(/href=["']([^"']+)["']/i);
  return href ? href[1] : null;
}

function detectTitleLanguage(title: string | null): string | null {
  if (!title) return null;
  const ptKeywords = [
    'filhote', 'spitz', 'alemão', 'imperio', 'império', 'dog', 'pomerânia', 'comprar',
    'criador', 'anão', 'contato', 'sobre', 'blog', 'guia', 'tutor', 'cuidado',
    'preço', 'reserv', 'lulu', 'canil', 'ninhada', 'galeria', 'busca', 'política',
    'termos', 'alimentação', 'temperamento', 'obrigado',
  ];
  const otherLanguages: Record<string, string[]> = {
    hu: ['pomerániai', 'kölyökkutyák', 'élhető', 'prémium', 'kolyok'],
    en: ['puppy', 'puppies', 'breeder', 'price', 'contact', 'about'],
    es: ['cachorro', 'criador', 'perro', 'precio', 'contacto'],
    de: ['welpe', 'züchter', 'hund', 'preis', 'kontakt'],
  };

  const lower = title.toLowerCase();
  if (otherLanguages.hu.some((w) => lower.includes(w))) return 'hu';
  if (ptKeywords.some((w) => lower.includes(w))) return 'pt-BR';
  for (const [lang, words] of Object.entries(otherLanguages)) {
    if (words.some((w) => lower.includes(w))) return lang;
  }
  return 'unknown';
}

/** Todos os href da página, já separados entre interno, externo e âncora. */
function extractLinks(html: string): string[] {
  const hrefs = [...html.matchAll(/<a\b[^>]*\shref=["']([^"']+)["']/gi)].map((m) => m[1]);
  return [...new Set(hrefs)];
}

function extractIds(html: string): Set<string> {
  const ids = new Set<string>();
  for (const m of html.matchAll(/\sid=["']([^"']+)["']/g)) ids.add(m[1]);
  for (const m of html.matchAll(/<a\b[^>]*\sname=["']([^"']+)["']/gi)) ids.add(m[1]);
  return ids;
}

// ─── Execução ────────────────────────────────────────────────────────────────

async function checkPage(
  baseUrl: string,
  route: string,
  origin: PageResult['origin']
): Promise<PageResult> {
  const url = new URL(route, baseUrl).toString();
  try {
    const { hops, finalUrl, status, body, timeMs } = await request(url);
    return {
      route,
      origin,
      finalUrl,
      finalStatus: status,
      hops,
      redirected: hops.length > 1,
      title: extractTitle(body),
      titleLanguage: detectTitleLanguage(extractTitle(body)),
      canonical: extractCanonical(body),
      contentLength: body.length,
      responseTime: timeMs,
    };
  } catch (error) {
    return {
      route,
      origin,
      finalUrl: url,
      finalStatus: 0,
      hops: [],
      redirected: false,
      title: null,
      titleLanguage: null,
      canonical: null,
      contentLength: 0,
      responseTime: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkAdmin(baseUrl: string, route: string): Promise<AdminResult> {
  const url = new URL(route, baseUrl).toString();
  // Sem seguir: o que interessa é a PRIMEIRA resposta. Seguir levava ao 200 da
  // tela de login e fazia o teste concluir que o admin estava aberto.
  const response = await fetchOnce(url, 'GET');
  try { await response.arrayBuffer(); } catch { /* ignore */ }
  const location = response.headers.get('location');
  const status = response.status;

  let verdict: AdminResult['verdict'] = 'INDEFINIDO';
  if (status === 200) verdict = 'ACESSIVEL_SEM_AUTH';
  else if (status === 401 || status === 403) verdict = 'PROTEGIDO';
  else if (status >= 300 && status < 400 && location) {
    const destino = new URL(location, url).pathname;
    verdict = destino.startsWith('/admin/login') ? 'PROTEGIDO' : 'INDEFINIDO';
  }

  return { route, firstStatus: status, location, verdict };
}

async function checkNotFound(baseUrl: string, route: string) {
  const url = new URL(route, baseUrl).toString();
  const { status, finalUrl, hops } = await request(url);
  // 404 tem de ser 404 na primeira resposta: redirect para a home é pior que
  // erro, porque devolve 200 para uma URL que não existe.
  const ok = status === 404 && hops.length === 1;
  return { route, status, finalUrl, ok };
}

async function checkCanonicalRedirects(baseUrl: string) {
  const out: { from: string; hops: Hop[]; finalUrl: string; ok: boolean }[] = [];
  const canonicalOrigin = new URL(baseUrl).origin;
  const host = new URL(baseUrl).host;
  if (host.startsWith('localhost') || host.startsWith('127.')) return out;

  const nakedHost = host.replace(/^www\./, '');
  const variants = [
    `http://${nakedHost}/`,
    `https://www.${nakedHost}/`,
    `http://www.${nakedHost}/`,
  ];

  for (const from of variants) {
    try {
      const { hops, finalUrl, status } = await request(from);
      const ok = status === 200 && new URL(finalUrl).origin === canonicalOrigin;
      out.push({ from, hops, finalUrl, ok });
    } catch (error) {
      out.push({
        from,
        hops: [],
        finalUrl: `ERRO: ${error instanceof Error ? error.message : String(error)}`,
        ok: false,
      });
    }
  }
  return out;
}

async function checkInternalLinks(
  baseUrl: string,
  pages: PageResult[],
  htmlByRoute: Map<string, string>
): Promise<LinkResult[]> {
  const baseHost = new URL(baseUrl).host;
  const alvos = new Map<string, Set<string>>(); // caminho -> páginas de origem
  const ancoras: { target: string; page: string; hash: string; path: string }[] = [];
  const problemasDeHost: LinkResult[] = [];

  for (const page of pages) {
    const html = htmlByRoute.get(page.route);
    if (!html) continue;

    for (const href of extractLinks(html)) {
      if (/^(mailto:|tel:|javascript:|data:|#)/i.test(href)) {
        if (href.startsWith('#')) {
          ancoras.push({ target: href, page: page.route, hash: href.slice(1), path: page.route });
        }
        continue;
      }

      let alvo: URL;
      try {
        alvo = new URL(href, new URL(page.route, baseUrl));
      } catch {
        continue;
      }

      if (alvo.protocol !== 'http:' && alvo.protocol !== 'https:') continue;

      const ehInterno =
        alvo.host === baseHost ||
        /(^|\.)byimperiodog\.com\.br$/.test(alvo.host);

      if (!ehInterno) continue;

      if (alvo.host !== baseHost) {
        // Link interno escrito com host absoluto diferente do que está sendo
        // testado: em produção isso vira salto desnecessário ou domínio errado.
        problemasDeHost.push({
          target: alvo.toString(),
          status: 0,
          finalUrl: alvo.toString(),
          hops: 0,
          foundOn: [page.route],
          problem: `link interno absoluto para host ${alvo.host} (base é ${baseHost})`,
        });
        continue;
      }

      const caminho = alvo.pathname + alvo.search;
      if (alvo.hash) {
        ancoras.push({ target: href, page: page.route, hash: alvo.hash.slice(1), path: caminho });
      }
      if (!alvos.has(caminho)) alvos.set(caminho, new Set());
      alvos.get(caminho)!.add(page.route);
    }
  }

  const lista = [...alvos.entries()];
  const resultados = await mapWithConcurrency(lista, CONCURRENCY, async ([caminho, origens]) => {
    const jaTestada = pages.find((p) => p.route === caminho);
    const { status, finalUrl, hops } =
      jaTestada && !jaTestada.error
        ? { status: jaTestada.finalStatus, finalUrl: jaTestada.finalUrl, hops: jaTestada.hops }
        : await request(new URL(caminho, baseUrl).toString());

    let problem: string | null = null;
    if (status === 0) problem = 'sem resposta';
    else if (status === 404) problem = 'destino 404';
    else if (status >= 500) problem = `destino ${status}`;
    else if (hops.length > 2) problem = `cadeia de ${hops.length - 1} redirects`;
    else if (hops.length === 2) problem = `redirect (${hops[0].status}) para ${new URL(finalUrl).pathname}`;

    const resultado: LinkResult = {
      target: caminho,
      status,
      finalUrl,
      hops: Math.max(0, hops.length - 1),
      foundOn: [...origens].slice(0, 5),
      problem,
    };
    return resultado;
  });

  // Âncoras: o id precisa existir na página de destino.
  const ancoraResultados: LinkResult[] = [];
  const ancorasUnicas = new Map<string, { hash: string; path: string; pages: Set<string> }>();
  for (const a of ancoras) {
    const chave = `${a.path}#${a.hash}`;
    if (!ancorasUnicas.has(chave)) ancorasUnicas.set(chave, { hash: a.hash, path: a.path, pages: new Set() });
    ancorasUnicas.get(chave)!.pages.add(a.page);
  }
  for (const [chave, info] of ancorasUnicas) {
    let html = htmlByRoute.get(info.path);
    if (!html) {
      const r = await request(new URL(info.path, baseUrl).toString());
      html = r.body;
      if (r.status !== 200) {
        ancoraResultados.push({
          target: chave, status: r.status, finalUrl: r.finalUrl, hops: 0,
          foundOn: [...info.pages].slice(0, 5), problem: `âncora em página ${r.status}`,
        });
        continue;
      }
    }
    const ids = extractIds(html);
    if (!ids.has(info.hash) && !ids.has(decodeURIComponent(info.hash))) {
      ancoraResultados.push({
        target: chave, status: 200, finalUrl: info.path, hops: 0,
        foundOn: [...info.pages].slice(0, 5), problem: 'âncora inexistente na página de destino',
      });
    }
  }

  return [...problemasDeHost, ...resultados, ...ancoraResultados];
}

// ─── Relatório ───────────────────────────────────────────────────────────────

async function generateReport(baseUrl: string): Promise<ValidationReport> {
  console.log(`\n=== Route Validator ===\nBase: ${baseUrl}\n`);

  // 1) Descoberta
  const { urls: sitemapUrls, sitemapUrl } = await discoverFromSitemap(baseUrl);
  const appScan = await scanAppDirectory(APP_DIR);
  const appPublicRoutes = appScan.staticRoutes
    .filter((r) => !r.startsWith('/admin'))
    .filter((r) => r !== '/')
    .sort();

  const sitemapSet = new Set(sitemapUrls);
  const foraDoSitemap = appPublicRoutes.filter((r) => !sitemapSet.has(r));

  const todas = [...new Set([...sitemapUrls, '/', ...appPublicRoutes])].sort();

  console.log(`Sitemap: ${sitemapUrl ?? '(não encontrado)'} — ${sitemapUrls.length} URLs`);
  console.log(`app/: ${appScan.staticRoutes.length} rotas estáticas, ${appScan.dynamicRoutes.length} dinâmicas`);
  console.log(`Rotas públicas estáticas fora do sitemap: ${foraDoSitemap.length}`);
  console.log(`Total a testar: ${todas.length}\n`);

  // 2) Páginas
  const htmlByRoute = new Map<string, string>();
  const results = await mapWithConcurrency(todas, CONCURRENCY, async (route) => {
    const origin: PageResult['origin'] =
      sitemapSet.has(route) && appPublicRoutes.includes(route)
        ? 'sitemap+app'
        : sitemapSet.has(route)
          ? 'sitemap'
          : 'app';
    const url = new URL(route, baseUrl).toString();
    let result: PageResult;
    try {
      const { hops, finalUrl, status, body, timeMs } = await request(url);
      const title = extractTitle(body);
      htmlByRoute.set(route, body);
      result = {
        route, origin, finalUrl, finalStatus: status, hops,
        redirected: hops.length > 1,
        title,
        titleLanguage: detectTitleLanguage(title),
        canonical: extractCanonical(body),
        contentLength: body.length,
        responseTime: timeMs,
      };
    } catch (error) {
      result = await checkPage(baseUrl, route, origin);
      if (!result.error) result.error = error instanceof Error ? error.message : String(error);
    }

    const marca =
      result.error ? 'ERRO' :
      result.finalStatus === 404 ? '404 ' :
      result.finalStatus >= 500 ? `${result.finalStatus} ` :
      result.redirected ? `${result.hops[0].status}→` :
      result.finalStatus === 200 ? 'ok  ' : `${result.finalStatus} `;
    console.log(`  ${marca} ${result.route}`);
    return result;
  });

  // 3) Links internos
  console.log('\n=== Links internos ===');
  const linkResults = await checkInternalLinks(baseUrl, results, htmlByRoute);
  const linksQuebrados = linkResults.filter(
    (l) => l.problem && (l.problem.includes('404') || l.problem.includes('sem resposta') ||
      l.problem.startsWith('destino 5') || l.problem.includes('host ') || l.problem.includes('âncora'))
  );
  const cadeias = linkResults.filter((l) => l.problem && l.problem.includes('redirect'));
  console.log(`  destinos únicos conferidos: ${linkResults.length}`);
  console.log(`  quebrados: ${linksQuebrados.length} | com redirect: ${cadeias.length}`);

  // 4) Admin
  console.log('\n=== Admin (redirect: manual) ===');
  const admin: AdminResult[] = [];
  for (const route of ADMIN_PROTECTED_ROUTES) {
    const r = await checkAdmin(baseUrl, route);
    admin.push(r);
    console.log(`  ${r.verdict.padEnd(20)} ${route} (${r.firstStatus}${r.location ? ` → ${r.location}` : ''})`);
  }
  const login = await checkAdmin(baseUrl, ADMIN_LOGIN_ROUTE);
  console.log(`  ${login.firstStatus === 200 ? 'LOGIN OK' : 'LOGIN ' + login.firstStatus}          ${ADMIN_LOGIN_ROUTE}`);

  // 5) 404 real
  console.log('\n=== 404 real ===');
  const notFoundProbes = [];
  for (const probe of NOT_FOUND_PROBES) {
    const r = await checkNotFound(baseUrl, probe);
    notFoundProbes.push(r);
    console.log(`  ${r.ok ? 'ok  ' : 'FALHA'} ${probe} → ${r.status}`);
  }

  // 6) Canônico
  const canonicalRedirects = await checkCanonicalRedirects(baseUrl);
  if (canonicalRedirects.length) {
    console.log('\n=== Redirect canônico ===');
    for (const c of canonicalRedirects) {
      console.log(`  ${c.ok ? 'ok  ' : 'FALHA'} ${c.from} → ${c.finalUrl} (${c.hops.length - 1} salto(s))`);
    }
  }

  // 7) Classificação
  const canonicalOrigin = new URL(baseUrl).origin;
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    baseUrl,
    discovery: {
      sitemapUrl,
      sitemapCount: sitemapUrls.length,
      appRouteCount: appScan.staticRoutes.length,
      appDynamicRoutes: appScan.dynamicRoutes.sort(),
      appRoutesForaDoSitemap: foraDoSitemap,
      testedCount: todas.length,
    },
    summary: {
      totalRoutesTested: results.length,
      sitemapTested: results.filter((r) => sitemapSet.has(r.route)).length,
      sitemapTotal: sitemapUrls.length,
      successCount: 0,
      errorCount: 0,
      warningCount: 0,
      internalLinksChecked: linkResults.length,
      internalLinksBroken: linksQuebrados.length,
      redirectChains: cadeias.length,
    },
    errors: {
      route404: results.filter((r) => r.finalStatus === 404),
      route5xx: results.filter((r) => r.finalStatus >= 500),
      adminAccessible: admin.filter((a) => a.verdict === 'ACESSIVEL_SEM_AUTH'),
      titleMissing: results.filter((r) => !r.error && r.finalStatus === 200 && (!r.title || r.title.length < 10)),
      notFoundProbeFailed: notFoundProbes.filter((p) => !p.ok).map(({ route, status, finalUrl }) => ({ route, status, finalUrl })),
      internalBrokenLinks: linksQuebrados,
      canonicalMismatch: results
        .filter((r) => r.finalStatus === 200 && sitemapSet.has(r.route))
        .filter((r) => {
          if (!r.canonical) return true;
          try { return new URL(r.canonical).origin !== canonicalOrigin && !new URL(r.canonical).host.endsWith('byimperiodog.com.br'); }
          catch { return true; }
        })
        .map((r) => ({ route: r.route, canonical: r.canonical, esperado: `${canonicalOrigin}${r.route}` })),
      fetchFailed: results.filter((r) => !!r.error),
    },
    warnings: {
      unexpectedRedirect: results.filter((r) => r.redirected && sitemapSet.has(r.route)),
      redirectChains: cadeias,
      titleNotPt: results.filter(
        (r) => r.title && r.titleLanguage && r.titleLanguage !== 'pt-BR' && r.titleLanguage !== 'unknown'
      ),
      slowResponse: results.filter((r) => r.responseTime > 3000),
      canonicalHosts: [
        ...new Set(
          results.map((r) => { try { return r.canonical ? new URL(r.canonical).origin : ''; } catch { return ''; } }).filter(Boolean)
        ),
      ],
    },
    admin: [...admin, login],
    notFoundProbes,
    canonicalRedirects,
    rawData: results,
  };

  const e = report.errors;
  report.summary.errorCount =
    e.route404.length + e.route5xx.length + e.adminAccessible.length + e.titleMissing.length +
    e.notFoundProbeFailed.length + e.internalBrokenLinks.length + e.canonicalMismatch.length +
    e.fetchFailed.length + canonicalRedirects.filter((c) => !c.ok).length;
  report.summary.warningCount =
    report.warnings.unexpectedRedirect.length + report.warnings.redirectChains.length +
    report.warnings.titleNotPt.length + report.warnings.slowResponse.length;
  report.summary.successCount = results.filter((r) => r.finalStatus === 200 && !r.error).length;

  return report;
}

function printReportSummary(report: ValidationReport): void {
  const { summary, errors, warnings } = report;
  console.log(`
=== RESULTADO ===
  URLs do sitemap testadas: ${summary.sitemapTested}/${summary.sitemapTotal}
  Rotas testadas no total:  ${summary.totalRoutesTested}
  Respostas 200:            ${summary.successCount}
  Erros:                    ${summary.errorCount}
  Avisos:                   ${summary.warningCount}
  Links internos:           ${summary.internalLinksChecked} destinos, ${summary.internalLinksBroken} quebrados
  Redirects em links:       ${summary.redirectChains}
`);

  const bloco = (titulo: string, linhas: string[]) => {
    if (!linhas.length) return;
    console.log(titulo);
    linhas.slice(0, 40).forEach((l) => console.log(`   • ${l}`));
    if (linhas.length > 40) console.log(`   • … +${linhas.length - 40}`);
    console.log();
  };

  bloco('ROTAS 404:', errors.route404.map((r) => `${r.route} (${r.origin})`));
  bloco('ROTAS 5xx:', errors.route5xx.map((r) => `${r.route} → ${r.finalStatus}`));
  bloco('SEM RESPOSTA:', errors.fetchFailed.map((r) => `${r.route} — ${r.error}`));
  bloco('ADMIN ACESSÍVEL SEM AUTH:', errors.adminAccessible.map((a) => `${a.route} → ${a.firstStatus}`));
  bloco('TÍTULO AUSENTE/CURTO:', errors.titleMissing.map((r) => `${r.route} — "${r.title ?? ''}"`));
  bloco('404 QUE NÃO É 404:', errors.notFoundProbeFailed.map((p) => `${p.route} → ${p.status} (${p.finalUrl})`));
  bloco('LINKS INTERNOS QUEBRADOS:', errors.internalBrokenLinks.map((l) => `${l.target} — ${l.problem} (em ${l.foundOn.join(', ')})`));
  bloco('CANONICAL FORA DO DOMÍNIO:', errors.canonicalMismatch.map((c) => `${c.route} → ${c.canonical ?? '(ausente)'}`));
  bloco('REDIRECT INESPERADO EM URL DO SITEMAP:', warnings.unexpectedRedirect.map((r) => `${r.route} → ${r.finalUrl}`));
  bloco('LINKS COM REDIRECT:', warnings.redirectChains.map((l) => `${l.target} — ${l.problem}`));
  bloco('TÍTULO NÃO-PORTUGUÊS:', warnings.titleNotPt.map((r) => `${r.route} (${r.titleLanguage}) "${r.title}"`));
  bloco('RESPOSTA LENTA (>3s):', warnings.slowResponse.map((r) => `${r.route} — ${r.responseTime}ms`));
  bloco('ROTAS PÚBLICAS FORA DO SITEMAP:', report.discovery.appRoutesForaDoSitemap);

  console.log(`Origens de canonical vistas: ${warnings.canonicalHosts.join(', ') || '(nenhuma)'}`);
  console.log(summary.errorCount === 0 ? '\nSem erros.' : `\n${summary.errorCount} erro(s).`);
}

async function main(): Promise<void> {
  const baseUrl = (process.env.ROUTE_VALIDATOR_URL || 'http://localhost:3000').replace(/\/$/, '');
  const outputDir = path.join(PROJECT_ROOT, 'reports');
  const outputFile = path.join(outputDir, 'route-validation.json');

  await fs.mkdir(outputDir, { recursive: true }).catch(() => {});
  const report = await generateReport(baseUrl);
  await fs.writeFile(outputFile, JSON.stringify(report, null, 2), 'utf-8');
  printReportSummary(report);
  console.log(`\nRelatório: ${path.relative(PROJECT_ROOT, outputFile)}`);

  if (report.summary.errorCount > 0) process.exit(1);
}

main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
