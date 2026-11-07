/**
 * Os redirects de rota do netlify.toml, conferidos contra o conteudo real.
 *
 * Um redirect e a unica parte do site que ninguem ve quebrar. A pagina some do
 * menu e alguem reclama; um 301 continua respondendo 301 para um destino que
 * deixou de existir, e o visitante cai num 404 que nenhum teste de pagina
 * alcanca. Foi assim que o sitelink
 * /blog/criador-de-spitz-confiavel-checklist-de-transparencia-e-sinais-de-alerta-2026
 * passou 2026 inteiro no Google Ads apontando para um post que nunca foi
 * escrito: 271 impressoes servidas, 404 em todas.
 *
 * Estes testes leem o netlify.toml do disco — nao uma copia — e cobram duas
 * coisas:
 *
 *   que o redirect do sitelink     se alguem apagar a linha, o anuncio volta a
 *   continue la                    404 e a conta volta a arriscar reprovacao
 *                                  por "Destino que nao funciona"
 *
 *   que todo redirect para /blog/  renomear um .mdx deixa de ser mudanca
 *   caia num post que existe       silenciosa: o portao aponta o destino morto
 *
 * O destino sai de src/lib/_generated-posts.ts, que e a mesma lista que a rota
 * /blog/[slug] usa para decidir o que existe.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { generatedPosts } from "../../src/lib/_generated-posts";

/** O sitelink que motivou este arquivo. Literal de proposito. */
const SITELINK_QUEBRADO =
  "/blog/criador-de-spitz-confiavel-checklist-de-transparencia-e-sinais-de-alerta-2026";

type Redirect = { from: string; to: string; status: number; force: boolean };

/**
 * Le os blocos `[[redirects]]` do netlify.toml.
 *
 * Sem parser de TOML de verdade porque nao ha um no projeto e nenhum valor
 * deste arquivo precisa de um: os blocos sao planos, as chaves cabem em quatro
 * nomes e tudo que nao for `from`/`to`/`status`/`force` e ignorado de proposito.
 */
function lerRedirects(toml: string): Redirect[] {
  return toml
    .split(/^\[\[redirects\]\]\s*$/m)
    .slice(1)
    .map((bloco) => bloco.split(/^\[/m)[0])
    .map((bloco) => ({
      from: /^\s*from\s*=\s*"([^"]*)"/m.exec(bloco)?.[1] ?? "",
      to: /^\s*to\s*=\s*"([^"]*)"/m.exec(bloco)?.[1] ?? "",
      status: Number(/^\s*status\s*=\s*(\d+)/m.exec(bloco)?.[1] ?? 0),
      force: /^\s*force\s*=\s*true/m.test(bloco),
    }))
    .filter((r) => r.from !== "");
}

const REDIRECTS = lerRedirects(readFileSync(join(process.cwd(), "netlify.toml"), "utf8"));
const SLUGS = new Set(generatedPosts.map((p) => p.slug));

describe("redirects do netlify.toml", () => {
  it("le os blocos do arquivo de verdade", () => {
    // Se o parse voltar vazio, os testes abaixo passariam sem conferir nada.
    expect(REDIRECTS.length).toBeGreaterThan(10);
  });

  it("todo redirect para um post do blog cai num post que existe", () => {
    const mortos = REDIRECTS.filter(
      (r) => r.to.startsWith("/blog/") && !r.to.includes("*") && !SLUGS.has(r.to.slice("/blog/".length)),
    ).map((r) => `${r.from} -> ${r.to}`);

    expect(mortos).toEqual([]);
  });
});

describe("sitelink do Google Ads que apontava para 404", () => {
  const regra = REDIRECTS.find((r) => r.from === SITELINK_QUEBRADO);

  it("tem redirect", () => {
    expect(regra, `nenhum redirect para ${SITELINK_QUEBRADO}`).toBeDefined();
  });

  it("responde 301 e nao depende de pagina inexistente", () => {
    // `force` importa: sem ele o redirect so vale quando nada mais responde, e
    // a regra viraria letra morta no dia em que o slug ganhasse uma pagina.
    expect(regra?.status).toBe(301);
    expect(regra?.force).toBe(true);
  });

  it("leva ao guia de sinais de alerta, que e o que o slug promete", () => {
    expect(regra?.to).toBe("/blog/como-escolher-canil-spitz-alemao");
    expect(SLUGS.has("como-escolher-canil-spitz-alemao")).toBe(true);
  });
});
