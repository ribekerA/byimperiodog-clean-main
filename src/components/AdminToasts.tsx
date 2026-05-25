"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string; type?: "success" | "error" | "info" };

export default function AdminToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent).detail || {};
      const t: Toast = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        message: String(detail.message || ""),
        type: detail.type || "info",
      };
      setToasts((prev) => [...prev, t]);
      const ms = Number(detail.duration || 2500);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), ms);
    }
    window.addEventListener("toast", onToast as any);
    return () => window.removeEventListener("toast", onToast as any);
  }, []);

  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[280px] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            "pointer-events-auto rounded-xl px-3 py-2 text-sm shadow ring-1 " +
            (t.type === "success"
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : t.type === "error"
              ? "bg-rose-50 text-rose-800 ring-rose-200"
              : "bg-zinc-50 text-zinc-800 ring-zinc-200")
          }
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

