import { describe, expect, it } from "vitest";

import {
  PISO_FEMEA,
  PRECO_POR_SLUG,
  TAXAS_CARTAO,
  dividirEmParcelas,
  opcoesNoCartao,
  textoDasParcelas,
  textoNoCartao,
  totalNoCartao,
} from "@/domain/pricing";

// Regra do cartão decidida em 25/11/2026: valor do PIX + taxa da maquininha,
// por conta do cliente; nada "sem juros". Os números de referência são os do
// simulador da maquininha: R$ 6.500 a receber em 12x → cobrar R$ 7.504,90,
// 1x de R$ 625,50 e 11x de R$ 625,40.
describe("preço no cartão", () => {
  it("12x bate com o simulador da maquininha", () => {
    expect(totalNoCartao(650000, 1339)).toBe(750490);
    expect(dividirEmParcelas(750490, 12)).toEqual({
      parcelas: 12,
      totalCents: 750490,
      primeiraCents: 62550,
      demaisCents: 62540,
    });
    expect(dividirEmParcelas(650000, 12)).toMatchObject({ primeiraCents: 54174, demaisCents: 54166 });
  });

  it("1x a 12x batem com o simulador da maquininha (R$ 6.500)", () => {
    const simulador = [
      "1x de R$ 6.781,42",
      "2x (1x de R$ 3.480,78 e 1x de R$ 3.480,77)",
      "3x (1x de R$ 2.334,53 e 2x de R$ 2.334,51)",
      "4x de R$ 1.766,11",
      "5x (1x de R$ 1.428,43 e 4x de R$ 1.428,41)",
      "6x (1x de R$ 1.203,61 e 5x de R$ 1.203,56)",
      "7x (1x de R$ 1.038,58 e 6x de R$ 1.038,55)",
      "8x (1x de R$ 912,88 e 7x de R$ 912,81)",
      "9x (1x de R$ 820,64 e 8x de R$ 820,61)",
      "10x (1x de R$ 742,79 e 9x de R$ 742,77)",
      "11x (1x de R$ 682,04 e 10x de R$ 681,94)",
      "12x (1x de R$ 625,50 e 11x de R$ 625,40)",
    ];
    expect(opcoesNoCartao(650000).map(textoDasParcelas)).toEqual(simulador);
  });

  it("texto da fêmea no piso", () => {
    expect(textoNoCartao(PISO_FEMEA)).toBe("em até 12x no cartão");
    const doze = opcoesNoCartao(PISO_FEMEA).find((o) => o.parcelas === 12);
    expect(doze && textoDasParcelas(doze)).toBe("12x (1x de R$ 625,50 e 11x de R$ 625,40)");
  });

  it("parcela sem taxa cadastrada não é oferecida", () => {
    const comTaxa = Object.entries(TAXAS_CARTAO)
      .filter(([, taxa]) => taxa !== null)
      .map(([n]) => Number(n));
    expect(opcoesNoCartao(PISO_FEMEA).map((o) => o.parcelas)).toEqual(comTaxa.sort((a, b) => a - b));
  });

  it("as parcelas somam o total e o total cobre o PIX depois da taxa", () => {
    for (const cents of Object.values(PRECO_POR_SLUG)) {
      for (const opcao of opcoesNoCartao(cents)) {
        const taxa = TAXAS_CARTAO[opcao.parcelas] as number;
        expect(opcao.primeiraCents + opcao.demaisCents * (opcao.parcelas - 1)).toBe(opcao.totalCents);
        expect(opcao.primeiraCents).toBeGreaterThanOrEqual(opcao.demaisCents);
        // Cortar no centavo pode deixar a loja até 1 centavo abaixo do PIX, como na maquininha.
        expect(Math.abs((opcao.totalCents * (10000 - taxa)) / 10000 - cents)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("nunca promete sem juros nem publica o total", () => {
    for (const cents of Object.values(PRECO_POR_SLUG)) {
      expect(textoNoCartao(cents) ?? "").not.toMatch(/sem juros|total|R\$/i);
    }
  });
});
