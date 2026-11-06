import { describe, expect, it } from "vitest";

import { BRAND } from "@/domain/config";
import { FAIXA_PUBLICA, formatarPreco } from "@/domain/pricing";

import { GET } from "../app/llms.txt/route";

describe("llms.txt — fatos comerciais públicos", () => {
  it("preserva identidade e os dois valores de partida", async () => {
    const response = await GET();
    const text = await response.text();
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(text).toContain(BRAND.name);
    expect(text).toContain(formatarPreco(FAIXA_PUBLICA.minCents));
    expect(text).toContain(formatarPreco(FAIXA_PUBLICA.maxCents));
    expect(text).toContain("valores a partir de R$ 4.500 nos machos e R$ 6.500 nas fêmeas, no PIX");
    expect(text).not.toMatch(/Cada filhote tem preço individual|Fêmeas custam mais/);
  });

  it("não promete estoque ou transporte irrestrito nem inclui áreas privadas", async () => {
    const text = await (await GET()).text();
    expect(text).toContain("disponibilidade atual e as condições são confirmadas");
    expect(text).toContain("Entregas em todo o Brasil via transporte aéreo");
    expect(text).toContain("conforme viabilidade da rota, idade e condições do filhote");
    expect(text).toContain("da viagem são confirmados antes da reserva");
    expect(text).toContain("Vacinação e vermifugação conforme a idade");
    expect(text).not.toContain("entrega em todo o Brasil");
    expect(text).not.toMatch(/\]\(https?:\/\/[^)]+\/(?:admin|contract|api\/admin)\//);
  });
});
