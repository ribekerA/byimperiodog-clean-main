// @vitest-environment node
// happy-dom aplica a lista de headers proibidos do fetch e descarta cookie,
// origin e sec-fetch-site na construcao do Request. Este e codigo de servidor:
// precisa do ambiente node, onde os headers chegam como chegariam de verdade.
/**
 * O segredo interno estava escrito no repositorio: a frase
 * `byid-internal-v1-2025` e o SHA-256 dela viviam em src/lib/internalAuth.ts.
 * Quem lesse o codigo disparava reindexacao e geracao de embeddings.
 *
 * O primeiro teste existe so para garantir que a frase antiga nunca mais
 * autentique nada.
 */
import { afterEach, describe, expect, it } from "vitest";

import { verifyInternalToken } from "@/lib/internalAuth";

const FRASE_ANTIGA = "byid-internal-v1-2025";
const HASH_ANTIGO = "8ffa8b33008ae698052eb58047d47a78f7b3db6228b22a76131db07b730a9215";
const SEGREDO = "segredo-interno-de-teste-com-tamanho-ok-2026";

afterEach(() => {
  delete process.env.INTERNAL_API_SECRET;
});

describe("verifyInternalToken", () => {
  it("recusa a frase que estava versionada no codigo", () => {
    process.env.INTERNAL_API_SECRET = SEGREDO;
    expect(verifyInternalToken(FRASE_ANTIGA)).toBe(false);
    expect(verifyInternalToken(HASH_ANTIGO)).toBe(false);
  });

  it("recusa tudo quando INTERNAL_API_SECRET nao esta configurado", () => {
    expect(verifyInternalToken("qualquer-coisa")).toBe(false);
    expect(verifyInternalToken(SEGREDO)).toBe(false);
  });

  it("recusa segredo curto demais para ser chave", () => {
    process.env.INTERNAL_API_SECRET = "curto";
    expect(verifyInternalToken("curto")).toBe(false);
  });

  it("recusa token ausente ou vazio", () => {
    process.env.INTERNAL_API_SECRET = SEGREDO;
    expect(verifyInternalToken(null)).toBe(false);
    expect(verifyInternalToken(undefined)).toBe(false);
    expect(verifyInternalToken("")).toBe(false);
  });

  it("recusa token errado do mesmo tamanho", () => {
    process.env.INTERNAL_API_SECRET = SEGREDO;
    const errado = SEGREDO.slice(0, -1) + "X";
    expect(verifyInternalToken(errado)).toBe(false);
  });

  it("aceita o segredo configurado", () => {
    process.env.INTERNAL_API_SECRET = SEGREDO;
    expect(verifyInternalToken(SEGREDO)).toBe(true);
  });
});

describe("internalGuard", () => {
  it("recusa requisicao sem sessao e sem segredo", async () => {
    const { internalGuard } = await import("@/lib/internalAuth");
    const req = new Request("https://byimperiodog.com.br/api/search/reindex", { method: "POST" });
    expect(await internalGuard(req)).toBe(false);
  });

  it("recusa a frase antiga no header x-internal-token", async () => {
    process.env.INTERNAL_API_SECRET = SEGREDO;
    const { internalGuard } = await import("@/lib/internalAuth");
    const req = new Request("https://byimperiodog.com.br/api/search/reindex", {
      method: "POST",
      headers: { "x-internal-token": FRASE_ANTIGA },
    });
    expect(await internalGuard(req)).toBe(false);
  });

  it("aceita o segredo configurado no header", async () => {
    process.env.INTERNAL_API_SECRET = SEGREDO;
    const { internalGuard } = await import("@/lib/internalAuth");
    const req = new Request("https://byimperiodog.com.br/api/search/reindex", {
      method: "POST",
      headers: { "x-internal-token": SEGREDO },
    });
    expect(await internalGuard(req)).toBe(true);
  });
});
