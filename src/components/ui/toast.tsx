"use client";
import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/cn';

type ToastType = 'info' | 'success' | 'error' | 'warning';
export interface Toast { id:string; message:React.ReactNode; type?:ToastType; duration?:number; action?:{ label:string; onClick:()=>void }; }

interface ToastContextProps { push:(t:Omit<Toast,'id'>)=>void; remove:(id:string)=>void; }
const ToastContext = createContext<ToastContextProps|undefined>(undefined);

export function useToast(){
  const ctx = useContext(ToastContext);
  if(!ctx) throw new Error('useToast: ToastProvider ausente');
  return ctx;
}

export function ToastProvider({ children }: { children:React.ReactNode }){
  const [toasts,setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string,any>>({});
  const remove = useCallback((id:string)=> {
    setToasts(t=> t.filter(x=> x.id!==id));
    if(timers.current[id]){ clearTimeout(timers.current[id]); delete timers.current[id]; }
  },[]);
  const push = useCallback((t:Omit<Toast,'id'>)=>{
    const id = Math.random().toString(36).slice(2);
    const toast:Toast = { id, type:'info', duration:3000, ...t };
    setToasts(ts=> [...ts,toast]);
    if(toast.duration && toast.duration>0){ timers.current[id]= setTimeout(()=> remove(id), toast.duration); }
  },[remove]);
  useEffect(()=> ()=> Object.values(timers.current).forEach(clearTimeout),[]);
  return (
    <ToastContext.Provider value={{push,remove}}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-2 sm:items-end sm:pr-4">
        {toasts.map(t=> <ToastItem key={t.id} toast={t} onClose={()=> remove(t.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast:Toast; onClose:()=>void }){
  const { type='info', message, action } = toast;
  const base = 'w-full sm:w-auto max-w-[380px] pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-sm backdrop-blur flex items-start gap-3';
  const theme = type==='success'? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' : type==='error'? 'bg-rose-50/70 border-rose-200 text-rose-800' : type==='warning'? 'bg-amber-50/70 border-amber-200 text-amber-800' : 'bg-[var(--surface)]/80 border-[var(--border)] text-[var(--text)]';
  return (
    <div className={cn(base,theme)} role="status" aria-live="polite">
      <span className="flex-1 leading-snug">{message}</span>
      {action && <button onClick={()=> { action.onClick(); onClose(); }} className="rounded bg-[var(--accent)] px-2 py-1 text-[11px] font-medium text-[var(--accent-contrast)] hover:brightness-105">{action.label}</button>}
      <button onClick={onClose} aria-label="Fechar" className="rounded p-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]">✕</button>
    </div>
  );
}
