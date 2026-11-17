import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND } from "@/domain/config";
import { REGRA_DE_ENTREGA } from "@/domain/public-truth";
import { DISPONIVEIS } from "@/content/disponiveis";
import { faseNoDia } from "@/lib/temporada";
import { buildLocalBusinessLD } from "@/lib/structured-data";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("revisão comercial/SEO de 17/11/2026", () => {
  it("usa a regra neutra exata sem prometer regiões nem modal de transporte", () => {
    expect(REGRA_DE_ENTREGA).toBe(
      "Retirada ou entrega, conforme a disponibilidade. Local, prazo e condições são combinados antes da reserva.",
    );
  });

  it("usa identidade e redes sociais do negócio existente", () => {
    expect(BRAND.name).toBe("By Imperio Dog");
    expect(BRAND.fullName).toBe("By Imperio Dog - Canil Spitz Alemão Anão Lulu da Pomerânia");
    expect(BRAND.headquarters.city).toBe("Bragança Paulista");
    expect(BRAND.contact.phone).toBe("+55 11 96863-3239");
    const schema = buildLocalBusinessLD();
    expect(schema.name).toBe(BRAND.fullName);
    expect(schema.sameAs).toEqual(BRAND.schema.sameAs);
    expect("areaServed" in schema).toBe(false);
  });

  it("mantém o estoque separado da vitrine e não inventa animais", () => {
    expect(DISPONIVEIS).toEqual([]);
    const page = read("app/(public)/disponiveis/page.tsx");
    expect(page).toContain("Product");
    expect(page).toContain("InStock");
    expect(page).toContain("index: false");
  });

  it("sai do Natal em 1º de janeiro", () => {
    expect(faseNoDia(1201)).toBe("familia");
    expect(faseNoDia(1231)).toBe("festas");
    expect(faseNoDia(101)).toBeNull();
  });

  it("preserva 301 sem fragmentar páginas sinônimas", () => {
    const netlify = read("netlify.toml");
    for (const path of ["/pomeranian", "/lulu-da-pomerania", "/filhote-de-spitz-alemao"]) {
      expect(netlify).toContain(`from = "${path}"\n  to = "/spitz-alemao"\n  status = 301`);
    }
  });

  it("não anuncia avaliações vazias nem avisos técnicos", () => {
    const review = read("src/components/reviews/AvaliacoesRotativas.tsx");
    expect(review).toContain(".slice(0, 8)");
    expect(review).not.toContain("Trecho: o texto completo está no Google.");
    expect(review).not.toContain("Avaliação de {avaliacao.rating} estrelas no Google.");
  });
});
