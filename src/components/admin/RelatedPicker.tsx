"use client";
import * as React from 'react';

const MOCK = [
  { id:'p1', title:'Cuidados com Spitz Alemão', slug:'/blog/cuidados-com-spitz' },
  { id:'p2', title:'Alimentação ideal para filhotes', slug:'/blog/alimentacao-filhotes' },
  { id:'p3', title:'Guia de vacinação', slug:'/blog/guia-vacinacao' },
];

export function RelatedPicker({ value, onChange }:{ value:string[]; onChange:(ids:string[])=>void }){
  const ids = new Set(value);
  function toggle(id:string){ const s=new Set(ids); s.has(id)? s.delete(id): s.add(id); onChange(Array.from(s)); }
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-2 text-sm font-medium">Links internos sugeridos</div>
      <ul className="space-y-2 text-sm">
        {MOCK.map(item=> (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <span className="truncate" title={item.title}>{item.title}</span>
            <label className="inline-flex items-center gap-2 text-[12px]"><input type="checkbox" checked={ids.has(item.id)} onChange={()=> toggle(item.id)} /><span>Adicionar</span></label>
          </li>
        ))}
      </ul>
    </div>
  );
}
