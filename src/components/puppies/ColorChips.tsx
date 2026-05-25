// PATH: src/components/puppies/ColorChips.tsx
"use client";
import React from "react";

export interface ColorChipsProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
}

export function ColorChips({ value, options, onChange, id = "color", name = "color", placeholder = "Ex: Laranja", className = "" }: ColorChipsProps) {
  const dataListId = id + "-datalist";
  return (
    <div className={`grid gap-1 ${className}`} aria-live="polite">
      <label className="font-medium" htmlFor={id}>Cor</label>
      <input
        id={id}
        name={name}
        value={value}
        list={dataListId}
        placeholder={placeholder}
        aria-invalid={false}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]"
      />
      <datalist id={dataListId}>
        {options.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div className="flex flex-wrap gap-1 pt-1" role="radiogroup" aria-label="Sugestões de cores">
        {options.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value === c}
            onClick={() => onChange(c)}
            className={`px-2 py-1 rounded-md border text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${value === c ? "bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]" : "bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]"}`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ColorChips;
