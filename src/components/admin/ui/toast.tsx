"use client";

import { cva } from "class-variance-authority";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

export type AdminToastVariant = "success" | "error" | "info";
export type AdminToastOptions = { title: string; description?: string; variant?: AdminToastVariant; duration?: number };

type ToastPayload = AdminToastOptions & { id: string };

export function showAdminToast(options: AdminToastOptions) {
  if (typeof window !== "undefined") {
    const detail: ToastPayload = { id: crypto.randomUUID(), duration: 4000, variant: "info", ...options };
    window.dispatchEvent(new CustomEvent<ToastPayload>("admin:toast", { detail }));
  }
}

const toastVariants = cva(
  "pointer-events-auto min-w-[260px] rounded-xl border px-4 py-3 text-sm shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
  {
    variants: {
      variant: {
        success: "border-emerald-200 bg-emerald-50 text-emerald-900",
        error: "border-rose-200 bg-rose-50 text-rose-900",
        info: "border-slate-200 bg-white text-slate-800",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

export default function AdminToastViewport() {
  const [items, setItems] = useState<ToastPayload[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      setItems((prev) => [...prev, detail]);
      if (detail.duration) {
        setTimeout(() => setItems((prev) => prev.filter((item) => item.id !== detail.id)), detail.duration);
      }
    };

    window.addEventListener("admin:toast", handler);
    return () => window.removeEventListener("admin:toast", handler);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-2" aria-live="assertive">
      {items.map((toast) => (
        <div key={toast.id} className={cn(toastVariants({ variant: toast.variant }))}>
          <p className="font-semibold">{toast.title}</p>
          {toast.description ? <p className="mt-1 text-xs text-slate-600">{toast.description}</p> : null}
        </div>
      ))}
    </div>
  );
}
