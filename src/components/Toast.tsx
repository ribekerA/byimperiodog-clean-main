"use client";

import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

type ToastAction = { label: string; callback: () => void | Promise<void> };
export type ToastVariant = "success" | "error" | "info" | "warning";
type ToastItem = {
  id: string;
  message: string;
  action?: ToastAction;
  duration?: number;
  variant?: ToastVariant;
};

let listeners: Array<(t: ToastItem) => void> = [];

export function showToast(
  message: string,
  opts?: { action?: ToastAction; duration?: number; variant?: ToastVariant }
) {
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  const item: ToastItem = {
    id,
    message,
    action: opts?.action,
    duration: opts?.duration,
    variant: opts?.variant ?? "info",
  };
  listeners.forEach((l) => l(item));
  return id;
}

export const toast = Object.assign(showToast, {
  success: (message: string, opts?: Omit<Parameters<typeof showToast>[1], "variant">) =>
    showToast(message, { ...opts, variant: "success" }),
  error: (message: string, opts?: Omit<Parameters<typeof showToast>[1], "variant">) =>
    showToast(message, { ...opts, variant: "error" }),
  info: (message: string, opts?: Omit<Parameters<typeof showToast>[1], "variant">) =>
    showToast(message, { ...opts, variant: "info" }),
  warning: (message: string, opts?: Omit<Parameters<typeof showToast>[1], "variant">) =>
    showToast(message, { ...opts, variant: "warning" }),
});

export function dismissToast(id: string) {
  listeners.forEach((l) => l({ id, message: "__dismiss__" } as any));
}

export default function ToastContainer({ max = 4 }: { max?: number }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeouts = useRef<Map<string, number>>(new Map());

  const variantStyles = useMemo(
    () => ({
      success: {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />,
        box: "border-emerald-200 bg-emerald-50",
        text: "text-emerald-900",
        role: "status" as const,
      },
      error: {
        icon: <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden />,
        box: "border-rose-200 bg-rose-50",
        text: "text-rose-900",
        role: "alert" as const,
      },
      info: {
        icon: <Info className="h-4 w-4 text-zinc-700" aria-hidden />,
        box: "border-zinc-200 bg-white",
        text: "text-zinc-900",
        role: "status" as const,
      },
      warning: {
        icon: <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />,
        box: "border-amber-200 bg-amber-50",
        text: "text-amber-900",
        role: "status" as const,
      },
    }),
    []
  );

  useEffect(() => {
    // copy reference to the Map so cleanup uses the same object
    const timeoutsMap = timeouts.current;

    const listener = (t: ToastItem) => {
      // dismissal signal
      if (t.message === "__dismiss__") {
        setToasts((s) => s.filter((x) => x.id !== t.id));
        const to = timeoutsMap.get(t.id);
        if (to) window.clearTimeout(to);
        timeoutsMap.delete(t.id);
        return;
      }
      // enqueue
      setToasts((s) => [t, ...s].slice(0, max));
      const dur = t.duration ?? 6000;
      const to = window.setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== t.id));
        timeoutsMap.delete(t.id);
      }, dur);
      timeoutsMap.set(t.id, to);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
      // clear all timeouts on unmount
      timeoutsMap.forEach((id) => window.clearTimeout(id));
      timeoutsMap.clear();
    };
  }, [max]);

  return (
    <div aria-live="polite" className="fixed right-4 bottom-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => {
        const v = t.variant ?? "info";
        const vs = (variantStyles as any)[v];
        return (
          <div
            key={t.id}
            role={vs.role}
            aria-atomic="true"
            className={`max-w-md rounded-lg border p-3 shadow-md flex items-start gap-3 ${vs.box}`}
          >
            <div className="mt-0.5" aria-hidden>
              {vs.icon}
            </div>
            <div className={`text-sm ${vs.text} flex-1`}>{t.message}</div>
            <div className="flex items-center gap-2">
              {t.action ? (
                <button
                  className="text-xs px-2 py-1 rounded border text-zinc-700 bg-white/70 hover:bg-white"
                  onClick={async () => {
                    try {
                      await t.action!.callback();
                    } catch {}
                    setToasts((s) => s.filter((x) => x.id !== t.id));
                    const to = timeouts.current.get(t.id);
                    if (to) window.clearTimeout(to);
                    timeouts.current.delete(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              ) : null}
              <button
                aria-label="Fechar aviso"
                className="rounded p-1 hover:bg-black/5"
                onClick={() => {
                  setToasts((s) => s.filter((x) => x.id !== t.id));
                  const to = timeouts.current.get(t.id);
                  if (to) window.clearTimeout(to);
                  timeouts.current.delete(t.id);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
