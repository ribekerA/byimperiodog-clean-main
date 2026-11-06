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
  ["particolor", "macho", 4500],
  ["particolor", "femea", 6500],
  ["laranja", "macho", 4500],
  ["laranja", "femea", 6500],
  ["creme", "macho", 4500],
  ["creme", "femea", 6500],
  ["preto", "macho", 4500],
  ["preto", "femea", 6500],
  ["branco", "macho", 4500],
  ["branco", "femea", 6500],
];

describe("verdade comercial — fixture oficial", () => {
  it.each(OFICIAL)("%s %s: R$ %i", (cor, sexo, valor) => {
    expect(precoDe(cor, sexo)).toBe(valor * 100);
  });
  it("cobre as dez combinações sem inventar condição de pagamento", () => {
    expect(new Set(OFICIAL.map(([cor, sexo]) => cor + sexo)).size).toBe(10);
    // Desde a decisão de 05/11/2026 o valor sai só do sexo: todas as cores têm
    // os mesmos dois valores, e o teto público é o das fêmeas.
    expect(FAIXA_PUBLICA.minCents).toBe(450000);
    expect(FAIXA_PUBLICA.maxCents).toBe(Math.max(...Object.values(PRECO_POR_SLUG)));
  });
  it("o content-guard importa a fonte única e inspeciona a faixa inteira", () => {
    const source = readFileSync(resolve(__dirname, "../scripts/content-guard.mjs"), "utf8");
    // O guard le as duas origens: a matriz por cor e as ofertas por slug.
    // Sem PRECO_POR_SLUG ele reprovaria "R$ 4.500" na prosa — o menor valor
    // realmente praticado — por nao estar na matriz.
    expect(source).toContain('import { PRECO_POR_SLUG, TABELA_DE_PRECOS } from "../src/domain/pricing.ts"');
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
      "spitz-alemao-anao-branco-macho": 450000,
      "spitz-alemao-anao-branco-femea": 650000,
      "spitz-alemao-anao-branco-femea-2": 650000,
      "spitz-alemao-anao-preto-femea": 650000,
      "spitz-alemao-anao-creme-femea": 650000,
      "spitz-alemao-anao-laranja-femea": 650000,
      "spitz-alemao-anao-laranja-femea-laco-rosa": 650000,
      "spitz-alemao-anao-creme-macho": 450000,
      "spitz-alemao-anao-preto-macho": 450000,
      "spitz-alemao-anao-laranja-macho": 450000,
    });
  });
  it("não infere preço de um filhote novo apenas por cor e sexo", () => {
    expect(() => precoDoFilhote("branco", "femea", "filhote-nao-cadastrado")).toThrow("Preço individual não cadastrado");
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
