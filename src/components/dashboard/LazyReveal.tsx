"use client";
import { motion } from 'framer-motion';
import * as React from 'react';

interface LazyRevealProps { children: React.ReactNode; once?: boolean; margin?: string; className?: string; skeletonHeight?: number; }

export function LazyReveal({ children, once=true, margin='200px', className='', skeletonHeight=120 }:LazyRevealProps){
  const ref = React.useRef<HTMLDivElement|null>(null);
  const [visible,setVisible] = React.useState(false);
  React.useEffect(()=>{
    if(!ref.current) return;
    if(typeof IntersectionObserver === 'undefined'){ setVisible(true); return; }
    const obs = new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting){ setVisible(true); if(once) obs.disconnect(); }
    }, { rootMargin: margin });
    obs.observe(ref.current);
    return ()=> obs.disconnect();
  },[once, margin]);
  return (
    <div ref={ref} className={className}>
      {visible ? (
        <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:.28}}>
          {children}
        </motion.div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6" aria-hidden>
          <div className="h-4 w-32 rounded bg-[var(--surface-2)] mb-4" />
          <div style={{height:skeletonHeight}} className="w-full rounded bg-[var(--surface-2)]" />
        </div>
      )}
    </div>
  );
}