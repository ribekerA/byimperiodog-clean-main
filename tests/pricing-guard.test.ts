import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { staticPuppies, puppiesPublicados } from "../content/puppies-static";
import {
  CORES_DIVULGADAS, FAIXA_PUBLICA, PRECO_POR_SLUG,
  precoDe, precoDoFilhote, type CorDivulgada, type Sexo,
} from "../src/domain/pricing";

// Fixture independente: preços-base oficiais, em reais. Condições de pagamento
// não são inferidas pelo código e precisam ser confirmadas no atendimento.
const OFICIAL: [CorDivulgada, Sexo, number][] = [
  ["particolor", "macho", 5500],
  ["particolor", "femea", 6500],
  ["laranja", "macho", 6500],
  ["laranja", "femea", 7500],
  ["creme", "macho", 7500],
  ["creme", "femea", 8500],
  ["preto", "macho", 8500],
  ["preto", "femea", 9500],
  ["branco", "macho", 9500],
  ["branco", "femea", 10500],
];

describe("verdade comercial — fixture oficial", () => {
  it.each(OFICIAL)("%s %s: R$ %i", (cor, sexo, valor) => {
    expect(precoDe(cor, sexo)).toBe(valor * 100);
  });
  it("cobre as dez combinações sem inventar condição de pagamento", () => {
    expect(new Set(OFICIAL.map(([cor, sexo]) => cor + sexo)).size).toBe(10);
    expect(FAIXA_PUBLICA.maxCents).toBe(1050000);
  });
  it("o content-guard importa a fonte única e inspeciona a faixa inteira", () => {
    const source = readFileSync(resolve(__dirname, "../scripts/content-guard.mjs"), "utf8");
    expect(source).toContain('import { TABELA_DE_PRECOS } from "../src/domain/pricing.ts"');
    const janela = source.match(/FAIXA_DE_PRECO_DE_FILHOTE = \{ min: (\d+), max: (\d+) \}/)!;
    expect(Number(janela[1])).toBeLessThanOrEqual(FAIXA_PUBLICA.minCents / 100);
    expect(Number(janela[2])).toBeGreaterThanOrEqual(FAIXA_PUBLICA.maxCents / 100);
  });
});

describe("catálogo de referência derivado da fonte comercial", () => {
  it("cada referência publicada corresponde à combinação e aos dois campos de preço", () => {
    expect(puppiesPublicados.length).toBeGreaterThan(0);
    for (const p of puppiesPublicados) {
      const cor = p.color as CorDivulgada;
      const sexo = p.sex === "female" ? "femea" : "macho";
      expect(CORES_DIVULGADAS).toContain(cor);
      expect(p.priceCents).toBe(precoDoFilhote(cor, sexo, p.slug));
      expect(p.price_cents).toBe(p.priceCents);
      const excecao = PRECO_POR_SLUG[p.slug];
      expect(p.priceCents).toBe(excecao ?? OFICIAL.find(([c, s]) => c === cor && s === sexo)![2] * 100);
    }
  });
  it("mantém somente os preços individuais confirmados", () => {
    expect(PRECO_POR_SLUG).toEqual({
      "spitz-alemao-anao-branco-femea": 850000,
      "spitz-alemao-anao-preto-femea": 950000,
    });
  });
  it("preserva a exclusão das três referências retiradas", () => {
    const slugs = staticPuppies.map((p) => p.slug);
    for (const slug of ["lulu-da-pomerania-branco-macho", "lulu-da-pomerania-particolor-macho", "lulu-da-pomerania-laranja-macho"]) {
      expect(slugs).not.toContain(slug);
    }
  });
  it("prioriza o lote em evidência e mantém os aliases iguais inclusive nas URLs antigas", () => {
    expect(puppiesPublicados.slice(0, 2).map((p) => p.slug)).toEqual([
      "spitz-alemao-anao-branco-femea",
      "spitz-alemao-anao-preto-femea",
    ]);
    const precosRestantes = puppiesPublicados.slice(2).map((p) => p.priceCents);
    expect(precosRestantes).toEqual([...precosRestantes].sort((a, b) => a - b));
    for (const p of staticPuppies) expect(p.price_cents).toBe(p.priceCents);
  });
  it("mantém nomes distintos nos cards publicados", () => {
    const nomes = puppiesPublicados.map((p) => p.name.trim().toLocaleLowerCase("pt-BR"));
    expect(new Set(nomes).size).toBe(nomes.length);
  });
});
