"use client";
import React, { useMemo } from 'react';

import { parseBRLToCents } from '@/lib/price';

interface Props {
  value: string;
  onChange:(v:string)=>void;
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  name?: string;
}

function formatBRLInput(v:string){
  const digits=v.replace(/\D/g,'');
  if(!digits) return '';
  const number = (parseInt(digits,10)/100).toFixed(2);
  return new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL'}).format(Number(number));
}

export function PriceInputMasked({ value, onChange, id='price', label='Preço (R$)', required, error, placeholder='R$ 7.500,00', name='price_display' }:Props){
  const cents = useMemo(()=> parseBRLToCents(value),[value]);
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
        aria-describedby={error? id+'-error': id+'-hint'}
        onChange={e=> onChange(formatBRLInput(e.target.value))}
        className={`rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)] ${error? 'border-[var(--error)]':''}`}
      />
      {error ? (
        <p id={id+'-error'} className="text-[11px] text-[var(--error)]">{error}</p>
      ):(
        <p id={id+'-hint'} className="text-[11px] text-[var(--text-muted)]">Centavos: {cents.toLocaleString('pt-BR')}¢</p>
      )}
    </div>
  );
}
