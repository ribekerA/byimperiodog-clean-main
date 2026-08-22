export class RequestBodyError extends Error {
  readonly status: 400 | 413;
  readonly code: "invalid_body" | "payload_too_large";

  constructor(
    message: string,
    options: { status: 400 | 413; code: "invalid_body" | "payload_too_large"; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = "RequestBodyError";
    this.status = options.status;
    this.code = options.code;
  }
}

export class UpstreamTimeoutError extends Error {
  constructor(readonly timeoutMs: number, readonly operation: string) {
    super(`${operation} excedeu o limite de ${timeoutMs} ms`);
    this.name = "UpstreamTimeoutError";
  }
}

function contentLength(request: Request): number | null {
  const raw = request.headers.get("content-length")?.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function payloadTooLarge(maxBytes: number) {
  return new RequestBodyError(`Payload excede o limite de ${maxBytes} bytes`, {
    status: 413,
    code: "payload_too_large",
  });
}

export function assertContentLength(request: Request, maxBytes: number) {
  const declared = contentLength(request);
  if (declared !== null && declared > maxBytes) throw payloadTooLarge(maxBytes);
}

async function readBodyBytes(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  assertContentLength(request, maxBytes);

  if (!request.body) {
    // Alguns testes e adaptadores server-side fornecem o contrato minimo de
    // Request (text/json), sem expor o ReadableStream em `body`.
    const textReader = (request as Request & { text?: () => Promise<string> }).text;
    if (typeof textReader !== "function") return new Uint8Array(0);
    const bytes = new TextEncoder().encode(await textReader.call(request));
    if (bytes.byteLength > maxBytes) throw payloadTooLarge(maxBytes);
    return bytes;
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("payload_too_large").catch(() => undefined);
        throw payloadTooLarge(maxBytes);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function readJsonWithLimit<T = unknown>(request: Request, maxBytes: number): Promise<T> {
  const bytes = await readBodyBytes(request, maxBytes);
  if (bytes.byteLength === 0) {
    throw new RequestBodyError("Corpo JSON ausente", { status: 400, code: "invalid_body" });
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch (cause) {
    throw new RequestBodyError("JSON invalido", { status: 400, code: "invalid_body", cause });
  }
}

export async function readFormDataWithLimit(request: Request, maxBytes: number): Promise<FormData> {
  const bytes = await readBodyBytes(request, maxBytes);

  try {
    const replay = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: bytes,
    });
    return await replay.formData();
  } catch (cause) {
    if (cause instanceof RequestBodyError) throw cause;
    throw new RequestBodyError("Formulario multipart invalido", {
      status: 400,
      code: "invalid_body",
      cause,
    });
  }
}

export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  operationName = "upstream",
): Promise<T> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new UpstreamTimeoutError(timeoutMs, operationName));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(controller.signal), timeout]);
  } catch (error) {
    if (controller.signal.aborted && !(error instanceof UpstreamTimeoutError)) {
      throw new UpstreamTimeoutError(timeoutMs, operationName);
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
