import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createContractAccessToken, verifyContractAccessToken } from "@/lib/contractAccess";

const previousSecret = process.env.CONTRACT_LINK_SECRET;

describe("acesso privado a contratos", () => {
  beforeEach(() => {
    process.env.CONTRACT_LINK_SECRET = "segredo-de-teste-de-contrato-com-mais-de-32-bytes";
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.CONTRACT_LINK_SECRET;
    else process.env.CONTRACT_LINK_SECRET = previousSecret;
  });

  it("vincula o token ao código exato e rejeita adulteração", () => {
    const code = "0123456789ABCDEF0123456789ABCDEF";
    const token = createContractAccessToken(code);
    expect(token).not.toContain(code);
    expect(verifyContractAccessToken(code, token)).toBe(true);
    expect(verifyContractAccessToken("1123456789ABCDEF0123456789ABCDEF", token)).toBe(false);
    expect(verifyContractAccessToken(code, `${token}x`)).toBe(false);
  });

  it("falha fechado sem segredo forte", () => {
    process.env.CONTRACT_LINK_SECRET = "fraco";
    expect(() => createContractAccessToken("ABCDEF123456")).toThrow(/32 bytes/);
    expect(verifyContractAccessToken("ABCDEF123456", "qualquer")).toBe(false);
  });
});
