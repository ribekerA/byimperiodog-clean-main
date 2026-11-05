import { createHmac, timingSafeEqual } from "node:crypto";

const MIN_SECRET_BYTES = 32;

function secret(): string {
  const value = process.env.CONTRACT_LINK_SECRET?.trim() || "";
  if (Buffer.byteLength(value, "utf8") < MIN_SECRET_BYTES) {
    throw new Error("CONTRACT_LINK_SECRET deve ter pelo menos 32 bytes");
  }
  return value;
}

export function createContractAccessToken(code: string): string {
  return createHmac("sha256", secret()).update(`contract:${code.toUpperCase()}`, "utf8").digest("base64url");
}

export function verifyContractAccessToken(code: string, received: string | null | undefined): boolean {
  if (!received) return false;
  try {
    const expected = Buffer.from(createContractAccessToken(code), "utf8");
    const actual = Buffer.from(received, "utf8");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
