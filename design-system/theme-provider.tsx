"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeCtx { theme:'light'|'dark'; toggle:()=>void; set:(t:'light'|'dark')=>void; }
const Ctx = createContext<ThemeCtx|undefined>(undefined);

export function ThemeProvider({ children }: { children:React.ReactNode }){
  const [theme,setTheme] = useState<'light'|'dark'>(()=> (typeof window!=='undefined' && (localStorage.getItem('theme') as any)) || 'light');
  useEffect(()=>{ document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme); },[theme]);
  function toggle(){ setTheme(t=> t==='light'?'dark':'light'); }
  return <Ctx.Provider value={{ theme, toggle, set:setTheme }}>{children}</Ctx.Provider>;
}
export function useTheme(){ const c= useContext(Ctx); if(!c) throw new Error('useTheme'); return c; }
