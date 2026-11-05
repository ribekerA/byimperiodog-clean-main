import { describe, expect, it } from "vitest";

import { BRAND } from "@/domain/config";
import { FAIXA_PUBLICA, formatarPreco } from "@/domain/pricing";

import { GET } from "../app/llms.txt/route";

describe("llms.txt — fatos comerciais públicos", () => {
  it("preserva identidade, preço individual e fonte atual dos valores", async () => {
    const response = await GET();
    const text = await response.text();
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(text).toContain(BRAND.name);
    expect(text).toContain(formatarPreco(FAIXA_PUBLICA.minCents));
    expect(text).toContain(formatarPreco(FAIXA_PUBLICA.maxCents));
    expect(text).toContain("Cada filhote tem preço individual");
    expect(text).toContain("mesma cor e sexo de outro");
    expect(text).not.toMatch(/Fêmeas custam mais|com preço a partir de/);
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
