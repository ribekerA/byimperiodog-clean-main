// PATH: src/components/puppies/StatusToggle.tsx
"use client";
import React from "react";

type StatusValue = "disponivel" | "reservado" | "vendido";

const DEFAULT_OPTIONS: Array<{ value: StatusValue; label: string; desc: string }>= [
  { value: "disponivel", label: "Disponível", desc: "Visível para venda" },
  { value: "reservado", label: "Reservado", desc: "Sinal recebido / aguardando" },
  { value: "vendido", label: "Vendido", desc: "Contrato fechado" },
];

export interface StatusToggleProps {
  value: StatusValue;
  onChange: (v: StatusValue) => void;
  id?: string;
  className?: string;
}

export function StatusToggle({ value, onChange, id, className="" }: StatusToggleProps){
  return (
    <div
      role="group"
      aria-label="Status"
      id={id}
      className={`flex flex-wrap gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1 ${className}`}
    >
      {DEFAULT_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          title={opt.desc}
          onClick={() => onChange(opt.value)}
          className={`px-2 py-1 rounded-md text-[11px] font-medium border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] transition ${value===opt.value? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]':'bg-transparent border-transparent hover:bg-[var(--surface)]'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default StatusToggle;

