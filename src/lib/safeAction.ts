import type { ZodTypeAny, infer as ZodInfer } from "zod";

import { AppError, toAppError } from "@/lib/errors";
import { createLogger, type Logger } from "@/lib/logger";

type SafeActionHandler<TSchema extends ZodTypeAny, TResult> = (
  input: ZodInfer<TSchema>,
  context: { req: Request },
) => Promise<TResult>;

interface SafeActionOptions<TSchema extends ZodTypeAny, TResult> {
  schema: TSchema;
  handler: SafeActionHandler<TSchema, TResult>;
  logger?: Logger;
}

export function safeAction<TSchema extends ZodTypeAny, TResult>({
  schema,
  handler,
  logger = createLogger("safeAction"),
}: SafeActionOptions<TSchema, TResult>) {
  return async function execute(req: Request): Promise<TResult> {
    let payload: unknown;

    try {
      payload = await req.json();
    } catch (error) {
      logger.warn("Falha ao converter request body em JSON", { error: String(error) });
      throw new AppError({
        code: "VALIDATION",
        message: "JSON inválido recebido.",
        cause: error,
      });
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      logger.warn("Payload inválido detectado", {
        issues: parsed.error.issues,
      });
      throw new AppError({
        code: "VALIDATION",
        message: "Os dados enviados não passaram na validação.",
        details: parsed.error.flatten(),
      });
    }

    try {
      return await handler(parsed.data, { req });
    } catch (error) {
      const appError = toAppError(error);
      if (appError.code === "UNKNOWN") {
        logger.error("Erro inesperado em safeAction", { error: String(error) });
      } else {
        logger.warn("Erro controlado em safeAction", { code: appError.code, message: appError.message });
      }
      throw appError;
    }
  };
}

