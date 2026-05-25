"use client";
import * as React from 'react';

export function QualityBar({ score }:{ score:number }){
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const color = pct>=85? 'bg-emerald-600' : pct>=70? 'bg-amber-600' : 'bg-red-600';
  const descId = React.useId();
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-1 flex items-center justify-between text-sm font-medium"><span>Qualidade</span><span className="tabular-nums">{pct}%</span></div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-describedby={descId} className="h-2 overflow-hidden rounded bg-[var(--surface-2)]">
        <div className={`h-full ${color}`} style={{ width: pct+'%' }} />
      </div>
      <p id={descId} className="sr-only">Pontuação de qualidade do artigo.</p>
    </div>
  );
}
