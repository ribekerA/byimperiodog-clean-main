#!/usr/bin/env node

/**
 * ============================================================================
 * Script: check-banned-words.mjs
 * Objetivo: Verificar palavras banidas no TEXTO QUE O VISITANTE LE
 * Uso: node scripts/check-banned-words.mjs
 * CI: npm run check:banned-words (fail build se encontrar)
 * ============================================================================
 *
 * A versao anterior varria tudo indiscriminadamente e por isso acusava a si
 * mesma: reprovava a lista de termos proibidos dentro do validador, o teste que
 * prova que o validador funciona, o comentario que explica por que o termo foi
 * tirado do schema e o arquivo gerado a partir dos .mdx (relatando cada achado
 * duas vezes). Resultado: 39 "violacoes" das quais a maioria era a propria
 * ferramenta, o workflow ficava vermelho em todo commit e ninguem mais lia o
 * relatorio -- uma checagem que sempre falha nao informa nada.
 *
 * O criterio agora e um so: a regra existe para o texto que chega ao visitante.
 * Comentario de codigo, definicao da regra e artefato gerado nao chegam.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, sep } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = join(__dirname, "..");

// ============================================================================
// Palavras Banidas (case-insensitive)
// ============================================================================

const BANNED_WORDS = [
  // Conformidade LGPD & Legal
  "adoção",
  "adocao",
  "doação",
  "doacao",
  "doar",
  "adotar",

  // Brand Guidelines
  "boutique",
  "pet shop",
  "petshop",
  "loja de animais",
];

// ============================================================================
// Padrões de Arquivos para Verificar
// ============================================================================

const PATTERNS_TO_CHECK = [
  // Conteúdo
  /\.mdx?$/i,
  /\.txt$/i,

  // Componentes e Páginas (evitar hardcoded copy)
  /\.tsx?$/i,

  // Configurações que podem ter copy
  /\.json$/i,
];

const PATTERNS_TO_IGNORE = [
  /node_modules/,
  /\.next/,
  /\.git/,
  // Configuracao local do Claude Code: guarda comandos de shell ja autorizados
  // como texto. Nao e conteudo do site.
  /\.claude/,
  /dist/,
  /build/,
  /coverage/,
  // Relatorios de ferramentas repetem mensagens e trechos do codigo-fonte;
  // nao sao conteudo entregue ao visitante.
  /reports/,
  /playwright-report/,
  /test-results/,
  /.contentlayer/,
  /public\/clientes/,
  /sql/,
  /scripts/,
  /docs/,
  /README/i,
];

// Arquivos cuja funcao E carregar os termos banidos como DADO. Sao a regra, nao
// uma violacao dela: varre-los faz a checagem se autoacusar e nunca passar.
const DEFINEM_A_REGRA = new Set(
  [
    "src/lib/ai/catalog-seo.ts", // const BLACKLIST = [...]
    "src/lib/db/schemas/blog.ts", // bannedPattern + mensagem de erro
    "tests/unit/content-guard.test.ts", // teste que prova o validador
  ].map((p) => p.split("/").join(sep))
);

// Gerado por scripts/gen-contentlayer.mjs a partir de content/posts/*.mdx.
// Reportar aqui duplicaria cada achado de conteudo; a correcao e sempre no .mdx.
const GERADOS = new Set(["src/lib/_generated-posts.ts".split("/").join(sep)]);

// ============================================================================
// Funções Auxiliares
// ============================================================================

function shouldCheckFile(filePath) {
  const relativePath = relative(rootDir, filePath);

  if (DEFINEM_A_REGRA.has(relativePath) || GERADOS.has(relativePath)) {
    return false;
  }

  // Ignorar caminhos específicos
  if (PATTERNS_TO_IGNORE.some((pattern) => pattern.test(relativePath))) {
    return false;
  }

  // Verificar apenas padrões específicos
  return PATTERNS_TO_CHECK.some((pattern) => pattern.test(filePath));
}

function* walkDir(dir) {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Pular diretórios ignorados
      if (PATTERNS_TO_IGNORE.some((pattern) => pattern.test(filePath))) {
        continue;
      }
      yield* walkDir(filePath);
    } else if (shouldCheckFile(filePath)) {
      yield filePath;
    }
  }
}

/**
 * Troca comentarios de codigo por espacos, preservando as quebras de linha para
 * a numeracao continuar batendo com o arquivo real.
 *
 * Comentario nunca chega ao visitante: documentacao interna nao e copy do
 * site. Acusar esse texto so ensina o time a ignorar o relatorio.
 *
 * A varredura acompanha strings e escapes para nao confundir o "//" de
 * "https://..." nem o "\/" de uma expressao regular com inicio de comentario.
 */
function stripComments(src) {
  let out = "";
  let i = 0;

  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];

    if (c === "/" && next === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }

    if (c === "/" && next === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") out += "\n"; // mantem a numeracao de linha
        i++;
      }
      i += 2;
      continue;
    }

    if (c === '"' || c === "'" || c === "`") {
      out += c;
      i++;
      while (i < src.length) {
        if (src[i] === "\\") {
          out += src[i] + (src[i + 1] ?? "");
          i += 2;
          continue;
        }
        out += src[i];
        const fim = src[i] === c;
        i++;
        if (fim) break;
      }
      continue;
    }

    // Fora de string, "\" so aparece em regex ("\/"): consome o par para o "/"
    // escapado nao ser lido como abertura de comentario.
    if (c === "\\") {
      out += c + (next ?? "");
      i += 2;
      continue;
    }

    out += c;
    i++;
  }

  return out;
}

const EH_CODIGO = /\.(tsx?|jsx?|mjs|cjs)$/i;

function checkFileForBannedWords(filePath) {
  try {
    const original = readFileSync(filePath, "utf-8");
    const content = EH_CODIGO.test(filePath) ? stripComments(original) : original;

    const linhas = content.split("\n");
    const linhasOriginais = original.split("\n");
    const violations = [];

    for (const word of BANNED_WORDS) {
      const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, "gi");

      linhas.forEach((linha, idx) => {
        for (const match of linha.matchAll(regex)) {
          violations.push({
            word,
            line: idx + 1,
            column: match.index + 1,
            // Contexto sai do arquivo real, nao da versao sem comentarios.
            context: (linhasOriginais[idx] ?? "").trim().slice(0, 120),
          });
        }
      });
    }

    return violations;
  } catch {

    console.warn(`⚠️  Não foi possível ler: ${relative(rootDir, filePath)}`);
    return [];
  }
}

// ============================================================================
// Main
// ============================================================================

function main() {
  // eslint-disable-next-line no-console
  console.log("🔍 Verificando palavras banidas...\n");

  let totalViolations = 0;
  const violationsByFile = new Map();

  // Percorrer todos os arquivos
  for (const filePath of walkDir(rootDir)) {
    const violations = checkFileForBannedWords(filePath);

    if (violations.length > 0) {
      violationsByFile.set(filePath, violations);
      totalViolations += violations.length;
    }
  }

  // Relatório
  if (totalViolations === 0) {
    // eslint-disable-next-line no-console
    console.log("✅ Nenhuma palavra banida encontrada!\n");
    process.exit(0);
  }


  console.error(`❌ Encontradas ${totalViolations} violações:\n`);

  for (const [filePath, violations] of violationsByFile.entries()) {
    const relativePath = relative(rootDir, filePath);

    console.error(`\n📄 ${relativePath}`);

    for (const violation of violations) {

      console.error(
        `   Linha ${violation.line}:${violation.column} - "${violation.word}"`
      );

      console.error(`   Contexto: ${violation.context}`);
    }
  }


  console.error("\n");

  console.error("💡 Sugestões:");

  console.error("   - Substitua 'adoção/doação' por 'aquisição responsável'");

  console.error("   - Substitua 'boutique/pet shop' por 'banho e tosa profissional'");

  console.error("   - Evite termos que violem as diretrizes da marca\n");

  process.exit(1);
}

main();
