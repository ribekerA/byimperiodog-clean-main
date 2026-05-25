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
];

const PUBLIC_APP_ALLOWLIST =
  /^app\/(blog|page\.tsx|sobre|contato|filhotes|faq-do-tutor|politica-de-privacidade|termos-de-uso)/;

const BANNED_TERMS = ["adocao", "doacao", "boutique"];
const BREED_PATTERN = /spitz\s+alem[ãa]o(?:\s+an[ãa]o)?/gi;
const LULU_PATTERN = /lulu\s+da\s+pomer[ãa]nia/gi;
const CERNELHA_PATTERN = /cernelha/gi;

const violations = [];

for (const file of files) {
  if (!EXTENSIONS.test(file)) continue;
  if (SKIP_PATTERNS.some((pattern) => pattern.test(file))) continue;
  if (file.startsWith("app/") && !PUBLIC_APP_ALLOWLIST.test(file)) continue;
  if (!file.startsWith("app/") && !file.startsWith("content/")) continue;

  const absolutePath = resolve(process.cwd(), file);
  
  // Skip if file doesn't exist (e.g., archived folders)
  if (!existsSync(absolutePath)) continue;
  
  const raw = readFileSync(absolutePath, "utf8");
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
