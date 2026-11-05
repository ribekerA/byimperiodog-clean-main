import { describe, expect, it } from "vitest";

import { matchesCatalogQuery, parseCatalogQuery } from "@/lib/catalog-query";

describe("busca da vitrine sem inferir estoque", () => {
  it.each(["até R$ 7.500", "até 7500", "até 7,5 mil", "até 7.5k", "no máximo 7.500,00"])("interpreta orçamento: %s", (text) => {
    expect(parseCatalogQuery(text).maxPriceCents).toBe(750000);
  });
  it("combina cor, sexo e preço individual", () => {
    const query = parseCatalogQuery("Quero uma fêmea branca até R$ 7.500");
    expect(matchesCatalogQuery({ color: "branco", sex: "female", priceCents: 750000 }, query)).toBe(true);
    expect(matchesCatalogQuery({ color: "branco", sex: "female", priceCents: 850000 }, query)).toBe(false);
    expect(matchesCatalogQuery({ color: "branco", sex: "male", priceCents: 750000 }, query)).toBe(false);
    expect(matchesCatalogQuery({ color: "branco", sex: "female" }, query)).toBe(false);
  });
  it("não transforma cor ausente em resultado de outra cor", () => {
    expect(matchesCatalogQuery({ color: "branco" }, parseCatalogQuery("Tem chocolate?"))).toBe(false);
  });
  it("reconhece disponibilidade sem inferir status dos registros", () => {
    expect(parseCatalogQuery("Quais machinhos estão disponíveis?")).toMatchObject({ sexes: ["male"], available: true });
  });
  it("orienta perguntas de localização e reserva", () => {
    expect(parseCatalogQuery("Vocês ficam perto de Atibaia?").topic).toBe("location");
    expect(parseCatalogQuery("Como funciona a reserva?").topic).toBe("reservation");
  });
  it.each(["não quero branco", "entre 5000 e 7500", "acima de 7000", "unicórnio"])("pede reformulação para %s", (text) => {
    expect(parseCatalogQuery(text).unsupported).toBe(true);
  });
  it("entrada vazia mantém a vitrine e não altera dados", () => {
    const puppy = Object.freeze({ color: "preto", sex: "male", price_cents: 650000 });
    expect(matchesCatalogQuery(puppy, parseCatalogQuery(""))).toBe(true);
  });
});
