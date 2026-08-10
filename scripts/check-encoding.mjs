#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Procura mojibake (UTF-8 lido como Windows-1252) no codigo fonte.
 * Falha (exit 1) se encontrar.
 *
 * A versao anterior listava 'á','ã','ç','é','ú','ó','ê' -- e ate as palavras
 * corretas 'Alemão' e 'Anão' -- como padroes proibidos. Num site em portugues
 * isso reprova o texto escrito certo: dava 3158 "ocorrencias" e derrubava o
 * workflow em todo commit, o que na pratica desligou a checagem, porque uma
 * verificacao que sempre falha nao informa nada.
 *
 * Mojibake de verdade tem assinatura de bytes. Um caractere UTF-8 de dois bytes
 * comeca em 0xC3 ou 0xC2; lido como Windows-1252 vira 'Ã' ou 'Â' seguido do
 * byte de continuacao (0x80-0xBF), que cai na faixa U+0080-U+00BF ou nos
 * simbolos que a cp1252 coloca ali ('€', '™', aspas curvas). Aspas e travessoes
 * sao de tres bytes e comecam em 0xE2, virando 'â' + o mesmo tipo de sequencia.
 * Por isso a deteccao e sempre por PAR de caracteres.
 *
 * O par importa: 'SÃO PAULO' em caixa alta e portugues correto ('Ã' seguido de
 * 'O', fora da faixa) e nao pode ser acusado, enquanto 'SÃƒO' e corrupcao.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const exts = new Set(['.ts', '.tsx', '.md', '.mdx', '.sql', '.js', '.mjs', '.cjs', '.json', '.css', '.html']);
const root = process.cwd();

// Segundo caractere de um par de mojibake: faixa U+0080-U+00BF mais os simbolos
// que a Windows-1252 mapeia sobre 0x80-0x9F.
const SEGUNDO = '\\u0080-\\u00BF\\u20AC\\u201A\\u0192\\u201E\\u2026\\u2020\\u2021'
  + '\\u02C6\\u2030\\u0160\\u2039\\u0152\\u017D\\u2018\\u2019\\u201C\\u201D'
  + '\\u2022\\u2013\\u2014\\u02DC\\u2122\\u0161\\u203A\\u0153\\u017E\\u0178';

const REGRAS = [
  { re: new RegExp(`[ÃÂ][${SEGUNDO}]`, 'g'), nome: 'acento corrompido (ex.: Ã¡ no lugar de á)' },
  { re: new RegExp(`â[${SEGUNDO}]`, 'g'), nome: 'aspa/travessao corrompido (ex.: â€œ no lugar de “)' },
  { re: /�/g, nome: 'caractere de substituicao (�) — byte que nao pode ser decodificado' },
];

// As proprias ferramentas de encoding carregam sequencias corrompidas como
// DADO -- e a tabela de conserto e a lista de padroes. Varrer elas faria a
// checagem se acusar sozinha e nunca passar.
const IGNORADOS = new Set(['check-encoding.mjs', 'fix-encoding.mjs', 'fix-mojibake.ts']);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    if (d.name.startsWith('.') || ['node_modules', 'coverage', 'playwright-report', 'out'].includes(d.name)) return [];
    const full = join(dir, d.name);
    if (d.isDirectory()) return walk(full);
    if (IGNORADOS.has(d.name)) return [];
    const i = d.name.lastIndexOf('.');
    return i > 0 && exts.has(d.name.slice(i)) ? [full] : [];
  });
}

const achados = [];
for (const file of walk(root)) {
  let txt;
  try {
    txt = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const linhas = txt.split(/\r?\n/);
  for (const { re, nome } of REGRAS) {
    linhas.forEach((linha, i) => {
      const m = linha.match(re);
      if (!m) return;
      achados.push({
        file: relative(root, file),
        linha: i + 1,
        nome,
        // Mostra o trecho para dar para julgar sem abrir o arquivo.
        trecho: linha.trim().slice(0, 120),
        amostra: [...new Set(m)].join(' '),
      });
    });
  }
}

if (achados.length) {
  console.error('\n[encoding-check] Mojibake encontrado:\n');
  for (const a of achados) {
    console.error(`  ${a.file}:${a.linha}  ${a.nome}`);
    console.error(`      encontrado: ${a.amostra}`);
    console.error(`      linha: ${a.trecho}`);
  }
  console.error(`\nTotal: ${achados.length} linha(s). Rode: npm run fix:encoding:dry`);
  process.exit(1);
}

console.log('[encoding-check] OK: nenhum mojibake encontrado.');
