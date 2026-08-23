#!/usr/bin/env node
/**
 * Collects Next.js client build output sizes from the generated manifests.
 * Next <= 15 exposes a top-level app-build-manifest.json. Next 16 moved the
 * App Router information to one client-reference manifest per route, so this
 * collector supports both layouts.
 */
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
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
if(!buildManifestRaw){
  console.error('Missing build manifest. Run `npm run build` first.');
  process.exit(1);
}

const buildManifest = JSON.parse(buildManifestRaw);
const appBuildManifest = appBuildManifestRaw ? JSON.parse(appBuildManifestRaw) : null;

const pages = buildManifest.pages || {};
function walkFiles(directory){
  const out = [];
  for(const entry of readdirSync(directory, { withFileTypes: true })){
    const path = resolve(directory, entry.name);
    if(entry.isDirectory()) out.push(...walkFiles(path));
    else out.push(path);
  }
  return out;
}

function readNext16AppPages(){
  const appServerDirectory = resolve(root, '.next', 'server', 'app');
  let manifests = [];
  try {
    manifests = walkFiles(appServerDirectory)
      .filter(path => path.endsWith('_client-reference-manifest.js'));
  } catch {
    return {};
  }

  const out = {};
  const marker = 'globalThis.__RSC_MANIFEST[';
  const rootFiles = buildManifest.rootMainFiles || [];

  for(const path of manifests){
    const source = safeRead(path);
    const markerIndex = source?.lastIndexOf(marker) ?? -1;
    if(markerIndex < 0) continue;

    const keyStart = markerIndex + marker.length;
    const keyEnd = source.indexOf(']=', keyStart);
    if(keyEnd < 0) continue;

    try {
      const route = JSON.parse(source.slice(keyStart, keyEnd));
      const manifest = JSON.parse(source.slice(keyEnd + 2).replace(/;\s*$/, ''));
      const files = new Set(rootFiles);

      for(const module of Object.values(manifest.clientModules || {})){
        for(const chunk of module.chunks || []){
          if(typeof chunk === 'string' && chunk.startsWith('static/')) files.add(chunk);
        }
      }
      for(const entries of Object.values(manifest.entryCSSFiles || {})){
        for(const entry of entries){
          if(entry?.path?.startsWith('static/')) files.add(entry.path);
        }
      }

      out[route] = [...files];
    } catch {
      // A malformed route manifest must not prevent the remaining routes from
      // being measured; it simply stays absent from the report.
    }
  }

  return out;
}

const appPages = appBuildManifest?.pages || readNext16AppPages();

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
const rootMain = appBuildManifest?.rootMainFiles || buildManifest.rootMainFiles || [];
result.totalAppJs = rootMain.filter(f=> f.endsWith('.js')).reduce((a,f)=> a + fileSize(resolve(root,'.next',f)),0);

const outPath = resolve(root,'reports','build-stats-latest.json');
writeFileSync(outPath, JSON.stringify(result,null,2));
console.log('Wrote build stats to', outPath);
