import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { CORES_DIVULGADAS, FAIXA_PUBLICA, TABELA_DE_PRECOS } from "../src/domain/pricing";

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
        CORES_DIVULGADAS.flatMap((cor) => [
          TABELA_DE_PRECOS[cor].macho / 100,
          TABELA_DE_PRECOS[cor].femea / 100,
        ])
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

  it("nenhum valor divulgado passa de R$ 9.500 nesta rodada", () => {
    expect(FAIXA_PUBLICA.maxCents).toBeLessThanOrEqual(950000);
  });

  it("a femea custa mais que o macho em todas as cores divulgadas", () => {
    for (const cor of CORES_DIVULGADAS) {
      expect(TABELA_DE_PRECOS[cor].femea).toBeGreaterThan(TABELA_DE_PRECOS[cor].macho);
    }
  });
});
