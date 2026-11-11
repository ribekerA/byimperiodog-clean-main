import { describe, expect, it } from "vitest";

import { buildLeadAdvisor } from "../../src/lib/ai/leadAdvisor";

const BASE = { id: "l1", name: "Ana Souza", preferredColor: "laranja", city: "Campinas", createdAt: "2026-11-01T12:00:00Z" };

function texts(input: Parameters<typeof buildLeadAdvisor>[0]) {
  const snapshot = buildLeadAdvisor(input);
  return [...snapshot.messages.map((message) => message.text), snapshot.loss.reactivationMessage];
}

describe("mensagens sugeridas de WhatsApp", () => {
  const withPuppy = texts({ ...BASE, matchedPuppy: { id: "p1", name: "Thor" } as never });
  const withoutPuppy = texts({ id: "l2" });

  it.each([...withPuppy, ...withoutPuppy])("não promete reserva nem condição com prazo: %s", (text) => {
    expect(text).not.toMatch(/separamos|separei|reservei|reservamos|condi[cç][oõ]es especiais|esta semana/i);
  });

  it.each([...withPuppy, ...withoutPuppy])("cita a raça com Lulu da Pomerânia e se apresenta: %s", (text) => {
    expect(text).toContain("Spitz Alemão (Lulu da Pomerânia)");
    expect(text).toContain("By Império Dog");
    expect(text).not.toMatch(/\b(voce|Ola|esta disponivel)\b/);
  });

  it("usa o nome, a cor e o filhote sugerido", () => {
    expect(withPuppy[0]).toBe(
      "Oi Ana! Aqui é da By Império Dog. Vi seu interesse em um Spitz Alemão (Lulu da Pomerânia) na cor laranja. Posso te mandar fotos do Thor agora?",
    );
    expect(withPuppy[2]).toContain("O Thor, nosso Spitz Alemão (Lulu da Pomerânia), combina");
    expect(withPuppy[3]).toContain("interesse no Spitz Alemão (Lulu da Pomerânia) laranja.");
  });

  it("sem filhote sugerido não afirma que algum está disponível hoje", () => {
    for (const text of withoutPuppy) expect(text).not.toMatch(/disponível hoje|undefined|null/);
    expect(withoutPuppy[0]).toContain("fotos dos filhotes disponíveis");
  });
});
