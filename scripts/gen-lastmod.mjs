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

const HISTORICO_COMPLETO = (() => {
  try {
    return execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() !== "true";
  } catch {
    return false;
  }
})();

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

/**
 * Data em que o conteudo mudou de verdade.
 *
 * `%aI` (data do AUTOR) e nao `%cI` (data do COMMITTER) de proposito. As duas
 * nascem iguais e passam a divergir em rebase, amend e cherry-pick: o
 * committer vira "agora", o autor continua sendo quando o texto foi escrito.
 * Com `%cI`, um `git commit --amend` no ultimo commit reescrevia o lastmod de
 * 30 rotas que ninguem tinha tocado -- e lastmod que anda sem conteudo novo e
 * exatamente o sinal que o Google aprende a ignorar.
 */
function ultimoCommitISO(arquivos) {
  if (!HISTORICO_COMPLETO) return null;
  const rel = arquivos
    .filter((f) => fs.existsSync(f))
    .map((f) => path.relative(ROOT, f).split(path.sep).join("/"));
  if (!rel.length) return null;
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%aI", "--", ...rel], {
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

/**
 * Data do commit que CRIOU o arquivo da rota — a primeira vez que a pagina
 * passou a existir neste repositorio.
 *
 * Nao e a mesma pergunta que `ultimoCommitISO`, e por isso olha so o arquivo da
 * pagina: uma revisao no texto muda a data de modificacao, nao a de publicacao.
 *
 * `--follow` existe para que renomear a pasta de uma rota nao "republique" a
 * pagina. Sem ele, mover app/(public)/x para app/(public)/y faria a pagina
 * nascer de novo hoje.
 */
function primeiroCommitISO(arquivo) {
  if (!HISTORICO_COMPLETO) return null;
  if (!fs.existsSync(arquivo)) return null;
  const rel = path.relative(ROOT, arquivo).split(path.sep).join("/");
  try {
    const out = execFileSync(
      "git",
      ["log", "--diff-filter=A", "--follow", "--format=%aI", "--", rel],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    if (!out) return null;
    // A saida vem do commit mais novo para o mais antigo; o que criou e o ultimo.
    const linhas = out.split("\n").filter(Boolean);
    const d = new Date(linhas[linhas.length - 1]);
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

/** Le um mapa ja gerado, para que clone raso nunca apague resposta conhecida. */
function mapaAnterior(nome) {
  if (!fs.existsSync(OUT)) return {};
  const txt = fs.readFileSync(OUT, "utf8");
  const m = txt.match(new RegExp(`${nome}[^=]*=\\s*(\\{[\\s\\S]*?\\}) as const;`));
  if (!m) return {};
  try {
    return JSON.parse(m[1].replace(/,(\s*\})/g, "$1"));
  } catch {
    return {};
  }
}

const mapa = { ...mapaAnterior("LASTMOD") };
const publicacao = { ...mapaAnterior("FIRSTPUB") };
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

  // A data de publicacao so pode ANDAR PARA TRAS. Se o historico ficar mais
  // fundo (clone raso hoje, completo amanha), a data mais antiga e a mais
  // verdadeira; a mais nova seria o artefato do corte do clone.
  const nascimento = primeiroCommitISO(arquivo);
  if (nascimento && (!publicacao[rota] || nascimento < publicacao[rota])) {
    publicacao[rota] = nascimento;
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

const chavesPub = Object.keys(publicacao).sort();
const corpoPub = chavesPub
  .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(publicacao[k])},`)
  .join("\n");

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

// Data do commit que CRIOU o arquivo de cada rota. Substitui os
// \`datePublished: "2025-01-01"\` escritos a mao em onze paginas, que nao tinham
// nenhuma evidencia por tras — nem no git, nem no Internet Archive — e ainda
// ANTECIPAVAM a data, fingindo conteudo mais antigo e estabelecido do que se
// pode provar.
//
// O que esta data afirma, e so isso: a pagina existe neste repositorio desde
// entao. Se o site rodou antes em outro repositorio, a data verdadeira e mais
// antiga e esta aqui subestima — que e o lado seguro de errar.
export const FIRSTPUB: Record<string, string> = {
${corpoPub}
} as const;

/**
 * Data de publicacao da rota, ou undefined quando o git nao sabe responder.
 * Undefined e proposital, pela mesma razao de \`lastmodFor\`: no JSON-LD, omitir
 * \`datePublished\` e melhor do que declarar uma data inventada.
 */
export function firstPubFor(rota: string): string | undefined {
  return FIRSTPUB[rota];
}
`;

fs.writeFileSync(OUT, arquivo, "utf8");
console.log(
  `_generated-lastmod.ts: ${chaves.length} rotas (${atualizadas} atualizadas, ${mantidas} mantidas por falta de git)` +
    `, ${chavesPub.length} datas de publicacao`
);
