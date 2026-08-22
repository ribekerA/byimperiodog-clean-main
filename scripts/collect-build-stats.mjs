#!/usr/bin/env node
/**
 * Collects Next.js build output sizes by parsing stdout of `next build` or reading `.next/trace` & `.next/server/app` assets.
 * Strategy simplified: read `.next/build-manifest.json` + `.next/app-build-manifest.json` and map file sizes.
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

function safeRead(p){ try { return readFileSync(p,'utf8'); } catch { return null; } }

const root = process.cwd();
const DIST = process.env.NEXT_DIST_DIR || '.next';
const buildManifestPath = resolve(root, DIST, 'build-manifest.json');
const appBuildManifestPath = resolve(root, DIST, 'app-build-manifest.json');
const packageJson = JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));

const now = new Date().toISOString();
const commit = process.env.GIT_COMMIT || '';

function fileSize(path){ try { return statSync(path).size; } catch { return 0; } }

const buildManifestRaw = safeRead(buildManifestPath);
const appBuildManifestRaw = safeRead(appBuildManifestPath);
if(!buildManifestRaw || !appBuildManifestRaw){
  console.error(`Missing build manifests em ${DIST}/. Rode ${'npm run build'} antes (ou aponte NEXT_DIST_DIR).`);
  process.exit(1);
}

const buildManifest = JSON.parse(buildManifestRaw);
const appBuildManifest = JSON.parse(appBuildManifestRaw);

function aggregateFiles(files){
  const map = {};
  for(const f of files){
    const abs = resolve(root, DIST, f.replace(/^\//,''));
    map[f] = { bytes: fileSize(abs) };
  }
  return map;
}

const pages = buildManifest.pages || {};
const appPages = appBuildManifest.pages || {};

function flattenPages(obj){
  const out = {};
  for(const k of Object.keys(obj)){
    const files = obj[k];
    out[k] = files.map(f=> ({ file:f, bytes: fileSize(resolve(root,DIST,f)) }));
  }
  return out;
}

const result = {
  generatedAt: now,
  commit,
  node: process.version,
  packageVersion: packageJson.version,
  pages: flattenPages(pages),
  appPages: flattenPages(appPages),
  totalAppJs: 0,
  totalSharedJs: 0,
};

// Rough totals: sum JS in shared chunk keys
const shared = buildManifest?.pages?.['/_app'] || [];
result.totalSharedJs = shared.filter(f=> f.endsWith('.js')).reduce((a,f)=> a + fileSize(resolve(root,DIST,f)),0);
// Approx total app route JS = sum of root layout + main app chunks found in appBuildManifest.rootMainFiles
const rootMain = appBuildManifest.rootMainFiles || [];
result.totalAppJs = rootMain.filter(f=> f.endsWith('.js')).reduce((a,f)=> a + fileSize(resolve(root,DIST,f)),0);

// First Load JS por rota: os chunks da própria rota mais os que toda página
// carrega (rootMainFiles), contados uma vez só. É a mesma conta que o resumo
// do next build mostra na coluna "First Load JS".
const rootMainJs = rootMain.filter(f=> f.endsWith('.js'));
result.firstLoadJsPorRota = {};
for(const rota of Object.keys(appPages)){
  const arquivos = new Set([...rootMainJs, ...appPages[rota].filter(f=> f.endsWith('.js'))]);
  result.firstLoadJsPorRota[rota] = [...arquivos].reduce((a,f)=> a + fileSize(resolve(root,DIST,f)),0);
}

const outPath = resolve(root,'reports','build-stats-latest.json');
writeFileSync(outPath, JSON.stringify(result,null,2));
console.log('Wrote build stats to', outPath);

const kb = (n)=> (n/1024).toFixed(1)+' kB';
console.log('Shared JS (pages/_app):', kb(result.totalSharedJs));
console.log('Root main JS (app):    ', kb(result.totalAppJs));
const destaques = ['/page','/filhotes/page','/blog/page','/preco-spitz-anao/page','/comprar-spitz-anao/page'];
for(const rota of destaques){
  if(result.firstLoadJsPorRota[rota] !== undefined){
    console.log(('First Load JS '+rota).padEnd(34), kb(result.firstLoadJsPorRota[rota]));
  }
}
