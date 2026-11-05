/**
 * Auditoria da VITRINE — o contrato evergreen (§55).
 *
 * Divisao de trabalho com `npm run catalog:audit`, que roda antes deste no
 * prebuild e nao e substituido por ele:
 *
 *   catalog:audit   integridade do catalogo como DADO — slug/id repetido, cor
 *                   fora de rota, imagem que nao existe no disco, status fora
 *                   do vocabulario, data sentinela.
 *   showcase:audit  o contrato COMERCIAL da vitrine — preco batendo com a
 *                   tabela unica, foto de um filhote representando um so
 *                   filhote, campo de estoque nao vazando para o publico,
 *                   nenhum selo de status e nenhuma Offer no codigo publico.
 *
 * A pergunta que este script responde: o site continua sendo uma vitrine
 * permanente de fotos reais, ou alguem o transformou de novo num sistema de
 * estoque? Falha critica derruba o build (exit 1); aviso nao.
 *
 * O que ele NAO faz: checar canonical, schema publicado e HTML renderizado.
 * Isso exige o site servido e mora em `npm run seo:audit`, que le as paginas de
 * verdade em vez de adivinhar pelo codigo-fonte.
 *
 * Uso: npm run showcase:audit
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { staticPuppies } from "@/content/puppies-static";
import {
  CORES_DIVULGADAS,
  TABELA_DE_PRECOS,
  formatarPreco,
  precoDoFilhote,
} from "@/domain/pricing";

type Registro = Record<string, unknown>;

const RAIZ = resolve(process.cwd());
const criticas: string[] = [];
const avisos: string[] = [];
const critica = (alvo: string, msg: string) => criticas.push(`${alvo}: ${msg}`);
const aviso = (alvo: string, msg: string) => avisos.push(`${alvo}: ${msg}`);

const puppies = staticPuppies as unknown as Registro[];
const publicado = (p: Registro) => p.divulgar !== false;

if (puppies.length === 0) {
  critica("vitrine", "nenhuma entrada carregada -- auditoria sem evidencia e falha");
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Preco: a tabela e a unica fonte (§8)
// ─────────────────────────────────────────────────────────────────────────────
// O valor que aparece no card, na pagina do filhote e na conversa do WhatsApp
// tem de ser o MESMO que a responsavel decidiu cobrar. Divergir aqui nao e bug
// de tela: e o comprador chegando ao atendimento com outro numero na cabeca.

const SEXO_DA_TABELA: Record<string, "macho" | "femea"> = { male: "macho", female: "femea" };

for (const p of puppies) {
  const slug = String(p.slug ?? p.id ?? "(sem slug)");
  const cor = p.color ? String(p.color).trim().toLowerCase() : "";
  const sexoBruto = p.sex ? String(p.sex).trim().toLowerCase() : "";

  // -- vocabulario de sexo --------------------------------------------------
  if (!sexoBruto) {
    critica(slug, "sem sex -- nao ha linha de preco nem vitrine de sexo para ele");
  } else if (!(sexoBruto in SEXO_DA_TABELA)) {
    critica(slug, `sex "${sexoBruto}" fora do vocabulario (male|female)`);
  }

  if (!publicado(p)) continue;
  if (!cor || !(CORES_DIVULGADAS as readonly string[]).includes(cor)) continue;

  const sexo = SEXO_DA_TABELA[sexoBruto];
  if (!sexo) continue;

  const linha = (TABELA_DE_PRECOS as Record<string, Record<string, number>>)[cor];
  if (!linha) {
    critica(slug, `cor "${cor}" esta publicada e nao tem linha em TABELA_DE_PRECOS`);
    continue;
  }
  const daTabela = linha[sexo];
  if (typeof daTabela !== "number") {
    critica(slug, `cor "${cor}" nao tem preco de ${sexo} na tabela`);
    continue;
  }

  const esperado = precoDoFilhote(cor as (typeof CORES_DIVULGADAS)[number], sexo, slug);

  for (const campo of ["price_cents", "priceCents"] as const) {
    const valor = p[campo];
    if (typeof valor !== "number") continue;
    if (valor !== esperado) {
      critica(
        slug,
        `${campo}=${formatarPreco(valor)} diverge da regra comercial (${formatarPreco(esperado)})`,
      );
    }
  }
}

// -- toda cor divulgada precisa de preco nos dois sexos -----------------------
for (const cor of CORES_DIVULGADAS) {
  const linha = (TABELA_DE_PRECOS as Record<string, Record<string, number>>)[cor];
  if (!linha) {
    critica(cor, "cor divulgada sem linha em TABELA_DE_PRECOS");
    continue;
  }
  for (const sexo of ["macho", "femea"]) {
    if (typeof linha[sexo] !== "number") critica(cor, `sem preco de ${sexo} na tabela`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Midia repetida
// ─────────────────────────────────────────────────────────────────────────────
// A vitrine e referencia visual REAL. Repetir midia entre fichas nem sempre e
// erro, e por isso a regra tem grau:
//
//   mesma midia duas vezes na MESMA ficha       CRITICA  album com furo
//   mesma foto de CAPA em duas fichas           CRITICA  duas paginas prometendo
//                                                        o mesmo animal
//   mesma foto em fichas de CORES DIFERENTES    CRITICA  erro factual: a foto
//                                                        so tem uma cor
//   mesma foto em fichas da MESMA COR           AVISO    ver a nota abaixo
//   mesmo VIDEO em varias fichas                AVISO    video de ambientacao
//                                                        da raca, nao retrato
//
// A nota: sob a arquitetura evergreen a galeria e referencia de cor, sexo e
// pelagem, e fotos antigas de ninhadas passadas seguem no ar de proposito. Uma
// foto preta reaproveitada entre a ficha do macho preto e a da femea preta e
// reaproveitamento legitimo de referencia de cor -- mas enfraquece a promessa
// "e assim que e uma FEMEA preta" e duplica conteudo entre duas paginas
// indexaveis. Reatribuir exigiria saber o sexo do cao naquela foto especifica;
// isso e informacao do canil, nao deducao de script, e inventar aqui seria pior
// que reportar. Por isso: aviso visivel, decisao humana.

type Dono = { slug: string; cor: string; capa: boolean };
const EH_VIDEO = /\.(mp4|mov|webm)$/i;

const donosDaMidia = new Map<string, Dono[]>();
for (const p of puppies) {
  const slug = String(p.slug ?? p.id ?? "?");
  const cor = p.color ? String(p.color).trim().toLowerCase() : "(sem cor)";
  const imagens = Array.isArray(p.images) ? (p.images as unknown[]) : [];
  const vistasNesteFilhote = new Set<string>();
  imagens.forEach((item, indice) => {
    if (typeof item !== "string") return;
    if (vistasNesteFilhote.has(item)) {
      critica(slug, `a midia "${item}" aparece duas vezes na mesma ficha`);
      return;
    }
    vistasNesteFilhote.add(item);
    donosDaMidia.set(item, [...(donosDaMidia.get(item) ?? []), { slug, cor, capa: indice === 0 }]);
  });
}

for (const [midia, donos] of donosDaMidia) {
  if (donos.length < 2) continue;
  const lista = donos.map(d => d.slug).join(", ");

  if (EH_VIDEO.test(midia)) {
    aviso(midia, `mesmo video em ${donos.length} fichas: ${lista}`);
    continue;
  }

  const cores = Array.from(new Set(donos.map(d => d.cor)));
  if (cores.length > 1) {
    critica(midia, `a mesma foto ilustra cores diferentes (${cores.join(" / ")}): ${lista}`);
    continue;
  }

  const capas = donos.filter(d => d.capa).map(d => d.slug);
  if (capas.length > 1) {
    critica(midia, `e a foto de capa de ${capas.length} fichas ao mesmo tempo: ${capas.join(", ")}`);
    continue;
  }

  aviso(midia, `mesma foto em ${donos.length} fichas da cor ${cores[0]}: ${lista}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Campo de estoque vazando para o publico
// ─────────────────────────────────────────────────────────────────────────────
// O catalogo estatico alimenta a pagina publica inteira. Qualquer contador de
// unidades que apareca aqui vira, mais cedo ou mais tarde, um numero na tela.

const CAMPOS_DE_ESTOQUE = [
  "stock",
  "estoque",
  "quantity",
  "quantidade",
  "remaining",
  "restantes",
  "vagas",
  "unidades",
  "inventory",
  "availability",
  "disponibilidade",
  "reserved_count",
  "sold_count",
];

for (const p of puppies) {
  const slug = String(p.slug ?? p.id ?? "?");
  for (const campo of Object.keys(p)) {
    if (CAMPOS_DE_ESTOQUE.includes(campo.toLowerCase())) {
      critica(slug, `campo de estoque "${campo}" no modelo publico da vitrine`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Codigo publico: nem selo de status, nem Offer
// ─────────────────────────────────────────────────────────────────────────────
// Esta parte le o codigo-fonte, nao o catalogo. Ela existe porque as duas
// regressoes mais caras deste projeto foram exatamente essas: um selo
// "Disponivel" carimbado sobre a foto principal, e um `Product` com
// `offers.availability: InStock` numa pagina que continua no ar depois que o
// filhote encontra a familia dele.

/** Comentario nao vai para o HTML. Sem tirar, as proprias notas de remocao
 *  ("removido em 26/08/2026 ... InStock") acusariam o arquivo que as explica. */
const semComentarios = (fonte: string): string =>
  fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const PASTAS = ["app", "src"];
const IGNORAR = [
  /^app[\\/]\(admin\)/,
  /^app[\\/]admin/,
  /^app[\\/]api[\\/]admin/,
  /^src[\\/]app[\\/]admin/,
  /^src[\\/]components[\\/]admin/,
  /^src[\\/]types/,
  /node_modules/,
  /\.next/,
];

/**
 * Arquivos INTERNOS que podem falar de status e de disponibilidade (§3).
 *
 * Cada um esta aqui por um motivo verificado, nao por conveniencia de deixar o
 * portao verde. Quem precisar acrescentar outro: escreva o porque. O criterio e
 * sempre o mesmo -- esse texto de status chega a algum visitante do site?
 */
const INTERNOS_PERMITIDOS = new Set([
  // Vocabulario operacional do painel, ja documentado no proprio arquivo.
  "src/domain/puppy-status.ts",
  // Taxonomia de dominio: rotulos do formulario do admin.
  "src/domain/taxonomies.ts",
  // Definicao do selo. Auditado e quem RENDERIZA, nao quem define.
  "src/components/ui/badge.tsx",
  // Barril de re-export: cita o nome, nao renderiza nada.
  "src/components/ui/index.ts",
  // Controle do formulario de admin (mora fora da pasta admin por historico);
  // unico importador: src/app/admin/puppies/PuppyForm.tsx.
  "src/components/puppies/StatusToggle.tsx",
  // Ranking comercial. Os rotulos ("Reservado", "Estoque antigo") sao texto de
  // gestao; a rota que os servia foi fechada atras do guard de admin em
  // app/api/catalog/ranked/route.ts.
  "src/lib/ai/catalog-ranking.ts",
  // Recomendador de filhote para lead. Unico consumidor:
  // app/api/admin/leads/recommend/route.ts.
  "src/lib/puppyRecommender.ts",
]);

function listarFontes(dir: string, saida: string[] = []): string[] {
  let entradas: string[];
  try {
    entradas = readdirSync(dir);
  } catch {
    return saida;
  }
  for (const nome of entradas) {
    const caminho = join(dir, nome);
    const rel = relative(RAIZ, caminho);
    if (IGNORAR.some(p => p.test(rel))) continue;
    let info;
    try {
      info = statSync(caminho);
    } catch {
      continue;
    }
    if (info.isDirectory()) listarFontes(caminho, saida);
    else if (/\.(ts|tsx)$/.test(nome)) saida.push(rel);
  }
  return saida;
}

const fontes = PASTAS.flatMap(p => listarFontes(join(RAIZ, p)));

if (fontes.length === 0) {
  critica("codigo", "nenhum arquivo de app/ ou src/ foi lido -- auditoria sem evidencia");
}

const SELO_DE_STATUS = /["'>]\s*(Dispon[ií]vel|Reservado|Vendido)\s*["'<]/;
const OFERTA = /schema\.org\/(InStock|OutOfStock|LimitedAvailability|SoldOut)/;
const PRODUTO = /["']@type["']\s*:\s*["']Product["']/;

let auditados = 0;
for (const rel of fontes) {
  const normalizado = rel.split("\\").join("/");
  if (INTERNOS_PERMITIDOS.has(normalizado)) continue;
  auditados += 1;

  const bruto = readFileSync(join(RAIZ, rel), "utf8");
  const fonte = semComentarios(bruto);

  if (SELO_DE_STATUS.test(fonte)) {
    const trecho = (fonte.match(SELO_DE_STATUS) ?? [""])[0].trim();
    critica(normalizado, `status de filhote como texto na tela: ${trecho}`);
  }
  if (/\bStatusBadge\b/.test(fonte)) {
    critica(normalizado, "importa StatusBadge -- o selo e de uso interno (admin)");
  }
  if (OFERTA.test(fonte)) {
    critica(normalizado, `declara disponibilidade de estoque: ${(fonte.match(OFERTA) ?? [""])[0]}`);
  }
  if (PRODUTO.test(fonte)) {
    critica(normalizado, "monta um no Product -- pagina de vitrine nao e ficha de produto");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Midia declarada existe mesmo
// ─────────────────────────────────────────────────────────────────────────────
// catalog:audit ja cobre isso para `images`. Aqui fica o que ele nao ve: os
// campos avulsos de video e poster que alguns filhotes carregam.

for (const p of puppies) {
  const slug = String(p.slug ?? p.id ?? "?");
  for (const campo of ["video", "video_url", "videoUrl", "poster", "thumbnail"]) {
    const valor = p[campo];
    if (typeof valor !== "string" || valor.length === 0) continue;
    if (!valor.startsWith("/")) {
      aviso(slug, `${campo}="${valor}" nao e caminho do site`);
      continue;
    }
    if (!existsSync(join(RAIZ, "public", valor.replace(/^\//, "")))) {
      critica(slug, `${campo}="${valor}" nao existe em public/`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Relatorio
// ─────────────────────────────────────────────────────────────────────────────

const publicados = puppies.filter(publicado).length;
console.log(
  `Vitrine: ${puppies.length} entradas (${publicados} publicadas), ` +
    `${donosDaMidia.size} midias, ${auditados} arquivos de codigo auditados ` +
    `(${INTERNOS_PERMITIDOS.size} classificados como internos).`,
);

if (avisos.length) {
  console.log(`\nAvisos (${avisos.length}) -- nao travam o deploy:`);
  for (const a of avisos) console.log(`  - ${a}`);
}

if (criticas.length) {
  console.error(`\nFALHAS CRITICAS (${criticas.length}):`);
  for (const c of criticas) console.error(`  x ${c}`);
  console.error("\nA vitrine nao pode ir ao ar assim.");
  process.exit(1);
}

console.log("\nNenhuma falha critica.");
