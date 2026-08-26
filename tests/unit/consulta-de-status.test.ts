import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { describe, expect, it } from "vitest";

import { statusOrFilter } from "@/domain/puppy-status";

/**
 * Ninguém escreve status de filhote à mão dentro de uma consulta.
 *
 * Este é o defeito que mais voltou no projeto, e ele volta porque a consulta
 * errada parece certa. `.eq("status", "available")` contra a tabela `puppies`
 * é sintaticamente válida, não gera erro, não gera log — e devolve zero linha,
 * porque o admin grava "disponivel" em português. Quem lê o resultado conclui
 * que o estoque acabou.
 *
 * Três ocorrências reais, cada uma encontrada meses depois:
 *
 *   - `app/api/admin/seo/sitemap/route.ts` publicava sitemap sem nenhum filhote;
 *   - `src/lib/ai/autoSalesEngine.ts` oferecia ao lead, por WhatsApp, um
 *     estoque que não era o do site;
 *   - `src/lib/puppyRecommender.ts` só enxergava linha com status nulo.
 *
 * A forma reconhecida é `statusOrFilter` (banco) ou `isAvailable` /
 * `normalizePuppyStatus` (memória), ambos em src/domain/puppy-status.ts, que
 * derivam as formas aceitas da mesma tabela de aliases usada na leitura.
 */

const RAIZ = resolve(__dirname, "..", "..");
const DIRETORIOS = ["app", "src", "scripts"];

/** O arquivo que define as formas é o único que pode escrevê-las. */
const DONO = "src/domain/puppy-status.ts";

/**
 * Status literal dentro de uma consulta ao PostgREST — nas duas sintaxes que o
 * supabase-js aceita.
 *
 * A checagem vale só para a tabela `puppies`. Outras tabelas também têm coluna
 * `status` (post de blog, webhook, sugestão de SEO), e nelas o valor é escrito
 * e lido pelo mesmo código, numa língua só — ali comparar com literal está
 * certo. O problema é específico de `puppies`, onde o admin grava português e
 * metade do código lê inglês.
 */
const PADROES: ReadonlyArray<{ re: RegExp; nome: string }> = [
  { re: /status\.eq\.[a-zà-ú_]+/i, nome: "filtro .or com status.eq literal" },
  { re: /\.eq\(\s*["']status["']\s*,/i, nome: ".eq com status literal" },
];

/**
 * Trechos de consulta que partem de `.from("puppies")` e vão até o fim do
 * encadeamento. É o recorte em que um literal de status é defeito.
 */
function consultasDePuppies(fonte: string): string[] {
  const trechos: string[] = [];
  const inicio = /\.from\(\s*["']puppies["']\s*\)/g;
  let achado: RegExpExecArray | null;
  while ((achado = inicio.exec(fonte)) !== null) {
    const resto = fonte.slice(achado.index);
    const fim = resto.indexOf(";");
    trechos.push(fim === -1 ? resto.slice(0, 600) : resto.slice(0, fim));
  }
  return trechos;
}

function semComentarios(fonte: string): string {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

function arquivosDeCodigo(dir: string, achados: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === ".next") continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      arquivosDeCodigo(caminho, achados);
      continue;
    }
    if (/\.(tsx?|mts|mjs)$/.test(nome)) achados.push(caminho);
  }
  return achados;
}

describe("consulta de status de filhote", () => {
  it("nenhuma consulta a puppies escreve o status literal", () => {
    const reincidentes: string[] = [];

    for (const raiz of DIRETORIOS) {
      for (const caminho of arquivosDeCodigo(join(RAIZ, raiz))) {
        const rel = relative(RAIZ, caminho).split(sep).join("/");
        if (rel === DONO) continue;
        const fonte = semComentarios(readFileSync(caminho, "utf8"));
        for (const consulta of consultasDePuppies(fonte)) {
          for (const { re, nome } of PADROES) {
            if (re.test(consulta)) reincidentes.push(`${rel} — ${nome}`);
          }
        }
      }
    }

    expect(
      reincidentes,
      "Use statusOrFilter() de src/domain/puppy-status.ts na consulta, ou " +
        "isAvailable()/normalizePuppyStatus() depois de ler. O admin grava o " +
        'status em português ("disponivel"), então comparar com "available" ' +
        "devolve zero linha sem acusar erro.",
    ).toEqual([]);
  });

  it("statusOrFilter cobre as duas línguas gravadas na tabela", () => {
    const filtro = statusOrFilter(["available"]);
    expect(filtro).toContain("status.eq.available");
    expect(filtro).toContain("status.eq.disponivel");
    expect(filtro).not.toContain("status.is.null");
  });

  it("statusOrFilter só inclui nulo quando pedido", () => {
    expect(statusOrFilter(["available"], { incluirNulo: true })).toContain("status.is.null");
  });
});
