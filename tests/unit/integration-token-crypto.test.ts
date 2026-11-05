import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  decryptIntegrationToken,
  encryptIntegrationToken,
  isEncryptedIntegrationToken,
} from "@/lib/tracking/tokenCrypto";

const previousKey = process.env.INTEGRATIONS_ENCRYPTION_KEY;

describe("cifragem de tokens de integracao", () => {
  beforeEach(() => {
    process.env.INTEGRATIONS_ENCRYPTION_KEY = "chave-de-teste-com-mais-de-trinta-e-dois-bytes-2026";
  });

  afterEach(() => {
    if (previousKey === undefined) delete process.env.INTEGRATIONS_ENCRYPTION_KEY;
    else process.env.INTEGRATIONS_ENCRYPTION_KEY = previousKey;
  });

  it("cifra com nonce e recupera somente com autenticidade valida", () => {
    const first = encryptIntegrationToken("oauth-secret-token");
    const second = encryptIntegrationToken("oauth-secret-token");

    expect(first).not.toBe(second);
    expect(first).not.toContain("oauth-secret-token");
    expect(isEncryptedIntegrationToken(first)).toBe(true);
    expect(decryptIntegrationToken(first)).toBe("oauth-secret-token");

    const tampered = `${first.slice(0, -1)}${first.endsWith("A") ? "B" : "A"}`;
    expect(() => decryptIntegrationToken(tampered)).toThrow();
  });

  it("falha fechado para chave fraca e token legado em texto puro", () => {
    process.env.INTEGRATIONS_ENCRYPTION_KEY = "fraca";
    expect(() => encryptIntegrationToken("token")).toThrow(/32 bytes/);
    expect(() => decryptIntegrationToken("token-em-texto-puro")).toThrow(/reconectado/);
  });
});
