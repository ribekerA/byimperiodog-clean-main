import { describe, expect, it } from "vitest";

import { staticPuppies } from "../content/puppies-static";
import { puppySearchCopy } from "../content/puppy-search-copy";
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

  it("publica a femea do laco rosa em uma ficha exclusiva por R$ 6.500", () => {
    expect(lacoRosa).toBeDefined();
    expect(lacoRosa?.images).toEqual(["/filhotes/laranja/laranja-femea-01.jpg"]);
    expect(lacoRosa?.priceCents).toBe(650000);
    expect(lacoRosa?.price_cents).toBe(650000);
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
  });

  it("nao publica acessorio no nome, titulo ou descricao de nenhum filhote", () => {
    for (const filhote of staticPuppies) {
      const publicado = [filhote.name, filhote.title, filhote.description].join(" ");
      expect(publicado, filhote.slug).not.toMatch(/la[cç]o|lacinho|gravat|bandana/i);
      const textos = puppySearchCopy({ ...filhote, priceCents: filhote.priceCents ?? 0 });
      expect(JSON.stringify(textos ?? {}), filhote.slug).not.toMatch(/la[cç]o|lacinho|gravat|bandana/i);
    }
  });

  it("mantem title e description diferentes entre as duas fichas de femea laranja", () => {
    const copia = (filhote: typeof lacoRosa) =>
      puppySearchCopy({ ...filhote!, priceCents: filhote!.priceCents ?? 0 });
    expect(copia(lacoRosa)?.heading).not.toBe(copia(lacoVermelho)?.heading);
    expect(copia(lacoRosa)?.metadataDescription).not.toBe(copia(lacoVermelho)?.metadataDescription);
  });
});
