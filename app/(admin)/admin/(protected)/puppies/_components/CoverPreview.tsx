"use client";
import React from 'react';
import Image from 'next/image';

interface Props {
  value: string;
  onChange:(v:string)=>void;
  id?: string;
  label?: string;
  error?: string;
  placeholder?: string;
}

export function CoverPreview({ value, onChange, id='image_url', label='Imagem (URL)', error, placeholder='https://... .png' }:Props){
  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        <label htmlFor={id} className="font-medium">{label}</label>
        <div className="flex gap-2">
          <input
            id={id}
            value={value}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error? id+'-error': id+'-hint'}
            onChange={e=> onChange(e.target.value)}
            className={`flex-1 rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)] ${error? 'border-[var(--error)]':''}`}
          />
          {value && (
            <button type="button" aria-label="Limpar imagem" onClick={()=> onChange('')} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-[11px] hover:bg-[var(--surface-2)]">Limpar</button>
          )}
        </div>
        {error && <p id={id+'-error'} className="text-[11px] text-[var(--error)]">{error}</p>}
      </div>
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center bg-[var(--surface-2)] relative">
        {value? <Image src={value} alt="Preview" fill className="object-cover" sizes="(max-width:768px) 100vw, 40vw" /> : <p id={id+'-hint'} className="text-[11px] text-[var(--text-muted)]">Pré-visualização da imagem</p>}
      </div>
    </div>
  );
}
