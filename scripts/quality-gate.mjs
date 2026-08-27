// PATH: scripts/quality-gate.mjs
//
// Portao de qualidade e de demanda do conteudo (content/posts/*.mdx).
//
// Para que serve
// --------------
// A arquitetura pedida e "engine controlada", nao fabrica de paginas. O que
// separa uma coisa da outra nao e a intencao de quem escreve, e um teste que
// roda sozinho e reprova. Este script e esse teste.
//
// Duas classes de resultado:
//   ERRO   — quebra o build no modo --strict. Sao regras que nao dependem de
//            julgamento: artigo fino, titulo duplicado, sem data, sem link
//            interno, dois artigos disputando a mesma consulta.
//   AVISO  — nao quebra nada. Sao lacunas reais medidas no corpus de hoje
//            (nenhuma imagem no corpo, nenhuma fonte externa citada) que
//            exigem trabalho editorial, nao mudanca de codigo. Viram ERRO em
//            --strict-novos, que so olha arquivo que ainda nao esta no git.
//
// Por que o modo --strict-novos existe
// ------------------------------------
// Os 30 artigos publicados hoje nao declaram demanda de pesquisa nem fonte
// externa. Exigir isso deles seria reprovar o site inteiro de uma vez e
// obrigar a inventar dado — exatamente o que o briefing proibe. Exigir de
// arquivo NOVO custa zero para o que ja existe e impede que a proxima pagina
// nasca sem evidencia.
//
// Uso:
//   node scripts/quality-gate.mjs               relatorio, sempre sai 0
//   node scripts/quality-gate.mjs --strict      erros quebram (exit 1)
//   node scripts/quality-gate.mjs --strict-novos  + exige demanda em arquivo novo
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const POSTS = path.join(ROOT, "content", "posts");

const strict = process.argv.includes("--strict") || process.argv.includes("--strict-novos");
const strictNovos = process.argv.includes("--strict-novos");

// ─── Limiares ────────────────────────────────────────────────────────────────
// PALAVRAS_MIN: o menor artigo do corpus hoje tem 646 palavras. 600 e um piso
// abaixo do que ja existe, entao nao reprova nada agora — ele existe para
// impedir a proxima pagina de 200 palavras, que e como comeca doorway page.
const PALAVRAS_MIN = 600;
const DESC_MIN = 70;
const DESC_MAX = 165;

const arquivos = fs.existsSync(POSTS) ? fs.readdirSync(POSTS).filter((f) => f.endsWith(".mdx")) : [];

function rastreadoPeloGit(rel) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", rel], {
      cwd: ROOT,
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch {
    return false; // arquivo novo, ainda nao commitado
  }
}

function ler(nome) {
  const rel = `content/posts/${nome}`;
  const bruto = fs.readFileSync(path.join(POSTS, nome), "utf8").replace(/\r\n/g, "\n");
  const m = bruto.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fm = m ? m[1] : "";
  const corpo = m ? m[2] : bruto;

  const campo = (k) => {
    const r = new RegExp(`^${k}:\\s*(.+)$`, "m").exec(fm);
    return r ? r[1].trim().replace(/^["']|["']$/g, "") : "";
  };
  const lista = (k) => {
    const r = new RegExp(`^${k}:\\s*\\n((?:\\s+-\\s+.+\\n?)+)`, "m").exec(fm);
    return r ? r[1].split("\n").filter(Boolean).map((l) => l.replace(/^\s*-\s*/, "").trim()) : [];
  };

  // Tira codigo e marcacao antes de contar palavras.
  const texto = corpo
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|-]/g, " ");

  const links = [...corpo.matchAll(/\]\(([^)]+)\)/g)].map((x) => x[1]);

  return {
    nome,
    rel,
    novo: !rastreadoPeloGit(rel),
    slug: nome.replace(/\.mdx$/, ""),
    title: campo("title"),
    seoTitle: campo("seo_title"),
    description: campo("description"),
    date: campo("date"),
    targetQuery: campo("target_query"),
    searchDemandSource: campo("search_demand_source"),
    searchDemandDate: campo("search_demand_date"),
    conversionGoal: campo("conversion_goal"),
    sources: lista("sources"),
    palavras: texto.split(/\s+/).filter((w) => /[a-zà-ú]/i.test(w)).length,
    h2: (corpo.match(/^##\s/gm) || []).length,
    imagens: (corpo.match(/!\[/g) || []).length,
    internos: links.filter((h) => h.startsWith("/")).length,
    externos: links.filter((h) => /^https?:/.test(h)).length,
    comerciais: links.filter((h) =>
      /^\/(filhotes|reserve-seu-filhote|contato|preco-spitz-anao|comprar-spitz-anao)/.test(h)
    ).length,
  };
}

const posts = arquivos.map(ler);
const erros = [];
const avisos = [];

const err = (p, msg) => erros.push(`${p.slug}: ${msg}`);
const avi = (p, msg) => avisos.push(`${p.slug}: ${msg}`);

// ─── Regras por artigo ───────────────────────────────────────────────────────
for (const p of posts) {
  if (!p.title) err(p, "sem `title` no frontmatter");
  if (!p.date) err(p, "sem `date` — sairia no sitemap com o horario do build");
  if (p.palavras < PALAVRAS_MIN) err(p, `conteudo fino: ${p.palavras} palavras (minimo ${PALAVRAS_MIN})`);
  if (p.internos === 0) err(p, "nenhum link interno — artigo e beco sem saida no grafo");

  if (!p.description) err(p, "sem `description`");
  else if (p.description.length < DESC_MIN || p.description.length > DESC_MAX) {
    avi(p, `description com ${p.description.length} caracteres (ideal ${DESC_MIN}-${DESC_MAX})`);
  }

  if (p.h2 < 2) avi(p, `so ${p.h2} subtitulo(s) H2 — dificulta resposta direta e trecho destacado`);
  if (p.imagens === 0) avi(p, "nenhuma imagem no corpo — perde Google Imagens e reduz tempo de leitura");
  if (p.externos === 0 && p.sources.length === 0) {
    avi(p, "nenhuma fonte externa citada — reduz a chance de ser citado por sistema generativo");
  }
  if (p.comerciais === 0) avi(p, "nenhum link para pagina comercial — trafego chega e nao converte");

  // Portao de demanda: so cobra de arquivo novo.
  const exigeDemanda = strictNovos && p.novo;
  const faltaDemanda = !p.searchDemandSource || !p.searchDemandDate;
  if (faltaDemanda) {
    const msg = "sem `search_demand_source` + `search_demand_date` — pagina sem evidencia de demanda";
    if (exigeDemanda) err(p, msg);
    else if (p.novo) avi(p, msg);
  }
  if (p.novo && !p.conversionGoal) {
    const msg = "sem `conversion_goal` — nao esta declarado o que a pagina deve gerar";
    if (exigeDemanda) err(p, msg);
    else avi(p, msg);
  }
}

// ─── Regras de corpus: duplicacao e canibalizacao ────────────────────────────
function duplicados(chave, rotulo) {
  const mapa = new Map();
  for (const p of posts) {
    const v = (p[chave] || "").trim().toLowerCase();
    if (!v) continue;
    if (!mapa.has(v)) mapa.set(v, []);
    mapa.get(v).push(p.slug);
  }
  for (const [v, slugs] of mapa) {
    if (slugs.length > 1) erros.push(`${rotulo} repetido em ${slugs.join(", ")} → "${v.slice(0, 60)}"`);
  }
}
duplicados("title", "title");
duplicados("description", "description");
duplicados("targetQuery", "target_query (canibalizacao direta)");

// ─── Corpus vazio ────────────────────────────────────────────────────────────
// Zero artigo analisado nao e corpus impecavel: e o gate nao tendo lido nada.
// Pasta renomeada, glob quebrado, checkout parcial -- em qualquer um desses
// casos o script imprimia "ERROS: nenhum" e saia 0, aprovando um blog que
// tinha deixado de existir. Reprova em todos os modos, inclusive relatorio.
if (posts.length === 0) {
  console.error(`quality-gate: nenhum artigo encontrado em ${POSTS}.`);
  console.error("Isto e falha do portao, nao aprovacao do conteudo.");
  process.exit(1);
}

// ─── Relatorio ───────────────────────────────────────────────────────────────
console.log(`quality-gate: ${posts.length} artigos analisados (modo ${strictNovos ? "--strict-novos" : strict ? "--strict" : "relatorio"})`);
console.log("");

if (erros.length) {
  console.log(`ERROS (${erros.length}):`);
  for (const e of erros) console.log(`  x ${e}`);
} else {
  console.log("ERROS: nenhum.");
}
console.log("");

if (avisos.length) {
  console.log(`AVISOS (${avisos.length}):`);
  for (const a of avisos) console.log(`  ! ${a}`);
} else {
  console.log("AVISOS: nenhum.");
}

if (strict && erros.length) {
  console.log("\nBuild interrompido pelo quality gate.");
  process.exit(1);
}
