import { NextResponse } from "next/server";

import { createLogger } from "@/lib/logger";
import { getRequestFingerprint } from "@/lib/limiter";
import { rateLimit } from "@/lib/rateLimit";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("rate-limit");
let lastBackendWarningAt = 0;

export interface DurableRateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  source: "supabase" | "memory";
}

export interface DurableRateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RequestRateLimitOptions {
  scope: string;
  limit: number;
  windowMs: number;
  identifier?: string;
}

type RpcRow = {
  allowed?: unknown;
  remaining?: unknown;
  reset_at?: unknown;
};

type RpcClient = {
  rpc: (
    functionName: string,
    args: { p_key: string; p_limit: number; p_window_seconds: number },
  ) => Promise<{ data: RpcRow | RpcRow[] | null; error: { message?: string; code?: string } | null }>;
};

function warnBackendFallback(error: unknown) {
  const now = Date.now();
  if (now - lastBackendWarningAt < 60_000) return;
  lastBackendWarningAt = now;
  const details = error && typeof error === "object" ? error as { message?: string; code?: string } : null;
  logger.warn("Limiter persistente indisponivel; usando memoria local", {
    error: details?.message ?? String(error),
    code: details?.code,
  });
}

function memoryFallback(options: DurableRateLimitOptions): DurableRateLimitResult {
  const result = rateLimit(`durable-fallback:${options.key}`, options.limit, options.windowMs);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    limit: options.limit,
    resetAt: Date.parse(result.reset),
    source: "memory",
  };
}

function normalizeRpcResult(data: RpcRow | RpcRow[] | null, limit: number): DurableRateLimitResult | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.allowed !== "boolean") return null;
  const remaining = Number(row.remaining);
  const resetAt = typeof row.reset_at === "string" ? Date.parse(row.reset_at) : Number(row.reset_at);
  if (!Number.isFinite(remaining) || !Number.isFinite(resetAt)) return null;
  return {
    allowed: row.allowed,
    remaining: Math.max(0, Math.floor(remaining)),
    limit,
    resetAt,
    source: "supabase",
  };
}

function fallbackHash(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export async function hashRateLimitIdentifier(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return fallbackHash(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function consumeDurableRateLimit(
  options: DurableRateLimitOptions,
): Promise<DurableRateLimitResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !hasServiceRoleKey()) {
    return memoryFallback(options);
  }

  try {
    const client = supabaseAdmin() as unknown as Partial<RpcClient>;
    if (typeof client.rpc !== "function") return memoryFallback(options);
    const { data, error } = await client.rpc("consume_api_rate_limit", {
      p_key: options.key,
      p_limit: options.limit,
      p_window_seconds: Math.max(1, Math.ceil(options.windowMs / 1000)),
    });
    if (error) throw error;
    const normalized = normalizeRpcResult(data, options.limit);
    if (!normalized) throw new Error("Resposta invalida de consume_api_rate_limit");
    return normalized;
  } catch (error) {
    warnBackendFallback(error);
    return memoryFallback(options);
  }
}

export async function rateLimitRequest(
  request: Request,
  options: RequestRateLimitOptions,
): Promise<DurableRateLimitResult> {
  const identifier = options.identifier ?? getRequestFingerprint(request);
  const identifierHash = await hashRateLimitIdentifier(identifier.slice(0, 512));
  return consumeDurableRateLimit({
    key: `${options.scope}:${identifierHash}`,
    limit: options.limit,
    windowMs: options.windowMs,
  });
}

export function rateLimitRequestMemory(
  request: Request,
  options: RequestRateLimitOptions,
): DurableRateLimitResult {
  const identifier = options.identifier ?? getRequestFingerprint(request);
  return memoryFallback({
    key: `memory:${options.scope}:${identifier.slice(0, 512)}`,
    limit: options.limit,
    windowMs: options.windowMs,
  });
}

export function tooManyRequests(
  result: DurableRateLimitResult,
  message = "Muitas tentativas. Aguarde um momento e tente novamente.",
) {
  const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: message, retryAfterSec },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}
