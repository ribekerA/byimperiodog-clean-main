import { describe, expect, it } from "vitest";

const BANNED_TERMS = ["adocao", "doacao", "boutique"];
const BREED_PATTERN = /spitz\s+alem[ãa]o(?:\s+an[ãa]o)?/gi;

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

describe("content guard rules", () => {
  describe("banned terms", () => {
    it("flags banned terms with and without diacritics", () => {
      for (const sample of ["adoção", "adoção responsável", "adocao"]) {
        expect(hasBannedTerm(sample)).toBe(true);
      }
      for (const sample of ["doação", "doacao solidária", "Boutique premium"]) {
        expect(hasBannedTerm(sample)).toBe(true);
      }
    });

    it("ignores safe words", () => {
      for (const sample of ["adoração", "educação", "botique"]) {
        expect(hasBannedTerm(sample)).toBe(false);
      }
    });
  });

  describe("Spitz and Lulu pairing", () => {
    it("accepts paired usage in the same sentence", () => {
      const text =
        "Spitz Alemão (Lulu da Pomerânia) com até 22 cm de altura e suporte vitalício.";
      expect(isBreedPaired(text)).toBe(true);
    });

    it("rejects unpaired usage", () => {
      const text = "Spitz Alemão disponível com suporte completo.";
      expect(isBreedPaired(text)).toBe(false);
    });

    it("accepts pairing within the configured window", () => {
      const text = [
        "Conheça o nosso Spitz Alemão Anão com pedigree incrível.",
        "Esse Spitz é reconhecido como Lulu da Pomerânia em todo o Brasil.",
      ].join("\n");
      expect(isBreedPaired(text)).toBe(true);
    });
  });

  describe("cernelha rule", () => {
    it('requires the literal form "cernelha (altura)"', () => {
      expect(hasCernelhaViolation("Medimos a cernelha (altura) de cada filhote.")).toBe(
        false
      );
      expect(hasCernelhaViolation("A cernelha média é acompanhada por especialistas.")).toBe(
        true
      );
    });
  });
});

function hasBannedTerm(text: string) {
  const normalized = normalize(text);
  return BANNED_TERMS.some((term) => new RegExp(`\\b${term}\\b`, "i").test(normalized));
}

function isBreedPaired(text: string) {
  const matches = Array.from(text.matchAll(BREED_PATTERN));
  if (matches.length === 0) return true;

  return matches.every((match) => {
    const index = match.index ?? 0;
    const window = text.slice(Math.max(0, index - 140), index + match[0].length + 140);
    return /lulu\s+da\s+pomer[ãa]nia/i.test(window) || /lulu\s+da\s+pomerania/i.test(normalize(window));
  });
}

function hasCernelhaViolation(text: string) {
  const regex = /cernelha/gi;
  for (const match of text.matchAll(regex)) {
    const snippet = text.slice(match.index ?? 0, (match.index ?? 0) + match[0].length + 20);
    if (!/cernelha\s*\(altura\)/i.test(snippet)) {
      return true;
    }
  }
  return false;
}
