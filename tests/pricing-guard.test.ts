import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { staticPuppies, puppiesPublicados } from "../content/puppies-static";
import {
  CORES_DIVULGADAS, FAIXA_PUBLICA, PRECO_POR_SLUG, MAX_PARCELAS_CARTAO,
  precoDe, precoDoFilhote, precoCartao, type CorDivulgada, type Sexo,
} from "../src/domain/pricing";

// Fixture independente: preços aprovados em 14/09/2026, em reais.
const OFICIAL: [CorDivulgada, Sexo, number, number][] = [
  ["particolor", "macho", 5500, 6200],
  ["particolor", "femea", 6500, 7200],
  ["laranja", "macho", 6500, 7200],
  ["laranja", "femea", 7500, 8200],
  ["creme", "macho", 7500, 8200],
  ["creme", "femea", 8500, 9200],
  ["preto", "macho", 8500, 9200],
  ["preto", "femea", 9500, 10200],
  ["branco", "macho", 9500, 10200],
  ["branco", "femea", 10500, 11200],
];

describe("verdade comercial — fixture oficial Pix e cartão", () => {
  it.each(OFICIAL)("%s %s: Pix %i e cartão %i", (cor, sexo, pix, cartao) => {
    expect(precoDe(cor, sexo)).toBe(pix * 100);
    expect(precoCartao(precoDe(cor, sexo))).toBe(cartao * 100);
    expect(precoCartao(pix * 100) / 100).toBe(pix + 700);
  });
  it("cobre as dez combinações e até três parcelas sobre o cartão", () => {
    expect(new Set(OFICIAL.map(([cor, sexo]) => cor + sexo)).size).toBe(10);
    expect(MAX_PARCELAS_CARTAO).toBe(3);
    expect(FAIXA_PUBLICA.maxCents).toBe(1050000);
  });
  it("o content-guard importa a fonte única e inspeciona a faixa inteira", () => {
    const source = readFileSync(resolve(__dirname, "../scripts/content-guard.mjs"), "utf8");
    expect(source).toContain('import { TABELA_DE_PRECOS, precoCartao } from "../src/domain/pricing.ts"');
    const janela = source.match(/FAIXA_DE_PRECO_DE_FILHOTE = \{ min: (\d+), max: (\d+) \}/)!;
    expect(Number(janela[1])).toBeLessThanOrEqual(FAIXA_PUBLICA.minCents / 100);
    expect(Number(janela[2])).toBeGreaterThanOrEqual(precoCartao(FAIXA_PUBLICA.maxCents) / 100);
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
  it("não mantém cópias da matriz antiga como exceções individuais", () => {
    expect(PRECO_POR_SLUG).toEqual({ "spitz-alemao-anao-branco-femea": 850000 });
  });
  it("preserva a exclusão das três referências retiradas", () => {
    const slugs = staticPuppies.map((p) => p.slug);
    for (const slug of ["lulu-da-pomerania-branco-macho", "lulu-da-pomerania-particolor-macho", "lulu-da-pomerania-laranja-macho"]) {
      expect(slugs).not.toContain(slug);
    }
  });
  it("ordena a vitrine e mantém os aliases iguais inclusive nas URLs antigas", () => {
    const precos = puppiesPublicados.map((p) => p.priceCents);
    expect(precos).toEqual([...precos].sort((a, b) => a - b));
    for (const p of staticPuppies) expect(p.price_cents).toBe(p.priceCents);
  });
});
