// PATH: src/components/puppies/PriceInput.tsx
"use client";
import React from "react";

export interface PriceInputProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

function formatBRLInput(v: string) {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  const number = (parseInt(digits, 10) / 100).toFixed(2);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(number));
}

export function PriceInput({ value, onChange, error, id = "price_display", name = "price_display", placeholder = "R$ 7.500,00", label = "Preço (R$)", required }: PriceInputProps) {
  return (
    <div className="grid gap-1" aria-live="polite">
      <label htmlFor={id} className="font-medium">{label} {required && <span className="text-[var(--error)]">*</span>}</label>
      <input
        id={id}
        name={name}
        value={value}
        inputMode="decimal"
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? id + "-error" : undefined}
        onChange={(e) => onChange(formatBRLInput(e.target.value))}
        className={`rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)] ${error ? "border-[var(--error)]" : ""}`}
      />
      {error && (
        <p id={id + "-error"} className="text-[11px] text-[var(--error)]">{error}</p>
      )}
    </div>
  );
}

export default PriceInput;

