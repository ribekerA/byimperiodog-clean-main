#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Verifica se há padrões de mojibake (UTF-8 mal interpretado) no código fonte.
 * Falha (exit 1) se encontrar.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const exts = new Set(['.ts','.tsx','.md','.mdx','.sql','.js','.mjs','.cjs']);
const root = process.cwd();
const BAD_PATTERNS = [
  'Alemão','Anão','excelên','responsÃ','pós-','disponÃ','á','ã','ç','é','ú','ó','ê'
];

function walk(dir){
  return readdirSync(dir,{withFileTypes:true}).flatMap(d=>{
    if(d.name.startsWith('.')||d.name==='node_modules'||d.name==='coverage'||d.name==='playwright-report'||d.name==='.next') return [];
    const full = join(dir,d.name);
    if(d.isDirectory()) return walk(full);
    const ext = d.name.slice(d.name.lastIndexOf('.'));
    if(!exts.has(ext)) return [];
    return [full];
  });
}

const offenders = [];
for(const file of walk(root)){
  const txt = readFileSync(file,'utf8');
  for(const bad of BAD_PATTERNS){
    if(txt.includes(bad)){
      offenders.push({file,bad});
    }
  }
}

if(offenders.length){
  console.error('\n[encoding-check] Encontradas sequências potencialmente corrompidas:');
  for(const o of offenders){
    console.error(` - ${o.file}: contém '${o.bad}'`);
  }
  console.error(`Total: ${offenders.length} ocorrências. Execute: npm run fix:encoding:dry`);
  process.exit(1);
} else {
  console.log('[encoding-check] OK: nenhum padrão de mojibake encontrado.');
}
