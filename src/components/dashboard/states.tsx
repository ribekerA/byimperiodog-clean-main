"use client";
import * as React from 'react';

export function EmptyState({ title='Sem dados', description='Nenhum registro encontrado', action }: { title?:string; description?:string; action?:React.ReactNode }){
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-8 py-14 text-center">
      <div className="mb-3 h-16 w-16 rounded-full border border-[var(--border)] bg-[var(--surface-2)]" aria-hidden="true" />
      <h3 className="text-sm font-semibold tracking-tight text-[var(--text)]">{title}</h3>
      <p className="mt-1 max-w-xs text-[12px] text-[var(--text-muted)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ lines=3 }:{ lines?:number }){
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({length:lines}).map((_,i)=> <div key={i} className="h-6 w-full animate-pulse rounded bg-[var(--surface-2)]" />)}
    </div>
  );
}

export function ErrorState({ message='Erro ao carregar', retry }:{ message?:string; retry?:()=>void }){
  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">
      <p className="font-medium">{message}</p>
      {retry && <button onClick={retry} className="mt-3 inline-flex items-center gap-1 rounded-md border border-red-300 bg-white/50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-white focus-visible:ring-2 focus-visible:ring-red-500">Tentar novamente</button>}
    </div>
  );
}
