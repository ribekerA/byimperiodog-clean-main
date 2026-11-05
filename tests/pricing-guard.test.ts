import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { staticPuppies, puppiesPublicados } from "../content/puppies-static";
import {
  CORES_DIVULGADAS,
  FAIXA_PUBLICA,
  PRECO_POR_SLUG,
  TABELA_DE_PRECOS,
  precoDoFilhote,
  type CorDivulgada,
  type Sexo,
} from "../src/domain/pricing";

/**
 * scripts/content-guard.mjs roda no prebuild, antes de o Next existir, e por
 * isso nao consegue resolver o alias "@/" para importar a tabela. A solucao foi
 * repetir os quatro valores la dentro — e uma copia so e segura enquanto alguem
 * garante que as duas nao divergiram. E este teste.
 *
 * Sem ele, mudar um preco em domain/pricing sem mexer no guard produz o pior
 * resultado possivel: o build passa e o guard passa a aprovar exatamente o
 * numero errado que deveria barrar.
 */
const guardSource = readFileSync(
  resolve(__dirname, "../scripts/content-guard.mjs"),
  "utf8"
);

function lerConjuntoDoGuard(nome: string): number[] {
  // Recorte por texto, sem regex montada em template literal: o `new RegExp`
  // exigiria escapar colchete e parentese, e barra dentro de template e um
  // otimo lugar para o escape sumir sem ninguem notar.
  const inicio = guardSource.indexOf(`const ${nome} = new Set([`);
  if (inicio === -1) throw new Error(`${nome} nao encontrado em content-guard.mjs`);

  const abre = guardSource.indexOf("[", inicio);
  const fecha = guardSource.indexOf("]", abre);
  return guardSource
    .slice(abre + 1, fecha)
    .split(",")
    .map((parte) => Number(parte.trim()))
    .filter((valor) => Number.isFinite(valor))
    .sort((a, b) => a - b);
}

describe("tabela de precos x content-guard", () => {
  it("o guard conhece exatamente os valores da tabela", () => {
    const daTabela = [
      ...new Set(
        CORES_DIVULGADAS.flatMap((cor) =>
          [TABELA_DE_PRECOS[cor].macho, TABELA_DE_PRECOS[cor].femea]
            .filter((valor): valor is number => valor !== null)
            .map((valor) => valor / 100)
        )
      ),
    ].sort((a, b) => a - b);

    expect(lerConjuntoDoGuard("PRECOS_DA_TABELA")).toEqual(daTabela);
  });

  it("a faixa publica cabe dentro da janela que o guard inspeciona", () => {
    const janela = guardSource.match(
      /FAIXA_DE_PRECO_DE_FILHOTE = \{ min: (\d+), max: (\d+) \}/
    );
    if (!janela) throw new Error("FAIXA_DE_PRECO_DE_FILHOTE nao encontrada");

    // Um preco publicado que caia fora da janela passaria despercebido.
    expect(Number(janela[1])).toBeLessThanOrEqual(FAIXA_PUBLICA.minCents / 100);
    expect(Number(janela[2])).toBeGreaterThanOrEqual(FAIXA_PUBLICA.maxCents / 100);
  });

  it("mantem a faixa publica exatamente entre R$ 7.500 e R$ 8.500", () => {
    expect(FAIXA_PUBLICA).toMatchObject({ minCents: 750000, maxCents: 850000 });
  });

  it("compara os sexos somente quando os dois estao publicados", () => {
    for (const cor of CORES_DIVULGADAS) {
      const linha = TABELA_DE_PRECOS[cor];
      if (linha.macho !== null && linha.femea !== null) {
        expect(linha.femea).toBeGreaterThan(linha.macho);
      }
    }
    expect(TABELA_DE_PRECOS.laranja.macho).toBeNull();
    expect(TABELA_DE_PRECOS.branco.macho).toBeNull();
  });
});

/**
 * O preco que o visitante ve na pagina do filhote nao sai da tabela: sai do
 * `priceCents` gravado no catalogo. Sao duas fontes, e ate aqui ninguem
 * conferia uma contra a outra.
 *
 * O cabecalho de content/puppies-static.ts dizia que o content-guard fazia
 * essa conferencia no prebuild. Nao fazia: o arquivo esta na lista de SKIP do
 * guard, e o padrao que o guard procura e o preco em prosa ("R$ 8.500"), nunca
 * os centavos que o catalogo guarda. A conferencia estava documentada e
 * ausente — a pior das combinacoes, porque quem lesse o comentario confiaria
 * nela.
 *
 * O estrago que isto barra e silencioso: trocar um `priceCents` para um valor
 * fora da tabela faz a pagina do filhote anunciar um preco que /preco-spitz-anao
 * contradiz, e o build passa inteiro. A femea branca do anuncio do Google Ads
 * e justamente uma dessas paginas.
 */
describe("regras de preco x catalogo de filhotes", () => {
  it("todo filhote publicado cobra exatamente o valor definido para a sua pagina", () => {
    // Um catalogo vazio faria o laco abaixo passar sem conferir nada.
    expect(puppiesPublicados.length).toBeGreaterThan(0);

    for (const filhote of puppiesPublicados) {
      const cor = filhote.color as CorDivulgada;
      const sexo: Sexo = filhote.sex === "female" ? "femea" : "macho";

      // Cor fora da tabela numa vitrine publica e o outro lado do mesmo
      // problema: nao ha preco oficial para cobrar.
      expect(CORES_DIVULGADAS).toContain(cor);
      expect({ slug: filhote.slug, preco: filhote.priceCents }).toEqual({
        slug: filhote.slug,
        preco: precoDoFilhote(cor, sexo, filhote.slug),
      });
    }
  });

  it("mantem os valores definidos para as paginas com preco especifico", () => {
    expect(PRECO_POR_SLUG).toEqual({
      "spitz-alemao-anao-branco-femea": 850000,
      "spitz-alemao-anao-laranja-femea": 850000,
      "spitz-alemao-anao-laranja-femea-laco-rosa": 850000,
      "spitz-alemao-anao-preto-femea": 850000,
    });
  });

  it("nao publica os filhotes retirados nem equivalentes com outro slug", () => {
    const slugs = staticPuppies.map((filhote) => filhote.slug);
    expect(slugs).not.toContain("lulu-da-pomerania-branco-macho");
    expect(slugs).not.toContain("lulu-da-pomerania-particolor-macho");
    expect(slugs).not.toContain("lulu-da-pomerania-laranja-macho");
    expect(slugs).not.toContain("spitz-alemao-anao-laranja-macho");

    expect(puppiesPublicados.some((filhote) => filhote.color === "particolor")).toBe(false);
    expect(
      puppiesPublicados.some(
        (filhote) => filhote.color === "laranja" && filhote.sex === "male"
      )
    ).toBe(false);
    expect(
      puppiesPublicados.some(
        (filhote) => filhote.color === "branco" && filhote.sex === "male"
      )
    ).toBe(false);
  });

  it("mantem exatamente as sete fichas comerciais autorizadas", () => {
    expect(puppiesPublicados.map((filhote) => filhote.slug).sort()).toEqual([
      "spitz-alemao-anao-branco-femea",
      "spitz-alemao-anao-creme-femea",
      "spitz-alemao-anao-creme-macho",
      "spitz-alemao-anao-laranja-femea",
      "spitz-alemao-anao-laranja-femea-laco-rosa",
      "spitz-alemao-anao-preto-femea",
      "spitz-alemao-anao-preto-macho",
    ].sort());
  });

  it("publica o catalogo do menor preco para o maior", () => {
    const precos = puppiesPublicados.map((filhote) => filhote.priceCents);
    expect(precos).toEqual([...precos].sort((a, b) => a - b));
  });

  it("os dois campos de preco do mesmo filhote nao divergem", () => {
    // O catalogo guarda `price_cents` e `priceCents` lado a lado, para os dois
    // formatos que o projeto ja consumiu. Editar so um deles deixaria card e
    // pagina cobrando valores diferentes pelo mesmo filhote.
    for (const filhote of staticPuppies) {
      expect({ slug: filhote.slug, snake: filhote.price_cents }).toEqual({
        slug: filhote.slug,
        snake: filhote.priceCents,
      });
    }
  });
});
