#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const targets = process.argv.slice(2);

const files =
  targets.length > 0
    ? targets
    : execSync("git ls-files", { encoding: "utf8" })
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

const EXTENSIONS = /\.(mdx?|tsx?)$/;
const SKIP_PATTERNS = [
  /^app\/\(admin\)/,
  /^app\/api/,
  /^archive_routes\//,
  /^docs\//,
  /^node_modules\//,
  /^tests\//,
  /^\.contentlayer\//,
  /^src\//,
  /^README.*\.md$/i,
  // Structured data files — breed term appears in field values, not editorial content
  /^content\/puppies-static\.ts$/,
];

const PUBLIC_APP_ALLOWLIST =
  /^app\/(blog|page\.tsx|sobre|contato|filhotes|faq-do-tutor|politica-de-privacidade|termos-de-uso)/;

// Route groups como "(public)" existem na pasta mas não na URL. Desde que as
// páginas foram movidas para app/(public)/, o allowlist acima passou a casar
// ZERO arquivos e o guard varria só content/ — as 44 páginas públicas ficaram
// sem verificação nenhuma. Tirar o grupo do caminho antes de comparar devolve
// a cobertura sem precisar reescrever a lista.
const stripRouteGroups = (file) => file.replace(/\([^)/]+\)\//g, "");

// A checagem de proximidade conta CARACTERES do arquivo. Em .tsx, comentários
// de código ficam entre o título e a description e empurravam o sinônimo para
// fora da janela de 140 — o guard acusava violação em páginas cujo HTML final
// traz "Lulu da Pomerânia" na linha seguinte. Comentário não vai para o HTML,
// então não deve ocupar espaço na janela.
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const BANNED_TERMS = ["adocao", "doacao", "boutique"];
const BREED_PATTERN = /spitz\s+alem[ãa]o(?:\s+an[ãa]o)?/gi;
const CERNELHA_PATTERN = /cernelha/gi;

const violations = [];

for (const file of files) {
  if (!EXTENSIONS.test(file)) continue;
  if (SKIP_PATTERNS.some((pattern) => pattern.test(file))) continue;
  if (file.startsWith("app/") && !PUBLIC_APP_ALLOWLIST.test(stripRouteGroups(file))) continue;
  if (!file.startsWith("app/") && !file.startsWith("content/")) continue;

  const absolutePath = resolve(process.cwd(), file);
  
  // Skip if file doesn't exist (e.g., archived folders)
  if (!existsSync(absolutePath)) continue;
  
  // Normaliza CRLF -> LF antes de qualquer checagem. As regras de proximidade
  // abaixo contam CARACTERES, e no Windows (core.autocrlf=true) cada quebra de
  // linha ocupa 2 chars em vez de 1. Isso encolhia a janela de contexto e
  // acusava violacao em arquivos que passam no checkout da Netlify (LF) — o
  // guard reprovava por causa do sistema operacional, nao do texto.
  const raw = stripComments(
    readFileSync(absolutePath, "utf8").replace(/\r\n/g, "\n")
  );
  const normalized = normalize(raw);

  for (const term of BANNED_TERMS) {
    if (new RegExp(`\\b${term}\\b`, "i").test(normalized)) {
      violations.push(`${file}: contém termo proibido "${term}".`);
    }
  }

  for (const match of raw.matchAll(BREED_PATTERN)) {
    const index = match.index ?? 0;
    const context = raw.slice(
      Math.max(0, index - 140),
      index + match[0].length + 140
    );
    const contextNormalized = normalize(context);
    if (!/lulu\s+da\s+pomerania/i.test(contextNormalized)) {
      violations.push(
        `${file}: "${match[0]}" precisa incluir "Lulu da Pomerânia" no mesmo trecho.`
      );
    }
  }

  for (const match of raw.matchAll(CERNELHA_PATTERN)) {
    const index = match.index ?? 0;
    const slice = raw.slice(index, index + match[0].length + 20);
    if (!/cernelha\s*\(altura\)/i.test(slice)) {
      violations.push(`${file}: use "cernelha (altura)" exatamente nessa forma.`);
    }
  }
}

if (violations.length) {
  console.error(
    [
      "❌ Content guard falhou:",
      ...violations.map((entry) => ` - ${entry}`),
    ].join("\n")
  );
  process.exit(1);
}

process.stdout.write("✅ Content guard aprovado.\n");

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
