type LogLevel = "debug" | "info" | "warn" | "error";

const CONSOLE_METHOD: Record<LogLevel, keyof Console> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const ENV_LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

export interface Logger {
  scope: string;
  correlationId: string;
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
  child: (extension: string, context?: Record<string, unknown>) => Logger;
}

function shouldLog(level: LogLevel) {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[ENV_LOG_LEVEL];
}

const SENSITIVE_KEY = /(?:authorization|cookie|password|passwd|secret|token|credential|cpf|\brg\b|email|phone|telefone|whatsapp|endereco|address|payload|body)/i;

function redactString(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/([?&](?:token|code|secret|key|password)=)[^&#\s]+/gi, "$1[REDACTED]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    .replace(/\b\d{3}[.-]?\d{3}[.-]?\d{3}-?\d{2}\b/g, "[REDACTED_CPF]")
    .replace(/(?:\+?55\s*)?(?:\(?\d{2}\)?[\s.-]*)?9?\d{4}[\s.-]?\d{4}\b/g, "[REDACTED_PHONE]");
}

function sanitize(value: unknown, key = "", depth = 0): unknown {
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (depth > 4) return "[TRUNCATED]";
  if (typeof value === "string") return redactString(value).slice(0, 2_000);
  if (typeof value === "number" || typeof value === "boolean" || value == null) return value;
  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message).slice(0, 1_000) };
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, key, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 50)
        .map(([entryKey, entryValue]) => [entryKey, sanitize(entryValue, entryKey, depth + 1)]),
    );
  }
  return String(value).slice(0, 500);
}

function emitLog(
  level: LogLevel,
  scope: string,
  correlationId: string,
  message: string,
  context?: Record<string, unknown>,
) {
  if (!shouldLog(level)) return;

  const payload = {
    level,
    scope,
    correlationId,
    message,
    timestamp: new Date().toISOString(),
    ...((sanitize(context ?? {}) as Record<string, unknown>)),
  };

  const method = CONSOLE_METHOD[level] ?? "log";
  // eslint-disable-next-line no-console
  const logFn = console[method] as (message: string) => void;

  logFn(JSON.stringify(payload));
}

export function createLogger(
  scope: string,
  correlationId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
  baseContext?: Record<string, unknown>,
): Logger {
  const scopedBase = { ...(baseContext ?? {}) };

  function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    emitLog(level, scope, correlationId, message, { ...scopedBase, ...(context ?? {}) });
  }

  return {
    scope,
    correlationId,
    debug: (message, context) => log("debug", message, context),
    info: (message, context) => log("info", message, context),
    warn: (message, context) => log("warn", message, context),
    error: (message, context) => log("error", message, context),
    child: (extension: string, context?: Record<string, unknown>) =>
      createLogger(`${scope}:${extension}`, correlationId, { ...scopedBase, ...(context ?? {}) }),
  };
}

export function resolveCorrelationId(headers?: Headers) {
  if (!headers) return undefined;
  const direct = headers.get("x-correlation-id")?.trim();
  if (direct) return direct;
  const requestId = headers.get("x-request-id")?.trim();
  if (requestId) return requestId;
  return undefined;
}
