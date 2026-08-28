import { describe, expect, it } from "vitest";

import { staticPuppies } from "../content/puppies-static";
import { getPuppiesByColor } from "../src/lib/catalog-utils";

const SLUG_LACO_VERMELHO = "spitz-alemao-anao-laranja-femea";
const SLUG_LACO_ROSA = "spitz-alemao-anao-laranja-femea-laco-rosa";

describe("separacao das galerias das femeas laranja", () => {
  const lacoVermelho = staticPuppies.find((filhote) => filhote.slug === SLUG_LACO_VERMELHO);
  const lacoRosa = staticPuppies.find((filhote) => filhote.slug === SLUG_LACO_ROSA);

  it("mantem a capa escolhida e retira as duas fotos misturadas da ficha original", () => {
    expect(lacoVermelho).toBeDefined();
    expect(lacoVermelho?.images[0]).toBe(
      "/filhotes/laranja/laranja-femea-brinquedos-04.jpg"
    );
    expect(lacoVermelho?.images).not.toContain(
      "/filhotes/laranja/laranja-femea-flores-01.jpg"
    );
    expect(lacoVermelho?.images).not.toContain("/filhotes/laranja/laranja-femea-01.jpg");
  });

  it("publica a femea do laco rosa em uma ficha exclusiva por R$ 8.500", () => {
    expect(lacoRosa).toBeDefined();
    expect(lacoRosa?.images).toEqual(["/filhotes/laranja/laranja-femea-01.jpg"]);
    expect(lacoRosa?.priceCents).toBe(850000);
    expect(lacoRosa?.price_cents).toBe(850000);
  });

  it("nao compartilha nenhuma midia entre as duas fichas", () => {
    const midiasVermelhas = new Set(lacoVermelho?.images ?? []);
    const compartilhadas = (lacoRosa?.images ?? []).filter((imagem) => midiasVermelhas.has(imagem));
    expect(compartilhadas).toEqual([]);
  });

  it("mostra a femea de laco rosa antes da femea de laco vermelho na pagina laranja", () => {
    const femeas = getPuppiesByColor("laranja").filter((filhote) => filhote.sex === "female");

    expect(femeas.slice(0, 2).map((filhote) => filhote.slug)).toEqual([
      SLUG_LACO_ROSA,
      SLUG_LACO_VERMELHO,
    ]);
    expect(lacoVermelho?.name).toContain("Laço Vermelho");
  });
});
