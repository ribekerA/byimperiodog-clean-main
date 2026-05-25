"use client";
import React, { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/cn';

interface TooltipProps { children:React.ReactNode; content:React.ReactNode; side?:'top'|'bottom'|'left'|'right'; disabled?:boolean; className?:string; }

// Tooltip simples (sem portal) focado em acessibilidade básica.
export function Tooltip({ children, content, side='top', disabled, className }:TooltipProps){
  const [open,setOpen] = useState(false);
  const ref = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    function onKey(e:KeyboardEvent){ if(e.key==='Escape') setOpen(false); }
    if(open) window.addEventListener('keydown',onKey); else window.removeEventListener('keydown',onKey);
    return ()=> window.removeEventListener('keydown',onKey);
  },[open]);
  if(disabled) return <>{children}</>;
  return (
    <div ref={ref} className={cn('relative inline-flex', className)} onMouseEnter={()=> setOpen(true)} onMouseLeave={()=> setOpen(false)}>
      <div onFocus={()=> setOpen(true)} onBlur={()=> setOpen(false)} aria-haspopup="true" aria-expanded={open}>
        {children}
      </div>
      {open && (
        <div role="tooltip" className={cn('pointer-events-none absolute z-50 min-w-[160px] max-w-[240px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] leading-snug shadow-lg text-[var(--text-muted)]',
          side==='top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
          side==='bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
          side==='left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
          side==='right' && 'left-full top-1/2 -translate-y-1/2 ml-2'
        )}>
          {content}
        </div>
      )}
    </div>
  );
}
