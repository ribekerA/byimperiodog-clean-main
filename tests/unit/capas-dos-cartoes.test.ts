import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { puppiesPublicados } from "../../content/puppies-static";
import { capaDoCartao } from "../../src/lib/photo-focus";

describe("capas dos cartoes de filhote", () => {
  it.each(puppiesPublicados.map((p) => [p.slug, p.images] as const))("%s tem capa quadrada no disco", (_slug, images) => {
    const foto = images.find((img) => !img.endsWith(".mp4"));
    const capa = capaDoCartao(foto);
    expect(capa, `sem capa para ${foto}: rode scripts/gerar-capas-dos-cartoes.mjs`).toBeTruthy();
    expect(existsSync(path.join("public", capa as string))).toBe(true);
  });
});
