"use client";
import React from 'react';

interface Props {
  value: string;
  onChange:(v:string)=>void;
  presets: string[];
  id?: string;
  error?: string;
  required?: boolean;
  label?: string;
  name?: string;
  placeholder?: string;
}

export function ColorSelector({ value, onChange, presets, id='color-selector', error, required, label='Cor', name='color', placeholder='Ex: Laranja' }:Props){
  const dataListId = id+'-datalist';
  return (
    <div className="grid gap-1" aria-live="polite">
      <label className="font-medium flex items-center gap-1" htmlFor={id}>{label} {required && <span className="text-[var(--error)]">*</span>}</label>
      <input
        id={id}
        name={name}
        value={value}
        list={dataListId}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error? id+'-error':undefined}
        onChange={e=> onChange(e.target.value)}
        className={`rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)] ${error? 'border-[var(--error)]':''}`}
      />
      <datalist id={dataListId}>{presets.map(c=> <option key={c} value={c} />)}</datalist>
      <div className="flex flex-wrap gap-1 pt-1" role="list" aria-label="Sugestões de cores">
        {presets.map(c=> (
          <button
            type="button"
            key={c}
            role="listitem"
            onClick={()=> onChange(c)}
            className={`px-2 py-1 rounded-md border text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${value===c? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]':'bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]'}`}
          >{c}</button>
        ))}
      </div>
      {error && <p id={id+'-error'} className="text-[11px] text-[var(--error)]">{error}</p>}
    </div>
  );
}
