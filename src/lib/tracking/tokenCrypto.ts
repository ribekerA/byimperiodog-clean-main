import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "enc:v1";
const AAD = Buffer.from("by-imperio-dog:integrations:v1", "utf8");
const MIN_SECRET_BYTES = 32;

function encryptionKey(): Buffer {
  const secret = process.env.INTEGRATIONS_ENCRYPTION_KEY?.trim() || "";
  const secretBytes = Buffer.from(secret, "utf8");
  if (secretBytes.byteLength < MIN_SECRET_BYTES) {
    throw new Error("INTEGRATIONS_ENCRYPTION_KEY deve ter pelo menos 32 bytes");
  }
  return createHash("sha256").update(secretBytes).digest();
}

export function isEncryptedIntegrationToken(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(`${PREFIX}:`);
}

export function encryptIntegrationToken(value: string): string {
  if (!value) throw new Error("Token de integracao vazio");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(AAD);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

export function decryptIntegrationToken(value: string): string {
  const parts = value.split(":");
  if (parts.length !== 5 || `${parts[0]}:${parts[1]}` !== PREFIX) {
    throw new Error("Token de integracao legado precisa ser reconectado");
  }
  const iv = Buffer.from(parts[2], "base64url");
  const tag = Buffer.from(parts[3], "base64url");
  const ciphertext = Buffer.from(parts[4], "base64url");
  if (iv.byteLength !== 12 || tag.byteLength !== 16 || ciphertext.byteLength === 0) {
    throw new Error("Token de integracao invalido");
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAAD(AAD);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
