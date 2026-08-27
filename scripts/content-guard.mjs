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

// Mensagem pré-preenchida do WhatsApp não é texto da página: vai para a URL do
// wa.me e só aparece dentro do aplicativo, depois que a pessoa toca no botão.
// Contá-la fazia o guard cobrar apresentação de nomenclatura dentro de uma
// mensagem de WhatsApp — nas rotas /filhotes/cor e /filhotes/sexo ela era a
// única menção à raça no arquivo, porque o texto visível vem de COLOR_SEO e
// SEX_SEO, que moram em src/ e o guard já ignora.
const stripWhatsAppPrefill = (source) => source.replace(/message:\s*`[^`]*`/g, "message: ``");

const BANNED_TERMS = ["adocao", "doacao", "boutique"];
// O frontmatter de um .mdx nao e prosa: `title`, `seo_title` e `description`
// sao campos independentes, exibidos juntos no resultado do Google e nunca
// concatenados em texto corrido. Medir distancia em CARACTERES atraves deles
// mede algo que nao existe em nenhuma saida renderizada. Foi o que aconteceu
// ao acrescentar `seo_title`: a linha nova afastou o titulo da description e o
// guard acusou 12 artigos que trazem o sinonimo na linha de baixo. Dentro do
// bloco vale o bloco inteiro como trecho; no corpo do artigo, que e prosa de
// verdade, a janela de 140 continua valendo.
const frontmatterEnd = (source) => {
  if (!source.startsWith("---\n")) return 0;
  const end = source.indexOf("\n---", 4);
  return end === -1 ? 0 : end + 4;
};

// ---------------------------------------------------------------------------
// Preço publicado x tabela comercial
// ---------------------------------------------------------------------------
// src/domain/pricing.ts virou a fonte única dos números que o site MOSTRA, mas
// prosa não importa constante: um .mdx escreve "R$ 8.500" à mão e ninguém
// percebe quando a tabela muda. Foi assim que a fêmea laranja ficou anunciada
// por R$ 8.500 em três artigos depois de passar para R$ 7.500.
//
// A tabela está repetida aqui de propósito: este script roda no prebuild, antes
// do Next existir, e não resolve o alias "@/". A dupla é conferida pelo teste
// tests/pricing-guard.test.ts, que quebra se as duas divergirem.
const PRECOS_DA_TABELA = new Set([5500, 6500, 7500, 8500, 9500]);

// Faixa em que um número solto é, quase certamente, preço de filhote. Abaixo de
// R$ 5.500 estão custo de manutenção, vacina e consulta; acima de R$ 20.000 não
// existe nada no site. Dentro da faixa, valor fora da tabela é erro — inclusive
// os R$ 10.500 que sobraram da tabela antiga.
//
// O piso desceu de 6.000 para 5.500 junto com a entrada do Particolor: o menor
// valor da tabela precisa CABER na janela, senão o guard deixaria de inspecionar
// justamente o preço novo. tests/pricing-guard.test.ts cobra essa relação.
const FAIXA_DE_PRECO_DE_FILHOTE = { min: 5500, max: 20000 };

// A única exceção real: o total do primeiro ano de manutenção, que o próprio
// texto marca como "sem o filhote". Fica escrito aqui em vez de sair da faixa
// para que, se a frase mudar, alguém releia a frase em vez de o guard calar.
const PRECOS_QUE_NAO_SAO_FILHOTE = new Map([
  ["content/posts/quanto-custa-manter-spitz-alemao.mdx", new Set([6000])],
]);

const PRECO_PATTERN = /R\$\s*(\d{1,3}(?:\.\d{3})+)/g;

// ---------------------------------------------------------------------------
// Cinza-Lobo (Wolf Sable) fora da comunicação
// ---------------------------------------------------------------------------
// A cor deixou de ser divulgada. A regra vale para a prosa: "Cinza-Lobo" e
// "Wolf Sable" escritos por extenso. O slug "wolf-sable" continua liberado
// porque é caminho de imagem, chave de objeto e URL indexada — apagar isso
// quebraria página no ar, decisão de quem responde pelo SEO e não efeito
// colateral de uma mudança de tabela.
const CINZA_LOBO_PATTERN = /cinza[-\s]lobo|wolf\s+sable/gi;

// O artigo dedicado é uma URL indexada e continua no ar até haver decisão
// explícita sobre ela. É o único arquivo em que a cor pode ser escrita.
const CINZA_LOBO_PERMITIDO = new Set([
  "content/posts/spitz-alemao-anao-wolf-sable.mdx",
]);

const BREED_PATTERN = /spitz\s+alem[ãa]o(?:\s+an[ãa]o)?/gi;
const CERNELHA_PATTERN = /cernelha/gi;

const violations = [];

// Quantos arquivos foram REALMENTE lidos. Ver a checagem depois do laco.
let arquivosLidos = 0;

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
  const raw = stripWhatsAppPrefill(
    stripComments(readFileSync(absolutePath, "utf8").replace(/\r\n/g, "\n"))
  );
  arquivosLidos += 1;
  const normalized = normalize(raw);

  for (const term of BANNED_TERMS) {
    if (new RegExp(`\\b${term}\\b`, "i").test(normalized)) {
      violations.push(`${file}: contém termo proibido "${term}".`);
    }
  }

  const fmEnd = frontmatterEnd(raw);
  const fmHasSynonym =
    fmEnd > 0 && /lulu\s+da\s+pomerania/i.test(normalize(raw.slice(0, fmEnd)));

  // A apresentação vale uma vez por arquivo. Exigir o sinônimo colado em cada
  // menção transformava a regra em ordem de repetir a mesma palavra dezenas de
  // vezes na mesma página — que é o oposto do que ela quer garantir. Basta que
  // o texto diga, em algum trecho, que Spitz Alemão Anão e Lulu da Pomerânia
  // são o mesmo cão; da segunda menção em diante o leitor já sabe.
  const mencoesDaRaca = [...raw.matchAll(BREED_PATTERN)];
  if (mencoesDaRaca.length) {
    const apresentaOSinonimo = mencoesDaRaca.some((match) => {
      const index = match.index ?? 0;
      if (index < fmEnd && fmHasSynonym) return true;
      const context = raw.slice(
        Math.max(0, index - 140),
        index + match[0].length + 140
      );
      return /lulu\s+da\s+pomerania/i.test(normalize(context));
    });
    if (!apresentaOSinonimo) {
      violations.push(
        `${file}: cita a raça ${mencoesDaRaca.length}x e nunca apresenta "Lulu da Pomerânia" no mesmo trecho.`
      );
    }
  }

  const precosLiberados = PRECOS_QUE_NAO_SAO_FILHOTE.get(file);
  for (const match of raw.matchAll(PRECO_PATTERN)) {
    const valor = Number(match[1].replace(/\./g, ""));
    if (valor < FAIXA_DE_PRECO_DE_FILHOTE.min || valor > FAIXA_DE_PRECO_DE_FILHOTE.max) continue;
    if (precosLiberados?.has(valor)) continue;
    if (PRECOS_DA_TABELA.has(valor)) continue;
    violations.push(
      `${file}: "${match[0]}" não existe na tabela comercial (${[...PRECOS_DA_TABELA]
        .sort((a, b) => a - b)
        .map((v) => `R$ ${v.toLocaleString("pt-BR")}`)
        .join(" / ")}).`
    );
  }

  if (!CINZA_LOBO_PERMITIDO.has(file)) {
    for (const match of raw.matchAll(CINZA_LOBO_PATTERN)) {
      violations.push(`${file}: "${match[0]}" — a cor não é mais divulgada.`);
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

// Guard que nao abriu arquivo nenhum nao aprovou nada.
//
// Isto ja aconteceu aqui: quando as paginas foram para app/(public)/, o
// PUBLIC_APP_ALLOWLIST parou de casar e o guard passou a varrer so content/,
// imprimindo "aprovado" com 44 paginas publicas sem verificacao alguma. O
// comentario de stripRouteGroups conta a historia; faltava o portao que a
// impede de se repetir.
if (arquivosLidos === 0) {
  console.error(
    [
      "❌ Content guard falhou: nenhum arquivo foi verificado.",
      `   ${files.length} caminho(s) entraram e todos foram filtrados antes da leitura.`,
      "   Isso e defeito do guard (allowlist ou skip pattern fora de sincronia com",
      "   a arvore de arquivos), nao aprovacao do conteudo.",
    ].join("\n")
  );
  process.exit(1);
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

process.stdout.write(`✅ Content guard aprovado — ${arquivosLidos} arquivos verificados.\n`);

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
