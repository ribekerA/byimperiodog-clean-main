"use client";
import React from 'react';

import { cn } from '../../lib/cn';

export interface Column<T>{ key: keyof T | string; header: string; width?:string; render?:(row:T)=>React.ReactNode; align?:'left'|'right'|'center'; sortable?:boolean; className?:string; }

interface Props<T>{ columns:Column<T>[]; data:T[]; loading?:boolean; onSort?:(key:string)=>void; sortKey?:string; sortDir?:'asc'|'desc'; empty?:React.ReactNode; }

export function DataTable<T extends { id:string|number }>({ columns, data, loading, onSort, sortKey, sortDir, empty }:Props<T>){
  return (
    <div className="relative overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full border-collapse text-sm" role="grid">
        <thead className="sticky top-0 z-10 bg-[var(--surface)] text-[var(--text-muted)] shadow-sm">
          <tr>
            {columns.map(col=>{ const active = sortKey===col.key; return (
              <th key={String(col.key)} scope="col" aria-sort={col.sortable && active? (sortDir==='asc'?'ascending':'descending'):'none'} className={cn('px-4 py-3 text-left font-medium', col.align==='right' && 'text-right', col.align==='center' && 'text-center', col.className)} style={{ width: col.width }}>
                {col.sortable? <button onClick={()=> onSort && onSort(String(col.key))} className={cn('inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]', active && 'text-[var(--text)]')}>
                  <span>{col.header}</span>
                  {active && <span className="text-[10px]">{sortDir==='asc'?'▲':'▼'}</span>}
                </button>: col.header}
              </th>
            ); })}
          </tr>
        </thead>
        <tbody>
          {(!loading && data.length===0) && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">{empty || 'Sem resultados para os filtros atuais.'}</td>
            </tr>
          )}
          {loading && Array.from({length:6}).map((_,i)=> (
            <tr key={i} className="animate-pulse">
              {columns.map(c=> <td key={String(c.key)} className="px-4 py-3"><div className="h-4 w-full rounded bg-[var(--surface-2)]" /></td>)}
            </tr>
          ))}
          {!loading && data.map(row=> (
            <tr key={String(row.id)} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] focus-within:bg-[var(--surface-2)]">
              {columns.map(c=> <td key={String(c.key)} className={cn('px-4 py-3 align-middle', c.align==='right' && 'text-right', c.align==='center' && 'text-center', c.className)}>{c.render? c.render(row) : (row as any)[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
