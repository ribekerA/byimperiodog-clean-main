"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

import { cn } from "@/lib/cn";

import { AdminButton } from "./button";

export function AdminErrorState({
  title = "Erro ao carregar",
  description = "Não foi possível carregar os dados. Tente novamente.",
  onRetry,
  error,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  error?: Error | string;
  className?: string;
}) {
  const errorMessage = typeof error === "string" ? error : error?.message;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 px-6 py-12 text-center",
        className,
      )}
    >
      <AlertTriangle className="h-12 w-12 text-red-400" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-semibold text-red-700">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      {errorMessage ? (
        <pre className="mt-3 max-w-md overflow-auto rounded-lg bg-white px-3 py-2 text-left text-xs text-red-600">
          {errorMessage}
        </pre>
      ) : null}
      {onRetry ? (
        <AdminButton onClick={onRetry} variant="primary" className="mt-6">
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          <span>Tentar novamente</span>
        </AdminButton>
      ) : null}
    </div>
  );
}
