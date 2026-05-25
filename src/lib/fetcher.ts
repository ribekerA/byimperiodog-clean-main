import type { ZodTypeAny, infer as ZodInfer } from "zod";

import { AppError } from "@/lib/errors";

export interface FetcherOptions<TSchema extends ZodTypeAny | undefined = undefined> extends RequestInit {
  timeoutMs?: number;
  schema?: TSchema;
}

export type FetcherResult<TSchema extends ZodTypeAny | undefined> = TSchema extends ZodTypeAny
  ? ZodInfer<TSchema>
  : unknown;

export async function fetcher<TSchema extends ZodTypeAny | undefined = undefined>(
  input: RequestInfo | URL,
  options: FetcherOptions<TSchema> = {},
): Promise<FetcherResult<TSchema>> {
  const { timeoutMs = 10_000, schema, ...init } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new AppError({
        code: response.status === 401 ? "AUTH" : response.status === 429 ? "RATE_LIMIT" : "UNKNOWN",
        message: `Request falhou (${response.status})`,
        details: { status: response.status, statusText: response.statusText },
      });
    }

    const text = await response.text();
    if (!text) return undefined as FetcherResult<TSchema>;

    const data = JSON.parse(text) as unknown;

    if (schema) {
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        throw new AppError({
          code: "VALIDATION",
          message: "Resposta do servidor não é válida.",
          details: parsed.error.flatten(),
        });
      }
      return parsed.data;
    }

    return data as FetcherResult<TSchema>;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError({
        code: "UNKNOWN",
        message: "Tempo limite atingido ao consultar o servidor.",
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

