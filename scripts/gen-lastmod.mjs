// PATH: scripts/gen-lastmod.mjs
//
// Gera src/lib/_generated-lastmod.ts: a data da ULTIMA ALTERACAO REAL de cada
// rota estatica, lida do historico do git.
//
// Por que isso existe
// -------------------
// app/sitemap.ts declarava `lastModified: new Date().toISOString()` para todas
// as paginas estaticas. Resultado medido em /sitemap.xml: 60+ URLs com o MESMO
// <lastmod>, igual ao timestamp do build. Cada deploy — mesmo um deploy que so
// mudou CSS — dizia ao Google que o site inteiro tinha sido reescrito.
//
// Isso nao e um detalhe cosmetico. O Google usa lastmod como sinal de prioridade
// de recrawl e, quando o valor nao bate com o que ele ve na pagina, passa a
// ignorar o campo do site inteiro. Perde-se justamente o sinal que faz uma
// pagina realmente atualizada ser revisitada rapido.
//
// O que conta como "alteracao real"
// ---------------------------------
// A data do ultimo commit que tocou o arquivo da rota, mais os arquivos de
// CONTEUDO que ela importa (content/*, src/domain/*, src/components/sections/*).
// Uma mudanca em <Button> nao mexe na data; uma mudanca no texto da secao mexe.
//
// Por que arquivo gerado e commitado, e nao calculo em tempo de build
// -------------------------------------------------------------------
// 1. O build da Netlify pode rodar sobre um clone raso, onde `git log` de um
//    arquivo antigo volta vazio. O arquivo commitado sempre tem a resposta.
// 2. O merge abaixo NUNCA apaga entrada existente: se o git nao souber
//    responder, mantem-se o que ja estava. O pior caso e uma data velha demais
//    (o Google so recrawleia mais devagar), nunca uma data falsamente recente
//    (que e o que queima o sinal).
//
// Uso: npm run gen:lastmod
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src", "lib", "_generated-lastmod.ts");
const PUBLIC_DIR = path.join(ROOT, "app", "(public)");

/** Pastas cujo conteudo, se mudar, muda a pagina de verdade. */
const PASTAS_DE_CONTEUDO = [
  path.join(ROOT, "content"),
  path.join(ROOT, "src", "domain"),
  path.join(ROOT, "src", "components", "sections"),
];

/** @/x/y -> caminho real, seguindo os paths do tsconfig. */
const ALIAS = [
  ["@/components/", "src/components/"],
  ["@/lib/", "src/lib/"],
  ["@/domain/", "src/domain/"],
  ["@/domain", "src/domain"],
  ["@/content/", "content/"],
];

function resolveAlias(spec) {
  for (const [de, para] of ALIAS) {
    if (spec === de.replace(/\/$/, "") || spec.startsWith(de)) {
      return path.join(ROOT, spec.replace(de.replace(/\/$/, ""), para.replace(/\/$/, "")));
    }
  }
  return null;
}

function existeComExtensao(base) {
  for (const ext of [".ts", ".tsx", ".mdx", "/index.ts", "/index.tsx"]) {
    const p = base + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  return null;
}

/** Arquivos de conteudo importados diretamente pela pagina (um nivel). */
function dependenciasDeConteudo(arquivoDaPagina) {
  const src = fs.readFileSync(arquivoDaPagina, "utf8");
  const deps = new Set();
  for (const m of src.matchAll(/from\s+["']([^"']+)["']/g)) {
    const alvo = resolveAlias(m[1]);
    if (!alvo) continue;
    const arquivo = existeComExtensao(alvo);
    if (!arquivo) continue;
    if (!PASTAS_DE_CONTEUDO.some((dir) => arquivo.startsWith(dir + path.sep))) continue;
    deps.add(arquivo);
  }
  return [...deps];
}

function ultimoCommitISO(arquivos) {
  const rel = arquivos
    .filter((f) => fs.existsSync(f))
    .map((f) => path.relative(ROOT, f).split(path.sep).join("/"));
  if (!rel.length) return null;
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...rel], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!out) return null;
    const d = new Date(out);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null; // git ausente ou clone raso — mantem o que ja estava
  }
}

/** Percorre app/(public) e devolve { rota: arquivoDaPagina } das rotas estaticas. */
function rotasEstaticas() {
  const mapa = {};
  (function anda(dir) {
    for (const nome of fs.readdirSync(dir)) {
      const full = path.join(dir, nome);
      if (fs.statSync(full).isDirectory()) {
        if (nome.startsWith("[")) continue; // rota dinamica: data vem do proprio item
        anda(full);
      } else if (nome === "page.tsx") {
        const rel = path.relative(PUBLIC_DIR, dir).split(path.sep).filter(Boolean).join("/");
        mapa["/" + rel] = full;
      }
    }
  })(PUBLIC_DIR);
  return mapa;
}

// ─── Dependencias extras que o parser de import nao alcanca ──────────────────
// O catalogo de filhotes (disponibilidade, preco, fotos) e o que muda nessas
// paginas, e ele vive em content/puppies-static.ts, importado por componentes
// e nao pela pagina.
const EXTRAS = {
  "/filhotes": ["content/puppies-static.ts"],
  "/filhotes/sao-paulo": ["content/puppies-static.ts"],
  "/filhotes/minas-gerais": ["content/puppies-static.ts"],
  "/filhotes/rio-de-janeiro": ["content/puppies-static.ts"],
  "/galeria": ["content/puppies-static.ts"],
  "/ninhadas": ["content/puppies-static.ts"],
  "/": ["content/puppies-static.ts"],
};

// Chaves sinteticas: rotas dinamicas de catalogo, que nao tem frontmatter para
// carregar data propria. Mudam quando o catalogo muda.
const SINTETICAS = {
  "@puppy": ["content/puppies-static.ts", "app/(public)/filhotes/[slug]/page.tsx"],
  "@color": ["content/puppies-static.ts", "app/(public)/filhotes/cor/[cor]/page.tsx"],
  "@sex": ["content/puppies-static.ts", "app/(public)/filhotes/sexo/[sexo]/page.tsx"],
};

const anterior = (() => {
  if (!fs.existsSync(OUT)) return {};
  const txt = fs.readFileSync(OUT, "utf8");
  const m = txt.match(/LASTMOD[^=]*=\s*(\{[\s\S]*?\}) as const;/);
  if (!m) return {};
  try {
    return JSON.parse(m[1].replace(/,(\s*\})/g, "$1"));
  } catch {
    return {};
  }
})();

const mapa = { ...anterior };
let atualizadas = 0;
let mantidas = 0;

for (const [rota, arquivo] of Object.entries(rotasEstaticas())) {
  const deps = [arquivo, ...dependenciasDeConteudo(arquivo)];
  for (const extra of EXTRAS[rota] || []) deps.push(path.join(ROOT, extra));
  const iso = ultimoCommitISO(deps);
  if (iso) {
    if (mapa[rota] !== iso) atualizadas++;
    mapa[rota] = iso;
  } else if (mapa[rota]) {
    mantidas++;
  }
}

for (const [chave, arquivos] of Object.entries(SINTETICAS)) {
  const iso = ultimoCommitISO(arquivos.map((f) => path.join(ROOT, f)));
  if (iso) {
    if (mapa[chave] !== iso) atualizadas++;
    mapa[chave] = iso;
  } else if (mapa[chave]) {
    mantidas++;
  }
}

const chaves = Object.keys(mapa).sort();
const corpo = chaves.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(mapa[k])},`).join("\n");

const arquivo = `// AUTO-GERADO por scripts/gen-lastmod.mjs — NAO EDITAR A MAO.
// Rode \`npm run gen:lastmod\` depois de alterar conteudo de pagina.
//
// Data do ultimo commit que mexeu em cada rota (arquivo da pagina + os arquivos
// de conteudo que ela importa). E o que alimenta <lastmod> no sitemap, no lugar
// do timestamp do build, que dizia ao Google que o site inteiro mudava a cada
// deploy. Chaves iniciadas por @ sao grupos dinamicos do catalogo.
export const LASTMOD: Record<string, string> = {
${corpo}
} as const;

/**
 * Data de alteracao real da rota, ou undefined quando nao ha registro.
 * Devolver undefined e proposital: <lastmod> e opcional no protocolo de sitemap,
 * e omitir e melhor do que declarar uma data inventada.
 */
export function lastmodFor(rota: string): string | undefined {
  return LASTMOD[rota];
}

/** Maior data do conjunto — usada no lastmod do indice de sitemaps. */
export function maxLastmod(datas: Array<string | undefined>): string | undefined {
  let maior: string | undefined;
  for (const d of datas) {
    if (!d) continue;
    if (!maior || d > maior) maior = d;
  }
  return maior;
}
`;

fs.writeFileSync(OUT, arquivo, "utf8");
console.log(
  `_generated-lastmod.ts: ${chaves.length} rotas (${atualizadas} atualizadas, ${mantidas} mantidas por falta de git)`
);
