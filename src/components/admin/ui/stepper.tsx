"use client";

import { cn } from "@/lib/cn";

type Step = {
  id: string;
  title: string;
};

type StepperProps = {
  steps: readonly Step[];
  currentStep: number;
  onStepChange?: (index: number) => void;
};

export default function Stepper({ steps, currentStep, onStepChange }: StepperProps) {
  return (
    <ol className="flex flex-wrap items-center gap-3" role="list">
      {steps.map((step, index) => {
        const state = index === currentStep ? "active" : index < currentStep ? "completed" : "pending";
        return (
          <li key={step.id} className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                state === "completed" && "border-emerald-500 bg-emerald-500 text-white",
                state === "active" && "border-emerald-500 text-emerald-700",
                state === "pending" && "border-slate-200 text-slate-400",
              )}
              onClick={() => onStepChange?.(index)}
              aria-current={state === "active" ? "step" : undefined}
              aria-label={`Etapa ${index + 1}: ${step.title}`}
            >
              {index + 1}
            </button>
            <span className="text-sm font-medium text-slate-600">{step.title}</span>
            {index < steps.length - 1 ? <span className="mx-2 h-px w-12 bg-slate-200" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}
