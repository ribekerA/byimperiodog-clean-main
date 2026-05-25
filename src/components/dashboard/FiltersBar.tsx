"use client";
import * as React from 'react';

export type DashboardFilters = { q: string; status: string; date: string };

export function FiltersBar({ value, onChange }:{ value:DashboardFilters; onChange:(next:DashboardFilters)=>void }){
  const { q, status, date } = value;
  const active = [q? {k:'q',v:q}:null, status? {k:'status',v:status}:null, date? {k:'date',v:date}:null].filter(Boolean) as {k:string;v:string}[];
  function clear(){ onChange({ q:'', status:'', date:'' }); }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <label className="sr-only" htmlFor="filter-q">Buscar</label>
        <input id="filter-q" value={q} onChange={e=>onChange({ ...value, q:e.target.value })} placeholder="Buscar..." className="w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" />
      </div>
      <div>
        <label className="sr-only" htmlFor="filter-status">Status</label>
        <select id="filter-status" value={status} onChange={e=>onChange({ ...value, status:e.target.value })} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40">
          <option value="">Status</option>
          <option value="published">Publicado</option>
          <option value="draft">Rascunho</option>
        </select>
      </div>
      <div>
        <label className="sr-only" htmlFor="filter-date">Data</label>
        <input id="filter-date" type="date" value={date} onChange={e=>onChange({ ...value, date:e.target.value })} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" />
      </div>
      {!!active.length && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map(a=> (
            <span key={a.k} className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-1 text-[11px] text-[var(--text)]">
              {a.k}: {a.v}
              <button className="ml-1 rounded px-1 text-[10px] underline" onClick={()=>{
                if(a.k==='q') onChange({ ...value, q:'' });
                if(a.k==='status') onChange({ ...value, status:'' });
                if(a.k==='date') onChange({ ...value, date:'' });
              }} aria-label={`Remover filtro ${a.k}`}>×</button>
            </span>
          ))}
          <button onClick={clear} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[12px] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Limpar filtros</button>
        </div>
      )}
    </div>
  );
}
