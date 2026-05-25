"use client";
import Link from 'next/link';
import * as React from 'react';

import { adminFetch } from '@/lib/adminFetch';

import type { DashboardFilters } from './FiltersBar';

type Item = { id:string; title:string; slug:string; status:string; created_at?:string|null; published_at?:string|null };

export function DataTable({ filters }:{ filters:DashboardFilters }){
  const [items,setItems] = React.useState<Item[]>([]);
  const [total,setTotal] = React.useState(0);
  const [page,setPage] = React.useState(1);
  const [perPage] = React.useState(10);
  const [loading,setLoading] = React.useState(false);
  const [error,setError] = React.useState<string|null>(null);
  const [sort,setSort] = React.useState<'asc'|'desc'>('desc');

  const load = React.useCallback(async ()=>{
    try{
      setLoading(true); setError(null);
      const params = new URLSearchParams();
      if(filters.q) params.set('q', filters.q);
      if(filters.status) params.set('status', filters.status);
      if(filters.date) params.set('date', filters.date);
      params.set('page', String(page));
      params.set('perPage', String(perPage));
      const r = await adminFetch(`/api/admin/blog?${params.toString()}`, { cache:'no-store' });
      const j = await r.json().catch(()=>null);
      if(!r.ok) throw new Error(j?.error || 'Falha ao buscar conteúdo');
      const list = (j?.items||[]) as Item[];
      setItems(list);
      setTotal(j?.total||0);
    }catch(e: unknown){
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
    finally{ setLoading(false); }
  }, [filters.q, filters.status, filters.date, page, perPage]);

  React.useEffect(()=>{ setPage(1); }, [filters.q, filters.status, filters.date]);
  React.useEffect(()=>{ load(); }, [load]);

  const sorted = React.useMemo(()=> {
    return [...items].sort((a,b)=> sort==='asc'? (a.title||'').localeCompare(b.title||'') : (b.title||'').localeCompare(a.title||''));
  }, [items,sort]);

  const isEmpty = !loading && items.length===0;
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-[12px] text-[var(--text-muted)]">
        <div aria-live="polite">{loading? 'Carregando...' : error? `Erro: ${error}` : `${total} itens`}</div>
        <div className="flex items-center gap-2">
          <span>Ordenar:</span>
          <button
            aria-label="Ordenar título"
            onClick={()=> setSort(s=> s==='asc'?'desc':'asc')}
            className="inline-flex h-12 items-center justify-center rounded border border-[var(--border)] px-3 text-[12px] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {sort==='asc'? 'A→Z':'Z→A'}
          </button>
        </div>
      </div>
      {/* Tabela (>= md) */}
      <div className="hidden md:block overflow-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">Título</th>
              <th scope="col" className="px-3 py-2 text-left">Status</th>
              <th scope="col" className="px-3 py-2 text-left">Criado</th>
              <th scope="col" className="px-3 py-2 text-left">Publicado</th>
              <th scope="col" className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length===0 && Array.from({length:6}).map((_,i)=> (
              <tr key={i} className="border-t border-[var(--border)]">
                <td className="px-3 py-3" colSpan={5}><div className="h-4 w-full max-w-[560px] animate-pulse rounded bg-[var(--surface-2)]" /></td>
              </tr>
            ))}
            {isEmpty && (
              <tr className="border-t border-[var(--border)]"><td colSpan={5} className="px-3 py-6 text-center text-[13px] text-[var(--text-muted)]">Nenhum conteúdo encontrado.</td></tr>
            )}
            {sorted.map(row=> (
              <tr key={row.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 truncate max-w-[420px]"><Link className="hover:underline" href={`/admin/blog/editor?id=${row.id}`}>{row.title || row.slug}</Link></td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="px-3 py-2 tabular-nums">{row.created_at? new Date(row.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="px-3 py-2 tabular-nums">{row.published_at? new Date(row.published_at).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/blog/editor?id=${row.id}`}
                    className="inline-flex h-10 items-center justify-center rounded border border-[var(--border)] px-3 text-[12px] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    aria-label="Editar conteúdo"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Cards (< md) */}
      <div className="md:hidden divide-y divide-[var(--border)]" role="list" aria-label="Lista de conteúdo">
        {loading && items.length===0 && (
          <div className="p-4 space-y-3" aria-live="polite">
            {Array.from({length:4}).map((_,i)=>(<div key={i} className="h-5 w-3/4 animate-pulse rounded bg-[var(--surface-2)]" />))}
          </div>
        )}
        {isEmpty && (
          <div className="p-6 text-center text-[13px] text-[var(--text-muted)]">Nenhum conteúdo encontrado.</div>
        )}
        {sorted.map(row=> (
          <div key={row.id} role="listitem" className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Link href={`/admin/blog/editor?id=${row.id}`} className="font-medium leading-tight hover:underline break-words">{row.title || row.slug}</Link>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
                  <span className="inline-flex items-center rounded bg-[var(--surface-2)] px-2 py-0.5">{row.status}</span>
                  <span>Criado: {row.created_at? new Date(row.created_at).toLocaleDateString('pt-BR') : '-'}</span>
                  <span>Publicado: {row.published_at? new Date(row.published_at).toLocaleDateString('pt-BR') : '-'}</span>
                </div>
              </div>
              <Link
                href={`/admin/blog/editor?id=${row.id}`}
                className="shrink-0 inline-flex h-10 items-center justify-center rounded border border-[var(--border)] px-3 text-[12px] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Editar conteúdo"
              >
                Editar
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-[12px]">
        <div>Página {page}</div>
        <div className="flex items-center gap-2">
          <button
            disabled={page<=1 || loading}
            onClick={()=> setPage(p=> Math.max(1,p-1))}
            className="inline-flex h-12 min-w-12 items-center justify-center rounded border border-[var(--border)] px-4 disabled:opacity-50"
            aria-label="Página anterior"
          >
            Anterior
          </button>
          <button
            disabled={(page*perPage)>=total || loading}
            onClick={()=> setPage(p=> p+1)}
            className="inline-flex h-12 min-w-12 items-center justify-center rounded border border-[var(--border)] px-4 disabled:opacity-50"
            aria-label="Próxima página"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
