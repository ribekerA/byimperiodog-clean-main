"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/cn";

export function AdminDialog({ trigger, title, description, children }: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content className={cn(
          "fixed inset-0 z-[9999] m-auto flex w-full max-w-lg flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none",
        )}>
          <DialogPrimitive.Title className="text-lg font-semibold text-slate-900">
            {title}
          </DialogPrimitive.Title>
          {description ? <DialogPrimitive.Description className="text-sm text-slate-600">{description}</DialogPrimitive.Description> : null}
          <div>{children}</div>
          <DialogPrimitive.Close className="absolute right-4 top-4 text-sm text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2">
            Fechar
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
