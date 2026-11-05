import { afterEach, describe, expect, it, vi } from "vitest";

import { createLogger } from "@/lib/logger";

describe("redação automática de logs", () => {
  afterEach(() => vi.restoreAllMocks());

  it("remove segredos, PII e credenciais dentro de URLs", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    createLogger("test", "correlation-id").error("falha", {
      access_token: "oauth-super-secret",
      email: "cliente@example.com",
      nested: { authorization: "Bearer abc.def.ghi" },
      error: "Falhou em https://site.test/callback?code=segredo123&state=ok para pessoa@example.com, CPF 529.982.247-25, telefone (11) 98765-4321",
    });

    const serialized = String(spy.mock.calls[0]?.[0]);
    expect(serialized).not.toContain("oauth-super-secret");
    expect(serialized).not.toContain("cliente@example.com");
    expect(serialized).not.toContain("abc.def.ghi");
    expect(serialized).not.toContain("segredo123");
    expect(serialized).not.toContain("pessoa@example.com");
    expect(serialized).not.toContain("529.982.247-25");
    expect(serialized).not.toContain("98765-4321");
    expect(serialized).toContain("[REDACTED]");
  });
});
