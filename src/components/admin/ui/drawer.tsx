"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/cn";

export function AdminDrawer({ trigger, title, children, side = "right" }: {
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode;
  side?: "left" | "right";
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-0 z-[9999] flex h-full w-full max-w-md flex-col gap-4 border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none",
            side === "right" ? "right-0" : "left-0",
          )}
        >
          <DialogPrimitive.Title className="text-lg font-semibold text-slate-900">{title}</DialogPrimitive.Title>
          <div className="flex-1 overflow-y-auto">{children}</div>
          <DialogPrimitive.Close className="absolute right-4 top-4 text-sm text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2">
            Fechar
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
