import { createHash, createHmac } from "node:crypto";

import { createLogger } from "@/lib/logger";
import { rateLimit, resetRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const WINDOW_MS = 15 * 60_000;
const WINDOW_SECONDS = WINDOW_MS / 1000;
const BLOCK_SECONDS = 15 * 60;
const IP_LIMIT = 20;
const EMAIL_LIMIT = 5;
const logger = createLogger("admin:login-throttle");

type KeyConfig = { hash: string; localKey: string; limit: number };
export type AdminLoginThrottleResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  distributed: boolean;
};

function requestIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function hashes(req: Request, email: string): KeyConfig[] {
  const secret = process.env.ADMIN_LOGIN_THROTTLE_SECRET || process.env.ADMIN_SESSION_SECRET || "";
  const values = [
    { type: "ip", value: requestIp(req), limit: IP_LIMIT },
    { type: "email", value: email.trim().toLowerCase(), limit: EMAIL_LIMIT },
  ];
  return values.map(({ type, value, limit }) => {
    const localHash = createHash("sha256").update(`${type}:${value}`).digest("hex");
    const hash = secret.length >= 32
      ? createHmac("sha256", secret).update(`${type}:${value}`).digest("hex")
      : localHash;
    return { hash, localKey: `admin-login:${type}:${localHash}`, limit };
  });
}

export async function consumeAdminLoginAttempt(
  req: Request,
  email: string,
): Promise<AdminLoginThrottleResult> {
  const keys = hashes(req, email);
  let retryAfterSeconds = 0;

  for (const key of keys) {
    const local = rateLimit(key.localKey, key.limit, WINDOW_MS);
    if (!local.allowed) {
      retryAfterSeconds = Math.max(
        retryAfterSeconds,
        Math.max(1, Math.ceil((new Date(local.reset).getTime() - Date.now()) / 1000)),
      );
    }
  }
  if (retryAfterSeconds > 0) return { allowed: false, retryAfterSeconds, distributed: false };

  try {
    const client = supabaseAdmin() as unknown as {
      rpc: (name: string, args: Record<string, unknown>) => Promise<{
        data: Array<{ allowed: boolean; retry_after_seconds: number }> | null;
        error: { message?: string } | null;
      }>;
    };
    for (const key of keys) {
      const { data, error } = await client.rpc("consume_admin_login_attempt", {
        p_key_hash: key.hash,
        p_limit: key.limit,
        p_window_seconds: WINDOW_SECONDS,
        p_block_seconds: BLOCK_SECONDS,
      });
      if (error) throw new Error(error.message || "admin login throttle RPC failed");
      const decision = data?.[0];
      if (decision && !decision.allowed) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, decision.retry_after_seconds || BLOCK_SECONDS),
          distributed: true,
        };
      }
    }
    return { allowed: true, retryAfterSeconds: 0, distributed: true };
  } catch (error) {
    // A migração pode ainda não ter sido aplicada no primeiro deploy. A camada
    // local continua ativa e o Supabase Auth mantém o rate limit próprio.
    logger.warn("Throttle distribuido indisponivel; usando limite local", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { allowed: true, retryAfterSeconds: 0, distributed: false };
  }
}

export async function clearAdminLoginAttempts(req: Request, email: string): Promise<void> {
  const keys = hashes(req, email);
  for (const key of keys) resetRateLimit(key.localKey);
  try {
    const client = supabaseAdmin() as unknown as {
      rpc: (name: string, args: Record<string, unknown>) => Promise<unknown>;
    };
    await Promise.all(
      keys.map((key) => client.rpc("clear_admin_login_attempt", { p_key_hash: key.hash })),
    );
  } catch {
    // Limpeza é otimização após autenticação válida; não pode invalidar login.
  }
}
