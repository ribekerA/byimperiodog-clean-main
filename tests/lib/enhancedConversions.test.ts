import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { acceptAllConsent } from "@/lib/consent";
import { publicarTelefoneParaConversao, sha256Hex, telefoneE164 } from "@/lib/enhanced-conversions";

type Janela = { dataLayer?: unknown[] };

describe("conversões otimizadas", () => {
  beforeEach(() => {
    localStorage.clear();
    (window as unknown as Janela).dataLayer = [];
  });
  afterEach(() => localStorage.clear());

  it("normaliza o telefone para E.164 do Brasil", () => {
    expect(telefoneE164("11968633239")).toBe("+5511968633239");
    expect(telefoneE164("(11) 3333-4444")).toBe("+551133334444");
    expect(telefoneE164("123")).toBeNull();
  });

  it("gera o SHA-256 em hexadecimal", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("sem aceite de marketing não publica nada", async () => {
    expect(await publicarTelefoneParaConversao("11968633239")).toBe(false);
    expect((window as unknown as Janela).dataLayer).toEqual([]);
  });

  it("com aceite publica só o hash, nunca o número", async () => {
    acceptAllConsent();
    expect(await publicarTelefoneParaConversao("11968633239")).toBe(true);
    const camada = JSON.stringify((window as unknown as Janela).dataLayer);
    expect(camada).toContain(await sha256Hex("+5511968633239"));
    expect(camada).not.toContain("968633239");
  });
});
