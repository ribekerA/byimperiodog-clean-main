"use client";
import { motion } from 'framer-motion';
import * as React from 'react';

import { LazyChart } from '../charts/LazyChart';

interface ChartCardProps {
  title:string;
  description?:string;
  type:'line'|'bar';
  labels:string[];
  datasets:{ label:string; data:number[]; borderColor?:string; backgroundColor?:string }[];
  loading?:boolean; error?:string|null; emptyFallback?:string;
  tooltip?: string; // texto curto opcional para aria-describedby
}

export function ChartCard({ title, description, type, labels, datasets, loading, error, emptyFallback='Sem dados', tooltip }:ChartCardProps){
  const isEmpty = !datasets.some(d=> d.data.some(v=> v!==0));
  const summary = React.useMemo(()=>{
    if(isEmpty) return `${title}: vazio.`;
    // Cria pequena frase: usa primeiro dataset
    const primary = datasets[0];
    const last = primary?.data.at(-1);
    const max = Math.max(...primary.data);
    return `${title}: ${primary.label||'série principal'} último valor ${last}, pico ${max}. Total pontos ${primary.data.length}.`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isEmpty, datasets, title]);
  const descId = React.useId();
  const tipId = React.useId();
  // Lazy-load charts somente quando em viewport
  const containerRef = React.useRef<HTMLDivElement|null>(null);
  const [inView,setInView] = React.useState(false);
  const [ChartLib,setChartLib] = React.useState<any>(null);
  const [loadError,setLoadError] = React.useState<string|undefined>(undefined);
  React.useEffect(()=>{
    if(!containerRef.current){ return; }
    if(typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const obs = new IntersectionObserver(([entry])=>{ if(entry.isIntersecting){ setInView(true); obs.disconnect(); } }, { rootMargin:'128px' });
    obs.observe(containerRef.current);
    return ()=> obs.disconnect();
  },[]);
  // Chart.js stack removida nesta fase; placeholder para futura migração única (ex: Recharts abstraído)
  React.useEffect(()=>{ /* no-op até introdução de wrapper unificado */ },[]);
  if(loading){
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm" aria-busy="true"><div className="h-4 w-32 rounded bg-[var(--surface-2)]" /><div className="mt-6 h-40 rounded bg-[var(--surface-2)]" /></div>;
  }
  if(error){
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-red-600">Erro: {error} <button className="ml-3 underline" onClick={()=> location.reload()}>Tentar novamente</button></div>;
  }
  return (
  <motion.div ref={containerRef} initial={{opacity:0, y:8}} animate={{opacity:1,y:0}} transition={{duration:.25}} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm" role="group" aria-describedby={tooltip? `${descId} ${tipId}`: descId}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold leading-none tracking-tight">{title}</h3>
          {description && <p className="mt-1 text-[11px] text-[var(--text-muted)]">{description}</p>}
        </div>
      </div>
      <p id={descId} className="sr-only">{summary}</p>
  {tooltip && <p id={tipId} className="sr-only">{tooltip}</p>}
      {isEmpty? <div className="flex h-40 items-center justify-center text-[12px] text-[var(--text-muted)]">{emptyFallback}</div> : (
        <LazyChart
          height={160}
          data={{ labels, datasets }}
          render={(R) => {
            // Usa LineChart / BarChart básicos do Recharts conforme 'type'
            const commonProps = { data: labels.map((lbl, i) => ({ label: lbl, ...datasets.reduce((acc, ds, di) => ({ ...acc, [ds.label || `s${di}`]: ds.data[i] } ), {}) })) };
            const primary = datasets[0];
            const color = primary?.borderColor || '#10b981';
            if(type === 'line') {
              return (
                <R.ResponsiveContainer width="100%" height="100%">
                  <R.LineChart data={commonProps.data} margin={{ left: 4, right: 4, top: 4, bottom: 0 }}>
                    <R.CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <R.XAxis dataKey="label" hide />
                    <R.YAxis hide />
                    <R.Tooltip cursor={false} />
                    <R.Line type="monotone" dataKey={primary.label || 'valor'} stroke={color} strokeWidth={2} dot={false} />
                  </R.LineChart>
                </R.ResponsiveContainer>
              );
            }
            return (
              <R.ResponsiveContainer width="100%" height="100%">
                <R.BarChart data={commonProps.data} margin={{ left: 4, right: 4, top: 4, bottom: 0 }}>
                  <R.CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <R.XAxis dataKey="label" hide />
                  <R.YAxis hide />
                  <R.Tooltip cursor={false} />
                  <R.Bar dataKey={primary.label || 'valor'} fill={color} radius={2} />
                </R.BarChart>
              </R.ResponsiveContainer>
            );
          }}
        />
      )}
    </motion.div>
  );
}
