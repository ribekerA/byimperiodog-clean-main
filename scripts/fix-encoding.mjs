#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * fix-encoding.mjs
 * Varre arquivos texto e corrige mojibake comum (UTF-8 tratado como ISO-8859-1) como:
 *  - ã -> ã, á -> á, â -> â, ê -> ê, é -> é, ó -> ó, ô -> ô, ú -> ú, ç -> ç, Õ -> Õ etc.
 * Executa em dry-run por padrão mostrando diff inline simples.
 * Uso:
 *   node scripts/fix-encoding.mjs --dry   (default)
 *   node scripts/fix-encoding.mjs --write
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const exts = new Set(['.ts','.tsx','.md','.mdx','.sql','.js','.mjs','.cjs']);
const root = process.cwd();
const argWrite = process.argv.includes('--write');

// Mapeamento de sequências quebradas → correto
const MAP = Object.entries({
  'Alemão':'Alemão',
  'Anão':'Anão',
  'excelência':'excelência',
  'responsável':'responsável',
  'pós-venda':'pós-venda',
  'disponíveis':'disponíveis',
  'á':'á','â':'â','ã':'ã','ê':'ê','é':'é','ó':'ó','ô':'ô','ú':'ú','ç':'ç',
  'É':'É','Õ':'Õ','Ó':'Ó','Ú':'Ú','Ç':'Ç'
});

/** Recursivamente lista arquivos */
function walk(dir){
  return readdirSync(dir,{withFileTypes:true}).flatMap(d=>{
    if(d.name.startsWith('.')||d.name==='node_modules'||d.name==='coverage'||d.name==='playwright-report') return [];
    const full = join(dir,d.name);
    if(d.isDirectory()) return walk(full);
    const ext = d.name.slice(d.name.lastIndexOf('.'));
    if(!exts.has(ext)) return [];
    return [full];
  });
}

const files = walk(root);
let totalFiles = 0, totalRepls = 0;

for(const file of files){
  const original = readFileSync(file,'utf8');
  let changed = original;
  let fileRepls = 0;
  for(const [bad,good] of MAP){
    if(changed.includes(bad)){
      const before = changed;
      changed = changed.split(bad).join(good);
      const diffCount = (before.length - changed.length + (bad.length - good.length))/ (bad.length - good.length || 1);
      fileRepls += diffCount > 0 ? diffCount : 1; // aproximação simples
    }
  }
  if(fileRepls){
    totalFiles++; totalRepls += fileRepls;
    if(argWrite){
      writeFileSync(file, changed, 'utf8');
      console.log(`[fix] ${file} (${fileRepls} ocorrências)`);
    } else {
      console.log(`[dry] ${file} -> ${fileRepls} ocorrências para corrigir`);
    }
  }
}

console.log(`\nResumo: ${totalRepls} ocorrências em ${totalFiles} arquivos. Modo: ${argWrite?'write':'dry-run'}`);
if(!argWrite){
  console.log('Execute novamente com --write para aplicar.');
}
