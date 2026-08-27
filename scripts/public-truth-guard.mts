#!/usr/bin/env tsx
/**
 * public-truth-guard — confere o repositório inteiro contra a matriz de verdade
 * pública (src/domain/public-truth.ts) e derruba o build quando um texto novo
 * promete o que o canil não confirmou.
 *
 * Por que existe
 * -------------
 * As correções de conteúdo eram todas manuais. Cada rodada tirava "laudo dos
 * pais" de um arquivo, e a rodada seguinte encontrava a mesma frase em outro.
 * Corrigir sem guarda é limpar a mesa antes do jantar: o texto volta pelo
 * próximo artigo, pelo próximo card, pelo próximo template de WhatsApp.
 *
 * O buraco que este script fecha
 * ------------------------------
 * scripts/content-guard.mjs pula `/^src\//` inteiro. Ou seja: as seções da
 * home, os textos de COLOR_SEO, os templates do agente de WhatsApp — tudo o que
 * o visitante lê e que não mora em app/ — nunca passou por verificação nenhuma.
 * Três das quatro violações corrigidas nesta rodada estavam justamente lá.
 *
 * O que ele NÃO faz
 * -----------------
 * Não proíbe palavra. A regra de escopo `primeira-pessoa` só dispara quando a
 * mesma frase também diz que somos nós, então um artigo pode explicar o que é
 * luxação de patela sem que o build caia. O que não passa é a By Império Dog
 * afirmar que ENTREGA, FAZ ou POSSUI algo fora da lista confirmada.
 *
 * Comentário de código é removido antes da checagem: um comentário que
 * DOCUMENTA a remoção de uma frase não pode ser confundido com a frase de
 * volta — e é assim que este repositório registra o que saiu e por quê.
 *
 * Uso:
 *   tsx scripts/public-truth-guard.mts            # varre o repositório
 *   tsx scripts/public-truth-guard.mts a.tsx b.mdx  # varre só estes arquivos
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { verificarTexto, type Violacao } from "@/domain/public-truth";

const RAIZ = resolve(process.cwd());

const EXTENSOES = /\.(mdx?|tsx?)$/;

/** Só interessa o que vira texto público. */
const PASTAS = /^(app|src|content)\//;

const IGNORADOS: RegExp[] = [
  /^node_modules\//,
  /^\.contentlayer\//,
  /^tests?\//,
  // Espelhos gerados: o original já é varrido, e acusar os dois dobra o relatório.
  /^src\/lib\/_generated-/,
  /^src\/content\/_generated/,
  // A própria matriz. Ela cita as expressões proibidas para poder proibi-las.
  /^src\/domain\/public-truth\.ts$/,
  // Tipos e schemas não carregam prosa.
  /\.d\.ts$/,
];

/**
 * Exceções nominais.
 *
 * Só entram aqui casos em que a expressão é legítima E a regra não tem como
 * saber disso pelo contexto da frase. Cada linha precisa de motivo escrito:
 * uma exceção sem justificativa é um furo com aparência de decisão.
 */
const EXCECOES: { arquivo: RegExp; regra: string; motivo: string }[] = [];

// ---------------------------------------------------------------------------

/** Comentário de código não chega ao visitante — e é onde documentamos remoções. */
function tirarComentarios(fonte: string, arquivo: string): string {
  let texto = fonte;

  if (/\.mdx?$/.test(arquivo)) {
    texto = texto.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ").replace(/<!--[\s\S]*?-->/g, " ");
    return texto;
  }

  // O negative lookbehind de ":" evita comer "https://" dentro de string.
  return texto.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function listarArquivos(): string[] {
  const alvos = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (alvos.length) {
    return alvos.map((a) => relative(RAIZ, resolve(a)).split("\\").join("/"));
  }
  return execSync("git ls-files", { cwd: RAIZ, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function linhaDe(fonte: string, trecho: string): number {
  const agulha = trecho.replace(/\.\.\.$/, "").slice(0, 60);
  const pos = fonte.indexOf(agulha);
  if (pos < 0) return 0;
  return fonte.slice(0, pos).split("\n").length;
}

type Achado = Violacao & { arquivo: string; linha: number };

const arquivos = listarArquivos().filter(
  (f) => EXTENSOES.test(f) && PASTAS.test(f) && !IGNORADOS.some((re) => re.test(f)),
);

const achados: Achado[] = [];
let verificados = 0;

for (const arquivo of arquivos) {
  const caminho = resolve(RAIZ, arquivo);
  if (!existsSync(caminho)) continue;

  const fonte = readFileSync(caminho, "utf8");
  verificados += 1;

  for (const violacao of verificarTexto(tirarComentarios(fonte, arquivo))) {
    const dispensado = EXCECOES.some(
      (e) => e.regra === violacao.regra.id && e.arquivo.test(arquivo),
    );
    if (dispensado) continue;
    achados.push({ ...violacao, arquivo, linha: linhaDe(fonte, violacao.trecho) });
  }
}

// Fail closed: varrer zero arquivo é falha de configuração, não aprovação.
if (verificados === 0) {
  console.error("❌ public-truth-guard: nenhum arquivo verificado. Isso é erro, não aprovação.");
  process.exit(1);
}

if (achados.length === 0) {
  console.log(`✅ Verdade pública aprovada — ${verificados} arquivos verificados.`);
  process.exit(0);
}

console.error(`\n❌ Verdade pública: ${achados.length} afirmação(ões) sem sustentação.\n`);

const porRegra = new Map<string, Achado[]>();
for (const a of achados) {
  const lista = porRegra.get(a.regra.id) ?? [];
  lista.push(a);
  porRegra.set(a.regra.id, lista);
}

for (const [id, lista] of porRegra) {
  const { motivo, alternativa, status } = lista[0].regra;
  console.error(`  [${id}] ${status}`);
  console.error(`  ${motivo}`);
  if (alternativa) console.error(`  Em vez disso: ${alternativa}`);
  for (const a of lista) {
    console.error(`    ${a.arquivo}:${a.linha}`);
    console.error(`      "${a.trecho}"`);
  }
  console.error("");
}

console.error(
  `${verificados} arquivos verificados. Matriz: src/domain/public-truth.ts\n` +
    "Se a afirmação passar a ser verdade, ela entra na matriz com evidência — não no texto sozinha.\n",
);

process.exit(1);
