import { NextResponse } from "next/server";

export type AppErrorCode = "VALIDATION" | "AUTH" | "CONFLICT" | "RATE_LIMIT" | "UNKNOWN";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  VALIDATION: 422,
  AUTH: 401,
  CONFLICT: 409,
  RATE_LIMIT: 429,
  UNKNOWN: 500,
};

export interface AppErrorParams {
  code: AppErrorCode;
  message: string;
  status?: number;
  details?: unknown;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor({ code, message, status, details, cause }: AppErrorParams) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status ?? STATUS_BY_CODE[code] ?? 500;
    this.details = details;
    if (cause) {
      this.cause = cause;
    }
  }
}

export function toAppError(error: unknown, fallbackMessage = "Erro interno inesperado"): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof Error) {
    return new AppError({
      code: "UNKNOWN",
      message: error.message || fallbackMessage,
      cause: error,
    });
  }

  return new AppError({
    code: "UNKNOWN",
    message: fallbackMessage,
    details: error,
  });
}

export function respondWithError(error: unknown) {
  const appError = toAppError(error);
  return NextResponse.json(
    {
      ok: false,
      error: appError.message,
      code: appError.code,
      details: appError.details ?? null,
    },
    { status: appError.status },
  );
}

