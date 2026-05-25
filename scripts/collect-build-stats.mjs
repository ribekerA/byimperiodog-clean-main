#!/usr/bin/env node
/**
 * Collects Next.js build output sizes by parsing stdout of `next build` or reading `.next/trace` & `.next/server/app` assets.
 * Strategy simplified: read `.next/build-manifest.json` + `.next/app-build-manifest.json` and map file sizes.
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

function safeRead(p){ try { return readFileSync(p,'utf8'); } catch { return null; } }

const root = process.cwd();
const buildManifestPath = resolve(root, '.next/build-manifest.json');
const appBuildManifestPath = resolve(root, '.next/app-build-manifest.json');
const packageJson = JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));

const now = new Date().toISOString();
const commit = process.env.GIT_COMMIT || '';

function fileSize(path){ try { return statSync(path).size; } catch { return 0; } }

const buildManifestRaw = safeRead(buildManifestPath);
const appBuildManifestRaw = safeRead(appBuildManifestPath);
if(!buildManifestRaw || !appBuildManifestRaw){
  console.error('Missing build manifests. Run `npm run build` first.');
  process.exit(1);
}

const buildManifest = JSON.parse(buildManifestRaw);
const appBuildManifest = JSON.parse(appBuildManifestRaw);

function aggregateFiles(files){
  const map = {};
  for(const f of files){
    const abs = resolve(root, '.next', f.replace(/^\//,''));
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
    out[k] = files.map(f=> ({ file:f, bytes: fileSize(resolve(root,'.next',f)) }));
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
result.totalSharedJs = shared.filter(f=> f.endsWith('.js')).reduce((a,f)=> a + fileSize(resolve(root,'.next',f)),0);
// Approx total app route JS = sum of root layout + main app chunks found in appBuildManifest.rootMainFiles
const rootMain = appBuildManifest.rootMainFiles || [];
result.totalAppJs = rootMain.filter(f=> f.endsWith('.js')).reduce((a,f)=> a + fileSize(resolve(root,'.next',f)),0);

const outPath = resolve(root,'reports','build-stats-latest.json');
writeFileSync(outPath, JSON.stringify(result,null,2));
console.log('Wrote build stats to', outPath);
