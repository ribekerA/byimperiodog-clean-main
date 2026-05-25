#!/usr/bin/env node
/*
  scripts/a11y-contrast.mjs
  - Varre rotas do Next (ex.: app/.../page.tsx) e tenta renderizar via Playwright (BASE_URL ou http://localhost:3000)
  - Executa axe-core na página e coleta violações de contraste
  - Gera relatório Markdown + um patch .diff propondo ajustes APENAS em tokens neutros: --surface, --surface-2, --border, --text-muted
  - NÃO altera brand/accent
*/

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = process.cwd();
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const reportsDir = path.join(root, 'reports');
const reportMdPath = path.join(reportsDir, 'a11y-contrast.md');
const patchPath = path.join(reportsDir, 'a11y-contrast.diff');
const globalsCssPath = path.join(root, 'app', 'globals.css');

async function safeImport(mod) {
  try { return await import(mod); } catch { return null; }
}

function listRoutes() {
  if (process.env.FULL_A11Y === '1') {
    const appDir = path.join(root, 'app');
  const routes = [];
  function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/page\.(tsx?|jsx?)$/i.test(entry.name)) {
          const rel = path.relative(appDir, path.dirname(full)).replace(/\\/g, '/');
          const parts = rel.split('/').filter(Boolean).filter(p => !p.startsWith('(') || p.includes('site'));
          if (!parts.length) routes.push('/'); else {
            const segs = parts.map(p => (p.startsWith('[') && p.endsWith(']')) ? 'test' : p);
            routes.push('/' + segs.join('/'));
          }
        }
      }
    }
    if (fs.existsSync(appDir)) walk(appDir);
    return [...new Set(routes)];
  }
  return ['/', '/sobre', '/contato', '/filhote/test', '/admin'];
}


async function run() {
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const routes = listRoutes();

  const playwright = await safeImport('playwright');
  const axe = await safeImport('axe-core');

  const results = [];
  if (playwright && axe) {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext();
    // helper retry
    async function gotoWithRetry(page, url, attempts=10){
      let lastErr;
      for(let i=0;i<attempts;i++){
        try {
          await page.goto(url, { waitUntil: 'load', timeout: 20000 });
          return;
        } catch(e){
          lastErr = e;
          if(/ERR_CONNECTION_REFUSED|ECONNREFUSED/.test(String(e.message||e))){
            await new Promise(r=> setTimeout(r, 1200));
            continue;
          } else throw e;
        }
      }
      throw lastErr;
    }
    for (const route of routes) {
      const page = await context.newPage();
      const urlToVisit = baseUrl.replace(/\/$/, '') + route;
      try {
        await gotoWithRetry(page, urlToVisit);
        // Injetar axe e executar somente regra de contraste
        const axePath = path.join(root, 'node_modules', 'axe-core', 'axe.min.js');
        if (fs.existsSync(axePath)) {
          await page.addScriptTag({ path: axePath });
        } else if (axe && axe.source) {
          await page.addScriptTag({ content: axe.source });
        } else {
          throw new Error('axe-core não encontrado (instale axe-core)');
        }
        const report = await page.evaluate(async () => {
          function parseColor(str){
            if(!str) return null;
            const ctx=document.createElement('canvas').getContext('2d');
            ctx.fillStyle = str; // let browser parse
            return ctx.fillStyle; // standardized rgb(a)
          }
            function toRGB(str){
              const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(str||'');
              if(!m) return null; return { r:+m[1], g:+m[2], b:+m[3] };
            }
            function relLum(c){
              const srgb=[c.r,c.g,c.b].map(v=>{v/=255;return v<=0.03928? v/12.92: Math.pow((v+0.055)/1.055,2.4);});
              return 0.2126*srgb[0]+0.7152*srgb[1]+0.0722*srgb[2];
            }
            function contrast(c1,c2){
              if(!c1||!c2) return null; const L1=relLum(c1); const L2=relLum(c2); const lighter=Math.max(L1,L2); const darker=Math.min(L1,L2); return (lighter+0.05)/(darker+0.05);
            }
            function effectiveBg(el){
              let e=el; while(e && e!==document.documentElement){
                const cs=getComputedStyle(e);
                const bgc=cs.backgroundColor; if(bgc && cs.backgroundImage==='none' && /rgba?\(/.test(bgc) && !/rgba\(0,0,0,0\)/.test(bgc)) return bgc;
                e=e.parentElement;
              }
              return getComputedStyle(document.documentElement).backgroundColor || 'rgb(255,255,255)';
            }
          const axeResult = await window.axe.run(document, { runOnly: ['color-contrast'] });
          // Enrich nodes with computed contrast
          for(const v of axeResult.violations || []){
            if(v.id !== 'color-contrast') continue;
            for(const n of v.nodes){
              try {
                const firstTarget = Array.isArray(n.target)? n.target[0]: n.target;
                const el = document.querySelector(firstTarget);
                if(!el) continue;
                const cs=getComputedStyle(el);
                const fgRaw=cs.color; const bgRaw=effectiveBg(el);
                const fg=toRGB(parseColor(fgRaw)); const bg=toRGB(parseColor(bgRaw));
                n._contrastMeta={ fg: fgRaw, bg: bgRaw, ratio: contrast(fg,bg)};
              } catch(_) { /* ignore */ }
            }
          }
          return axeResult;
        });
        const violations = (report.violations || []).map(v => ({
          id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl,
          nodes: v.nodes.map(n => ({
            target: n.target,
            html: n.html,
            failureSummary: n.failureSummary,
            contrast: n._contrastMeta?.ratio || null,
            fg: n._contrastMeta?.fg || null,
            bg: n._contrastMeta?.bg || null,
          })),
        }));
        results.push({ route, violations });
      } catch (e) {
        results.push({ route, error: String(e && e.message || e) });
      } finally {
        await page.close();
      }
    }
    await context.close();
    await browser.close();
  } else {
    results.push({ route: '(skipped)', error: 'Playwright/Axe não encontrados. Instale playwright e axe-core para varredura real.' });
  }

  // Determinar necessidade de ajuste em tokens neutros
  const needFix = { surface: false, surface2: false, border: false, textMuted: false };
  for (const r of results) {
    if (!r.violations) continue;
    for (const v of r.violations) {
      if (v.id !== 'color-contrast') continue;
      // Heurística: se o HTML sugere uso de var(--surface), var(--surface-2), var(--border) ou var(--text-muted)
      const joined = v.nodes.map(n => (n.html || '') + ' ' + (n.failureSummary || '')).join(' ');
      if (/var\(--surface\)/i.test(joined)) needFix.surface = true;
      if (/var\(--surface-2\)/i.test(joined)) needFix.surface2 = true;
      if (/var\(--border\)/i.test(joined)) needFix.border = true;
      if (/var\(--text-muted\)/i.test(joined)) needFix.textMuted = true;
    }
  }

  // Ler globals.css para compor patch propositivo (sem aplicar automaticamente)
  let globalsCss = fs.existsSync(globalsCssPath) ? fs.readFileSync(globalsCssPath, 'utf8') : '';
  const hasRoot = /:root\s*\{[\s\S]*?\}/m.test(globalsCss);
  const hasDark = /\.dark\s*\{[\s\S]*?\}/m.test(globalsCss);

  // Criar alterações sugeridas: adicionar/ajustar tokens neutros no :root e .dark
  function ensureToken(block, token, valueLine) {
    if (new RegExp(`--${token}[^:]*:`).test(block)) return block; // já existe
    const insertAt = block.lastIndexOf('}');
    return block.slice(0, insertAt) + `  ${valueLine}\n` + block.slice(insertAt);
  }

  let newGlobals = globalsCss;
  if (hasRoot) {
    newGlobals = newGlobals.replace(/:root\s*\{([\s\S]*?)\}/m, (m, body) => {
      let b = m;
      // Sugerir valores seguros com base nos tokens já existentes
      // Usar HSL componentes como em outros tokens
      if (needFix.surface || !/--surface\s*:/.test(body)) {
        b = b.replace('}', `  --surface: 0 0% 100%; /* bg base */\n}`);
      }
      if (needFix.surface2 || !/--surface-2\s*:/.test(body)) {
        b = b.replace('}', `  --surface-2: 240 4.8% 95.9%; /* leve contraste com bg */\n}`);
      }
      if (needFix.border || !/--border\s*:/.test(body)) {
        // se já existe --border, mantemos; caso contrário define 
        if (!/--border\s*:/.test(body)) b = b.replace('}', `  --border: 240 5.9% 90%;\n}`);
      }
      if (needFix.textMuted || !/--text-muted\s*:/.test(body)) {
        b = b.replace('}', `  --text-muted: 240 3.8% 46.1%; /* texto secundário */\n}`);
      }
      return b;
    });
  }
  if (hasDark) {
    newGlobals = newGlobals.replace(/\.dark\s*\{([\s\S]*?)\}/m, (m, body) => {
      let b = m;
      if (needFix.surface || !/--surface\s*:/.test(body)) {
        b = b.replace('}', `  --surface: 240 10% 6.5%;\n}`);
      }
      if (needFix.surface2 || !/--surface-2\s*:/.test(body)) {
        b = b.replace('}', `  --surface-2: 240 10% 8.5%;\n}`);
      }
      if (needFix.textMuted || !/--text-muted\s*:/.test(body)) {
        b = b.replace('}', `  --text-muted: 0 0% 63%;\n}`);
      }
      return b;
    });
  }

  // Se nenhum bloco foi encontrado, incluir blocos mínimos
  if (!hasRoot) {
    newGlobals = `:root{\n  --surface: 0 0% 100%;\n  --surface-2: 240 4.8% 95.9%;\n  --border: 240 5.9% 90%;\n  --text-muted: 240 3.8% 46.1%;\n}\n\n` + newGlobals;
  }
  if (!hasDark) {
    newGlobals += `\n.dark{\n  --surface: 240 10% 6.5%;\n  --surface-2: 240 10% 8.5%;\n  --text-muted: 0 0% 63%;\n}\n`;
  }

  // Gerar patch unificado
  function createUnifiedDiff(oldStr, newStr, filePath) {
    if (oldStr === newStr) return '';
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    // Dif simples: arquivo inteiro como um bloco
    const header = [
      `--- a/${path.relative(root, filePath).replace(/\\/g, '/')}`,
      `+++ b/${path.relative(root, filePath).replace(/\\/g, '/')}`,
    ];
    const body = ['@@', ...newLines.map(l => '+' + l)];
    // Mostrar remoções também (para simplicidade, exibimos somente novas linhas; ferramenta humana pode aplicar manualmente)
    return header.join('\n') + '\n' + body.join('\n') + '\n';
  }

  const diff = createUnifiedDiff(globalsCss, newGlobals, globalsCssPath);

  // Escrever relatório
  const md = [];
  md.push('# A11y Contrast Report');
  md.push('');
  md.push(`Base URL: ${baseUrl}`);
  md.push('');
  for (const r of results) {
    if (r.error) { md.push(`- ${r.route}: ERROR ${r.error}`); continue; }
    const fails = (r.violations || []).reduce((acc, v) => acc + v.nodes.length, 0);
    md.push(`- ${r.route}: ${fails} falhas de contraste`);
    for (const v of (r.violations || [])) {
      md.push(`  - Regra: ${v.id} (${v.impact}) — ${v.help}`);
      for (const n of v.nodes.slice(0, 5)) {
        md.push(`    - alvo: ${Array.isArray(n.target)? n.target.join(' '): n.target}`);
      }
    }
  }
  md.push('');
  md.push('## Fixes propostos (tokens neutros)');
  md.push('- Ajustes sugeridos em app/globals.css para tokens: --surface, --surface-2, --border, --text-muted');
  if (!diff) md.push('- Sem alterações sugeridas (tokens já presentes)');

  fs.writeFileSync(reportMdPath, md.join('\n'), 'utf8');
  fs.writeFileSync(patchPath, diff || '# Sem diferenças\n', 'utf8');

  // Saída
  console.log(`Relatório: ${path.relative(root, reportMdPath)}`);
  console.log(`Patch:     ${path.relative(root, patchPath)}`);
}

run().catch(err => { console.error(err); process.exit(1); });
