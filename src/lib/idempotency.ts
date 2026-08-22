import { createLogger } from "@/lib/logger";
import { hashRateLimitIdentifier } from "@/lib/rateLimitDurable";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("idempotency");
let lastWarningAt = 0;

export type IdempotencyBeginResult =
  | { state: "disabled"; storageKey: null }
  | { state: "acquired" | "in_progress"; storageKey: string }
  | { state: "completed"; storageKey: string; responseStatus: number; responseBody: unknown };

type BeginRpcRow = {
  state?: unknown;
  response_status?: unknown;
  response_body?: unknown;
};

type RpcClient = {
  rpc: (functionName: string, args: Record<string, unknown>) => Promise<{
    data: BeginRpcRow | BeginRpcRow[] | null;
    error: { message?: string; code?: string } | null;
  }>;
};

function warnFallback(error: unknown) {
  const now = Date.now();
  if (now - lastWarningAt < 60_000) return;
  lastWarningAt = now;
  const details = error && typeof error === "object" ? error as { message?: string; code?: string } : null;
  logger.warn("Idempotencia persistente indisponivel; requisicao seguira sem deduplicacao", {
    error: details?.message ?? String(error),
    code: details?.code,
  });
}

function rpcClient(): Partial<RpcClient> | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !hasServiceRoleKey()) return null;
  return supabaseAdmin() as unknown as Partial<RpcClient>;
}

export function readIdempotencyKey(request: Request): string | null {
  const key = request.headers.get("idempotency-key")?.trim();
  if (!key || key.length < 8 || key.length > 200) return null;
  return /^[a-zA-Z0-9._:-]+$/.test(key) ? key : null;
}

async function storageKey(scope: string, key: string) {
  return `${scope}:${await hashRateLimitIdentifier(key)}`;
}

export async function beginIdempotentRequest(
  scope: string,
  key: string | null,
): Promise<IdempotencyBeginResult> {
  if (!key) return { state: "disabled", storageKey: null };
  const client = rpcClient();
  if (!client || typeof client.rpc !== "function") return { state: "disabled", storageKey: null };

  const hashedKey = await storageKey(scope, key);
  try {
    const { data, error } = await client.rpc("begin_api_idempotent_request", {
      p_key: hashedKey,
      p_processing_seconds: 120,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !["acquired", "in_progress", "completed"].includes(String(row.state))) {
      throw new Error("Resposta invalida de begin_api_idempotent_request");
    }
    if (row.state === "completed") {
      return {
        state: "completed",
        storageKey: hashedKey,
        responseStatus: Number(row.response_status) || 200,
        responseBody: row.response_body,
      };
    }
    return { state: row.state as "acquired" | "in_progress", storageKey: hashedKey };
  } catch (error) {
    warnFallback(error);
    return { state: "disabled", storageKey: null };
  }
}

export async function completeIdempotentRequest(
  storageKey: string | null,
  responseStatus: number,
  responseBody: unknown,
) {
  if (!storageKey) return;
  const client = rpcClient();
  if (!client || typeof client.rpc !== "function") return;
  try {
    const { error } = await client.rpc("complete_api_idempotent_request", {
      p_key: storageKey,
      p_response_status: responseStatus,
      p_response_body: responseBody,
      p_ttl_seconds: 86_400,
    });
    if (error) throw error;
  } catch (error) {
    warnFallback(error);
  }
}

export async function releaseIdempotentRequest(storageKey: string | null) {
  if (!storageKey) return;
  const client = rpcClient();
  if (!client || typeof client.rpc !== "function") return;
  try {
    const { error } = await client.rpc("release_api_idempotent_request", { p_key: storageKey });
    if (error) throw error;
  } catch (error) {
    warnFallback(error);
  }
}
