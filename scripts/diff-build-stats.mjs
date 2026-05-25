#!/usr/bin/env node
/**
 * Diff two build stats JSON files (from collect-build-stats.mjs) and output markdown + json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const [ , , aPathArg, bPathArg ] = process.argv;
if(!aPathArg || !bPathArg){
  console.error('Usage: node scripts/diff-build-stats.mjs <old.json> <new.json>');
  process.exit(1);
}

const root = process.cwd();
const aPath = resolve(root, aPathArg);
const bPath = resolve(root, bPathArg);
const a = JSON.parse(readFileSync(aPath,'utf8'));
const b = JSON.parse(readFileSync(bPath,'utf8'));

function summarizePages(obj){
  const out = [];
  for(const k of Object.keys(obj)){
    const total = obj[k].reduce((acc, f)=> acc + f.bytes,0);
    out.push({ route:k, total });
  }
  return out.sort((x,y)=> x.route.localeCompare(y.route));
}

function toMap(list){ const m={}; for(const i of list) m[i.route]=i; return m; }
const pagesA = toMap(summarizePages(a.pages));
const pagesB = toMap(summarizePages(b.pages));

const allRoutes = Array.from(new Set([...Object.keys(pagesA), ...Object.keys(pagesB)])).sort();

const rows = allRoutes.map(r => {
  const oldBytes = pagesA[r]?.total || 0;
  const newBytes = pagesB[r]?.total || 0;
  const diff = newBytes - oldBytes;
  const pct = oldBytes ? ((diff/oldBytes)*100).toFixed(1)+'%' : 'n/a';
  return { route:r, oldBytes, newBytes, diff, pct };
});

function fmt(n){ if(n> 1024*1024) return (n/1024/1024).toFixed(2)+' MB'; if(n>1024) return (n/1024).toFixed(1)+' kB'; return n+' B'; }

let md = `# Build Size Diff\n\nBaseline: ${basename(aPath)}\nComparando: ${basename(bPath)}\nGerado: ${new Date().toISOString()}\n\n`;
md += `Total Shared JS: ${fmt(a.totalSharedJs)} -> ${fmt(b.totalSharedJs)} (diff ${(b.totalSharedJs - a.totalSharedJs)>0?'+':''}${fmt(b.totalSharedJs - a.totalSharedJs)})\n`;
md += `Total App JS: ${fmt(a.totalAppJs)} -> ${fmt(b.totalAppJs)} (diff ${(b.totalAppJs - a.totalAppJs)>0?'+':''}${fmt(b.totalAppJs - a.totalAppJs)})\n\n`;
md += `| Rota | Antes | Depois | Diferença | % |\n|------|-------|--------|----------|----|\n`;
for(const r of rows){
  md += `| ${r.route} | ${fmt(r.oldBytes)} | ${fmt(r.newBytes)} | ${(r.diff>0?'+':'')+fmt(r.diff)} | ${r.pct} |\n`;
}

const outJson = resolve(root,'reports','build-stats-diff.json');
const outMd = resolve(root,'reports','build-stats-diff.md');
writeFileSync(outJson, JSON.stringify({ baseline:aPath, compare:bPath, rows }, null,2));
writeFileSync(outMd, md);
console.log('Wrote diff JSON:', outJson);
console.log('Wrote diff Markdown:', outMd);
