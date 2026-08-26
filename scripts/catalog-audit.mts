/**
 * Auditoria do catalogo de filhotes -- portao de saida, nao relatorio.
 *
 * Por que um script e nao mais um teste de unidade: `tests/pricing-guard.test.ts`
 * ja cobre preco contra a tabela, `tests/unit/media-registry.test.ts` cobre o
 * registro de midia e `tests/unit/consistency-delta.test.ts` cobre Offer so
 * quando disponivel. O que faltava era a checagem que depende do DISCO -- se o
 * arquivo de imagem anunciado no catalogo existe de verdade -- e a que depende
 * do estado comercial: filhote publicado sem foto, cor tirada da comunicacao
 * voltando a vitrine, status digitado fora do vocabulario.
 *
 * A regra de saida e a pedida: FALHA CRITICA => exit 1. Aviso nao derruba o
 * build; ele existe para ser lido antes do deploy, nao para travar publicacao
 * por causa de um campo opcional vazio.
 *
 * Uso: npm run catalog:audit
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { staticPuppies } from "@/content/puppies-static";
import { CORES_DIVULGADAS } from "@/domain/pricing";
import { ALL_COLORS } from "@/lib/catalog-utils";
import { normalizePuppyStatus } from "@/domain/puppy-status";

type Registro = Record<string, unknown>;

const PUBLIC_DIR = join(resolve(process.cwd()), "public");

const criticas: string[] = [];
const avisos: string[] = [];

const critica = (slug: string, msg: string) => criticas.push(`${slug}: ${msg}`);
const aviso = (slug: string, msg: string) => avisos.push(`${slug}: ${msg}`);

const puppies = staticPuppies as unknown as Registro[];

/** Data de nascimento -> filhotes que a declaram. Ver a checagem apos o laco. */
const datasVistas = new Map<string, string[]>();

/** Publicado = aparece em alguma vitrine publica. Mesma regra de `puppiesPublicados`. */
const publicado = (p: Registro) => p.divulgar !== false;

/**
 * Formas cruas que significam "fora da vitrine" de proposito.
 *
 * Existe porque `normalizePuppyStatus` manda TODO valor desconhecido para
 * `unavailable` -- comportamento correto (status digitado errado tira o filhote
 * do ar em vez de anuncia-lo), mas que torna impossivel distinguir "escrevi
 * indisponivel" de "escrevi indisponivle" so pelo resultado. A lista abaixo faz
 * essa distincao e nada mais.
 */
const INDISPONIVEL_DE_PROPOSITO = new Set([
  "unavailable",
  "indisponivel",
  "indisponível",
  "arquivado",
  "archived",
]);

// -- unicidade -------------------------------------------------------------
// Slug repetido e rota duplicada: duas entradas disputando a mesma URL. Id
// repetido quebra a chave de midia e soma engajamento no filhote errado.
for (const campo of ["id", "slug"] as const) {
  const vistos = new Map<string, number>();
  for (const p of puppies) {
    const valor = String(p[campo] ?? "");
    vistos.set(valor, (vistos.get(valor) ?? 0) + 1);
  }
  for (const [valor, vezes] of vistos) {
    if (vezes > 1) critica(valor || "(vazio)", `${campo} repetido ${vezes} vezes`);
  }
}

for (const p of puppies) {
  const slug = String(p.slug ?? p.id ?? "(sem slug)");

  // -- identidade minima ---------------------------------------------------
  if (!p.slug) critica(slug, "sem slug -- a pagina do filhote nao tem URL");
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(p.slug))) {
    critica(slug, "slug fora do formato de URL (minusculas, numeros e hifen)");
  }
  if (!p.name) critica(slug, "sem name -- o card e o schema ficam sem titulo");

  // -- status --------------------------------------------------------------
  const statusBruto = p.status === undefined || p.status === null ? "" : String(p.status).trim();
  if (!statusBruto) {
    aviso(slug, "sem status -- o catalogo assume disponivel");
  } else if (
    normalizePuppyStatus(statusBruto) === "unavailable" &&
    !INDISPONIVEL_DE_PROPOSITO.has(statusBruto.toLowerCase())
  ) {
    critica(slug, `status "${statusBruto}" nao e reconhecido e derruba o filhote para indisponivel`);
  }

  // -- cor: slug de rota ---------------------------------------------------
  // `color` nao e texto livre: e o slug que alimenta generateStaticParams de
  // /filhotes/cor/[cor] e o sitemap. Um valor fora de ALL_COLORS deixa o
  // filhote apontando para uma rota que nunca foi gerada.
  const cor = p.color ? String(p.color).trim().toLowerCase() : "";
  if (!cor) critica(slug, "sem color -- nao ha vitrine de cor para este filhote");
  else if (!(ALL_COLORS as readonly string[]).includes(cor)) {
    critica(slug, `color "${cor}" nao existe em ALL_COLORS: /filhotes/cor/${cor} nao e gerada`);
  }

  // -- sexo: dois nomes para o mesmo dado ----------------------------------
  // Heranca da migracao portugues/ingles. `sex` e `gender` falam o mesmo
  // vocabulario (female/male), entao aqui divergir e contradicao pura: cada
  // consumidor le um lado e a pagina se desmente.
  const sexo = p.sex ? String(p.sex).trim().toLowerCase() : "";
  const genero = p.gender ? String(p.gender).trim().toLowerCase() : "";
  if (sexo && genero && sexo !== genero) {
    critica(slug, `sex="${String(p.sex)}" e gender="${String(p.gender)}" discordam`);
  }

  // -- preco: dois nomes para o mesmo dado ----------------------------------
  // Mesma heranca de `sex`/`gender`, com consequencia pior. Os componentes
  // publicos nao leem todos o mesmo campo, entao divergir aqui faz o card
  // anunciar um valor e a pagina do filhote anunciar outro -- e o comprador
  // chega ao WhatsApp com o preco errado na cabeca.
  const centavos = typeof p.price_cents === "number" ? p.price_cents : null;
  const centavosCamel = typeof p.priceCents === "number" ? p.priceCents : null;
  if (centavos !== null && centavosCamel !== null && centavos !== centavosCamel) {
    critica(slug, `price_cents=${centavos} e priceCents=${centavosCamel} discordam`);
  }

  // -- cor divulgada -------------------------------------------------------
  // A responsavel retirou o cinza-lobo da comunicacao comercial. Publicar um
  // filhote de cor fora da tabela reabre aquela decisao por descuido -- e sem
  // linha na tabela a pagina anuncia um valor que nao corresponde a nada
  // divulgado.
  if (publicado(p) && cor && !(CORES_DIVULGADAS as readonly string[]).includes(cor)) {
    critica(slug, `cor "${cor}" esta publicada mas nao e uma das cores divulgadas`);
  }

  // -- datas ---------------------------------------------------------------
  // Data de nascimento de preenchimento automatico foi removida do catalogo.
  // Ela nao pode voltar como estimativa: idade de filhote e informacao que o
  // comprador usa para decidir, e errar por um mes e errar de verdade.
  for (const campo of ["birth_date", "birthDate", "nascimento"]) {
    const valor = p[campo];
    if (valor === undefined || valor === null || valor === "") continue;
    const texto = String(valor).slice(0, 10);
    if (/^0000|^1970-01-01/.test(texto)) {
      critica(slug, `${campo}="${texto}" e data sentinela, nao data de nascimento`);
    }
    datasVistas.set(texto, [...(datasVistas.get(texto) ?? []), slug]);
  }

  // -- imagens -------------------------------------------------------------
  const imagens = Array.isArray(p.images) ? (p.images as unknown[]) : [];
  if (publicado(p) && imagens.length === 0) critica(slug, "publicado sem nenhuma imagem");

  for (const item of imagens) {
    if (typeof item !== "string" || !item.startsWith("/")) {
      critica(slug, `imagem ${JSON.stringify(item)} nao e um caminho do site`);
      continue;
    }
    if (!existsSync(join(PUBLIC_DIR, item.replace(/^\//, "")))) {
      critica(slug, `imagem "${item}" nao existe em public/`);
    }
  }

  const fotos = imagens.filter((i) => typeof i === "string" && !/\.(mp4|webm|mov)$/i.test(i));
  if (publicado(p) && imagens.length > 0 && fotos.length === 0) {
    critica(slug, "so tem video: o card e o schema ficam sem foto de capa");
  }

  // -- texto ---------------------------------------------------------------
  if (publicado(p) && !p.description) {
    aviso(slug, "sem description -- a pagina e o schema ficam sem texto proprio");
  }
}

// -- data de nascimento repetida ---------------------------------------------
// O catalogo carregava "2024-08-01" em seis filhotes de cinco cores diferentes e
// "2025-04-01" em mais dois. Nao eram irmaos de ninhada: era uma data digitada
// para preencher o campo. As datas foram removidas, e este aviso existe para que
// a mesma coisa nao volte sem ninguem notar.
//
// Aviso e nao falha critica porque irmaos de ninhada COMPARTILHAM data de
// nascimento de verdade. O que o numero abaixo mede e "gente demais nascida no
// mesmo dia para ser uma ninhada so" -- sinal, nao prova.
const LIMITE_MESMA_DATA = 4;
for (const [data, slugs] of datasVistas) {
  if (slugs.length < LIMITE_MESMA_DATA) continue;
  aviso(
    data,
    `${slugs.length} filhotes declaram esta data de nascimento (${slugs.join(", ")})` +
      " -- confira se sao irmaos de ninhada",
  );
}

// -- rotulo da cor -----------------------------------------------------------
// `cor` e o rotulo humano de `color` ("wolf-sable" -> "Cinza-Lobo"). Nao existe
// mapa canonico de slug para rotulo no projeto, e inventar um aqui seria criar
// uma segunda fonte de verdade. O que da para exigir sem inventar nada: dois
// filhotes da MESMA cor tem de carregar o MESMO rotulo. E exatamente o defeito
// que aparece quando alguem troca a cor de um filhote e esquece o rotulo.
const rotulosPorCor = new Map<string, Map<string, string[]>>();
for (const p of puppies) {
  const cor = p.color ? String(p.color).trim().toLowerCase() : "";
  const rotulo = p.cor ? String(p.cor).trim() : "";
  if (!cor || !rotulo) continue;
  if (!rotulosPorCor.has(cor)) rotulosPorCor.set(cor, new Map());
  const porRotulo = rotulosPorCor.get(cor)!;
  porRotulo.set(rotulo, [...(porRotulo.get(rotulo) ?? []), String(p.slug ?? p.id ?? "?")]);
}
for (const [cor, porRotulo] of rotulosPorCor) {
  if (porRotulo.size <= 1) continue;
  const detalhe = [...porRotulo].map(([r, slugs]) => `"${r}" (${slugs.join(", ")})`).join(" vs ");
  critica(cor, `a mesma cor aparece com rotulos diferentes: ${detalhe}`);
}

// -- relatorio -------------------------------------------------------------
const publicados = puppies.filter(publicado).length;
console.log(
  `Catalogo: ${puppies.length} entradas, ${publicados} publicadas, ` +
    `${puppies.length - publicados} fora da vitrine.`,
);

if (avisos.length) {
  console.log(`\nAvisos (${avisos.length}) -- nao travam o deploy:`);
  for (const a of avisos) console.log(`  - ${a}`);
}

if (criticas.length) {
  console.error(`\nFALHAS CRITICAS (${criticas.length}):`);
  for (const c of criticas) console.error(`  x ${c}`);
  console.error("\nO catalogo nao pode ir ao ar assim.");
  process.exit(1);
}

console.log("\nNenhuma falha critica.");
