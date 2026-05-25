"use client";
import { motion } from 'framer-motion';
import * as React from 'react';

import { Sparkline } from '../charts/Sparkline';

interface KpiCardProps {
  label:string;
  value: string|number|React.ReactNode;
  delta?: number | null; // porcentagem
  deltaLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'flat';
  series?: number[];
  loading?: boolean;
  empty?: boolean;
  ariaLive?: boolean;
}

export function KpiCard({ label, value, delta=null, deltaLabel, icon, trend='flat', series, loading, empty, ariaLive }:KpiCardProps){
  if(loading){
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm animate-pulse" aria-busy="true" aria-live="polite">
        <div className="h-3 w-24 rounded bg-[var(--surface-2)]" />
        <div className="mt-4 h-8 w-32 rounded bg-[var(--surface-2)]" />
        <div className="mt-3 h-2 w-40 rounded bg-[var(--surface-2)]" />
      </div>
    );
  }
  if(empty){
    return (
      <div className="group relative rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 text-center text-[12px] text-[var(--text-muted)]">
        <div className="mb-1 font-semibold text-[var(--text)]">{label}</div>
        <p className="opacity-70">Sem dados</p>
      </div>
    );
  }
  const trendColor = trend==='up'? 'text-[var(--success)]' : trend==='down'? 'text-[var(--error)]' : 'text-[var(--text-muted)]';
  const trendIcon = trend==='up'? '▲' : trend==='down'? '▼' : null;
  const deltaSign = delta!==null && delta!==undefined? (delta>0? '+':'')+delta+'%': null;
  return (
    <motion.div whileHover={{scale:1.01}} transition={{type:'spring', stiffness:300, damping:25}} className="relative group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] outline-none" tabIndex={0} aria-live={ariaLive? 'polite': undefined}>
      <dl>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {icon && <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text)]">{icon}</span>}
            <dt>{label}</dt>
          </div>
          <div className="flex items-center gap-1">
            {trendIcon && <span aria-hidden="true" className={`text-[10px] ${trendColor}`}>{trendIcon}</span>}
            {deltaSign && <dd className={`text-xs font-semibold ${trendColor}`}>{deltaSign}</dd>}
          </div>
        </div>
        <dd className="mt-2 text-3xl font-bold tracking-tight text-[var(--text)]">{value}</dd>
        {deltaLabel && <dd className="mt-1 text-[11px] text-[var(--text-muted)]">{deltaLabel}</dd>}
        {series && <dd className="mt-3"><Sparkline points={series} height={34} /></dd>}
      </dl>
    </motion.div>
  );
}
