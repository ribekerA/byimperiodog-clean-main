"use client";
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

import { cn } from '@/lib/cn';

interface DialogCtx { open:boolean; setOpen:(v:boolean)=>void; }
const DialogContext = createContext<DialogCtx|undefined>(undefined);

export function useDialog(){ const c= useContext(DialogContext); if(!c) throw new Error('useDialog fora de provider'); return c; }

export function Dialog({ children, open:controlled, onOpenChange }: { children:React.ReactNode; open?:boolean; onOpenChange?:(o:boolean)=>void }){
  const [uncontrolled,setUncontrolled] = useState(false);
  const isControlled = controlled!==undefined;
  const open = isControlled? controlled: uncontrolled;
  const setOpen = useCallback((v:boolean)=>{ if(isControlled) onOpenChange&&onOpenChange(v); else setUncontrolled(v); },[isControlled,onOpenChange]);
  return <DialogContext.Provider value={{open,setOpen}}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ asChild, children }: { asChild?:boolean; children:React.ReactElement<any> }){
  const { setOpen } = useDialog();
  if(asChild){
    const originalOnClick = (children.props as any)?.onClick;
    return React.cloneElement(children,{ onClick:(e:React.MouseEvent)=>{ if(originalOnClick) originalOnClick(e); setOpen(true); } });
  }
  return <button onClick={()=> setOpen(true)}>{children}</button>;
}

export function DialogContent({ title, description, children, className }: { title?:string; description?:string; children:React.ReactNode; className?:string }){
  const { open,setOpen } = useDialog();
  const ref = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{ if(open){ const prev=document.activeElement as HTMLElement|null; ref.current?.focus(); function onKey(e:KeyboardEvent){ if(e.key==='Escape'){ setOpen(false); } } document.addEventListener('keydown',onKey); return ()=>{ document.removeEventListener('keydown',onKey); prev?.focus(); }; } },[open,setOpen]);
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=> setOpen(false)} />
      <div ref={ref} tabIndex={-1} className={cn('relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl focus:outline-none',className)}>
        {title && <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">{title}</h2>}
        {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
        <div className="mt-4 space-y-4">{children}</div>
        <button onClick={()=> setOpen(false)} className="absolute right-2 top-2 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)]" aria-label="Fechar">✕</button>
      </div>
    </div>
  );
}

export function DialogActions({ children }: { children:React.ReactNode }){ return <div className="flex flex-wrap justify-end gap-2 pt-2">{children}</div>; }
