"use client";
import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';

interface Toast { id:string; message:string; type?:'default'|'success'|'error'; timeout?:number }

interface ToastContextValue { push:(t:Omit<Toast,'id'>)=>void }
const ToastCtx = React.createContext<ToastContextValue | null>(null);

export function useToast(){
  const ctx = React.useContext(ToastCtx);
  if(!ctx) throw new Error('ToastProvider ausente');
  return ctx;
}

export function ToastProvider({ children }:{children:React.ReactNode}){
  const [items,setItems] = React.useState<Toast[]>([]);
  function push(t:Omit<Toast,'id'>){
    const toast:Toast = { id:Math.random().toString(36).slice(2), timeout:4000, ...t };
    setItems(list=> [...list, toast]);
    setTimeout(()=> setItems(list=> list.filter(i=> i.id!==toast.id)), toast.timeout);
  }
  const value = React.useMemo(()=> ({ push }), []);
  const reduced = typeof window!=='undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-4">
        <AnimatePresence initial={false}>
          {items.map(t=>{
            const color = t.type==='success'? 'bg-[var(--success)] text-white' : t.type==='error'? 'bg-[var(--error)] text-white':'bg-[var(--surface-2)] text-[var(--text)]';
            return (
              <motion.div key={t.id} initial={{opacity:0, y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} transition={{duration:reduced?0:.18}} className={`pointer-events-auto w-full max-w-sm rounded-xl border border-[var(--border)] px-4 py-3 text-sm shadow-lg ${color}`}> {t.message}</motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}