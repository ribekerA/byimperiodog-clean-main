"use client";
import React from 'react';

export interface StatusOption { value:'disponivel'|'reservado'|'vendido'; label:string; desc?:string; }
interface Props { value: StatusOption['value']; onChange:(v:StatusOption['value'])=>void; options: StatusOption[]; id?:string; }

export function StatusToggleGroup({ value, onChange, options, id }:Props){
  return (
    <div role="group" aria-label="Status" className="flex gap-1 flex-wrap rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1" id={id}>
      {options.map(opt=> (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value===opt.value}
          title={opt.desc}
          onClick={()=> onChange(opt.value)}
          className={`px-2 py-1 rounded-md text-[11px] font-medium border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] transition ${value===opt.value? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]':'bg-transparent border-transparent hover:bg-[var(--surface)]'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
