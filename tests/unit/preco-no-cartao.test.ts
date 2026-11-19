import { describe, expect, it } from "vitest";

import {
  PARCELAS_CARTAO,
  PISO_FEMEA,
  PISO_MACHO,
  PRECO_POR_SLUG,
  parcelaNoCartao,
  precoNoCartao,
  textoNoCartao,
} from "@/domain/pricing";

// Condição do cartão decidida em 19/11/2026: PIX + R$ 500, em até 10x iguais.
// O CDC (art. 52) pede o total do parcelado; "sem juros" só é verdade se as
// parcelas somarem exatamente o preço no cartão.
describe("preço no cartão", () => {
  it("macho e fêmea batem com a tabela combinada", () => {
    expect(textoNoCartao(PISO_MACHO)).toBe("R$ 5.000 no cartão, em até 10x de R$ 500 sem juros");
    expect(textoNoCartao(PISO_FEMEA)).toBe("R$ 7.000 no cartão, em até 10x de R$ 700 sem juros");
  });

  it("as parcelas somam o preço no cartão, sem resto", () => {
    for (const cents of Object.values(PRECO_POR_SLUG)) {
      expect(parcelaNoCartao(cents) * PARCELAS_CARTAO).toBe(precoNoCartao(cents));
    }
  });
});
