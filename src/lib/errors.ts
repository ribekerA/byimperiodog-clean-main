import { NextResponse } from "next/server";

import { MENSAGEM_ERRO_PUBLICA } from "@/lib/apiErro";

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

  // VALIDATION, AUTH, CONFLICT e RATE_LIMIT sao levantados por nos, com texto
  // escrito para quem chamou: podem ir inteiros. UNKNOWN e o balde onde cai
  // qualquer excecao -- inclusive erro do Postgres, com nome de tabela e de
  // coluna dentro. Esse fica no log e vira frase generica na resposta.
  if (appError.code === "UNKNOWN") {
    console.error("[api]", `${appError.name}: ${appError.message}`);
    return NextResponse.json(
      { ok: false, error: MENSAGEM_ERRO_PUBLICA, code: appError.code, details: null },
      { status: appError.status },
    );
  }

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

