import { isAdminRole, type AdminRole } from "@/lib/rbac";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 4;
export const ADMIN_SESSION_VERSION = 1;
const ADMIN_SESSION_ISSUER = "by-imperio-dog";
const ADMIN_SESSION_AUDIENCE = "admin";
const MIN_SECRET_BYTES = 32;

export type AdminSessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  version: typeof ADMIN_SESSION_VERSION;
  issuer: typeof ADMIN_SESSION_ISSUER;
  audience: typeof ADMIN_SESSION_AUDIENCE;
  jti: string;
  iat: number;
  exp: number;
};

export type AdminSessionClaims = Pick<AdminSessionPayload, "userId" | "email" | "name" | "role">;

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || new TextEncoder().encode(secret).byteLength < MIN_SECRET_BYTES) {
    throw new Error("ADMIN_SESSION_SECRET deve ter pelo menos 32 bytes.");
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signAdminSession(payload: AdminSessionClaims): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const full: AdminSessionPayload = {
    ...payload,
    version: ADMIN_SESSION_VERSION,
    issuer: ADMIN_SESSION_ISSUER,
    audience: ADMIN_SESSION_AUDIENCE,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE,
  };
  const body = base64url(new TextEncoder().encode(JSON.stringify(full)));
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return `${body}.${base64url(signature)}`;
}

export async function verifyAdminSession(token: string | undefined | null): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const key = await getSigningKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToBytes(signature) as BufferSource,
      new TextEncoder().encode(body)
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(body))) as unknown;
    if (!isValidAdminSessionPayload(payload)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isValidAdminSessionPayload(value: unknown): value is AdminSessionPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  const now = Math.floor(Date.now() / 1000);
  if (payload.version !== ADMIN_SESSION_VERSION) return false;
  if (payload.issuer !== ADMIN_SESSION_ISSUER || payload.audience !== ADMIN_SESSION_AUDIENCE) return false;
  if (typeof payload.userId !== "string" || payload.userId.length < 1 || payload.userId.length > 128) return false;
  if (typeof payload.email !== "string" || payload.email.length > 254 || !payload.email.includes("@")) return false;
  if (typeof payload.name !== "string" || payload.name.length < 1 || payload.name.length > 120) return false;
  if (!isAdminRole(payload.role)) return false;
  if (typeof payload.jti !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.jti)) return false;
  if (typeof payload.iat !== "number" || typeof payload.exp !== "number") return false;
  if (!Number.isInteger(payload.iat) || !Number.isInteger(payload.exp)) return false;
  if (payload.iat > now + 60 || payload.exp <= now) return false;
  if (payload.exp <= payload.iat || payload.exp - payload.iat > ADMIN_SESSION_MAX_AGE) return false;
  return true;
}
