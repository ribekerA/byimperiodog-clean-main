import React from 'react';

interface Props { title:string; value?:string|number; hint?:string; children?:React.ReactNode; trend?:'up'|'down'|null; loading?:boolean; }

export function MetricCard({ title, value, hint, children, trend=null, loading }: Props){
  if(loading){
    return <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="h-3 w-24 rounded bg-[var(--surface-2)]" />
      <div className="mt-4 h-8 w-32 rounded bg-[var(--surface-2)]" />
      <div className="mt-3 h-2 w-40 rounded bg-[var(--surface-2)]" />
      <span className="sr-only">Carregando métrica</span>
    </div>;
  }
  const trendIcon = trend==='up'? '▲' : trend==='down'? '▼' : null;
  const trendColor = trend==='up'? 'text-[var(--success)]' : trend==='down'? 'text-[var(--error)]':'text-[var(--text-muted)]';
  return (
    <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm ring-0 transition hover:shadow-md hover:-translate-y-[2px] will-change-transform" style={{ transition:'transform var(--dur-250) var(--ease-standard), box-shadow var(--dur-250) var(--ease-standard)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</div>
        {trendIcon && <span className={`text-xs font-semibold ${trendColor}`}>{trendIcon}</span>}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-[var(--text)]">{value ?? '—'}</div>
      {hint && <div className="mt-1 text-[11px] text-[var(--text-muted)]">{hint}</div>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
