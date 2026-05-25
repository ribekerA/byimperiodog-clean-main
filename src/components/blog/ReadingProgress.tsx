"use client";
import React, { useEffect, useState } from 'react';

interface ReadingProgressProps { targetSelector?: string; height?: number; className?: string }

export default function ReadingProgress({ targetSelector = 'article', height = 3, className }: ReadingProgressProps){
  const [pct, setPct] = useState(0);
  useEffect(()=>{
    const el = document.querySelector(targetSelector);
    if(!el) return;
    function onScroll(){
      if(!el) return;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = el.scrollHeight - viewport;
      const passed = Math.min(total, Math.max(0, -rect.top));
      const percent = total > 0 ? (passed / total) * 100 : 0;
      setPct(percent);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return ()=> window.removeEventListener('scroll', onScroll);
  },[targetSelector]);
  return (
    <div
      aria-hidden="true"
      className={className || 'fixed left-0 top-0 z-40 w-full bg-transparent'}
      style={{ height }}
    >
      <div className="h-full origin-left bg-emerald-600 transition-[width] duration-150" style={{ width: pct + '%' }} />
    </div>
  );
}
