"use client";
import { motion } from 'framer-motion';
import * as React from 'react';

export function Main({ children }:{children:React.ReactNode}){
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <main id="main" tabIndex={-1} className="relative flex-1 focus:outline-none">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-6">
        <motion.div initial={prefersReducedMotion? false:{opacity:0, y:8}} animate={prefersReducedMotion? undefined:{opacity:1,y:0}} transition={{duration:.22, ease:'easeOut'}} className="space-y-8">
          {children}
        </motion.div>
      </div>
    </main>
  );
}
