"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/cn";

export function AdminTooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={120}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            className={cn(
              "z-[9999] max-w-xs rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-lg",
              "data-[state=delayed-open]:animate-fade-in data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
            )}
            sideOffset={6}
          >
            {label}
            <TooltipPrimitive.Arrow className="fill-emerald-100" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// HelpTooltip variant with info icon
export function HelpTooltip({ content, side = "top" }: { content: string; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <AdminTooltip label={content} side={side}>
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-[10px] text-slate-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-emerald-400"
        aria-label="Ajuda"
      >
        ?
      </button>
    </AdminTooltip>
  );
}
