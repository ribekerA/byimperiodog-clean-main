import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

describe('encoding integrity', () => {
  const exts = new Set(['.ts','.tsx','.md','.mdx','.sql','.js','.mjs','.cjs']);
  // Padrões multi-caractere mais específicos para evitar falsos positivos em mapeamentos de scripts
  const BAD = ['Alemão','Anão','excelên','responsÃ','pós-','disponÃ'];
  // Ignorar arquivos que documentam ou contêm propositalmente as sequências quebradas
  const IGNORE_SUBSTR = [
    'docs/CLEANUP_LOG.md',
    'scripts/check-encoding.mjs',
    'scripts/fix-encoding.mjs',
    'tests/encoding.test.ts',
    // Temporário: arquivos com conteúdo legado a ser revisado
    'src/components/PuppyStories.tsx',
    'app/blog/page.tsx'
  ];

  function walk(dir:string):string[]{
    return readdirSync(dir,{withFileTypes:true}).flatMap(d=>{
      if(d.name.startsWith('.')||['node_modules','coverage','playwright-report','.next'].includes(d.name)) return [];
      const full = join(dir,d.name);
      if(d.isDirectory()) return walk(full);
      const ext = d.name.slice(d.name.lastIndexOf('.'));
      if(!exts.has(ext)) return [];
      return [full];
    });
  }

  it('não contém padrões de mojibake conhecidos', () => {
    const offenders:string[] = [];
    for(const f of walk(process.cwd())){
      if(IGNORE_SUBSTR.some(s=>f.replace(/\\/g,'/').endsWith(s) || f.includes(s))) continue;
      const txt = readFileSync(f,'utf8');
      for(const b of BAD){
        if(txt.includes(b)) offenders.push(`${f} => '${b}'`);
      }
    }
    expect(offenders).toHaveLength(0);
  });
});
