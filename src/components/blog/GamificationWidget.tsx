"use client";
import React, { useEffect, useState, useCallback } from 'react';

interface GamState { id?:string; xp?:number; level?:number; streak_days?:number; badges?:string[] }

export default function GamificationWidget({ anonId, className }: { anonId:string; className?:string }){
  const [state,setState]=useState<GamState>({});
  const [loading,setLoading]=useState(false);
  const [recentBadges,setRecentBadges]=useState<string[]>([]);
  const claim = useCallback(async (type='gam_view_post') => {
    setLoading(true);
    try {
      const r = await fetch('/api/gamification/claim', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ anonId, type }) });
      const j = await r.json();
      if(j.ok){
        if(j.badges?.length){
          setRecentBadges(j.badges.map((b:any)=> b.code));
          setTimeout(()=> setRecentBadges([]), 8000);
        }
        setState(s=> ({ ...s, ...j.user, badges: [...new Set([...(s.badges||[]), ...(j.badges||[]).map((b:any)=> b.code)])] }));
      }
    } finally { setLoading(false); }
  }, [anonId]);
  useEffect(()=>{ claim('gam_visit'); },[claim]);
  return (
    <div className={className}>
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-600/5 p-4 text-sm">
        <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Progresso</h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">XP: <span className="font-medium">{state.xp ?? 0}</span> • Nível: <span className="font-medium">{state.level ?? 1}</span> • Streak: <span className="font-medium">{state.streak_days ?? 0}</span>d</p>
        <div className="mt-3 flex gap-2">
          <button disabled={loading} onClick={()=>claim('gam_view_post')} className="rounded bg-emerald-600 text-white px-3 py-1 text-xs disabled:opacity-40">+XP View</button>
          <button disabled={loading} onClick={()=>claim('gam_qa_question')} className="rounded bg-emerald-700 text-white px-3 py-1 text-xs disabled:opacity-40">+XP QA</button>
        </div>
        {recentBadges.length ? (
          <div className="mt-3 animate-fade-in text-[11px] text-emerald-700 dark:text-emerald-300">
            Ganhou: {recentBadges.map(b=> <span key={b} className="mr-1 rounded bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-200">{b}</span>)}
          </div>
        ) : null}
        {state.badges?.length ? (
          <div className="mt-2 text-[10px] text-zinc-500 flex flex-wrap gap-1">
            {state.badges.map(b=> <span key={b} className="rounded border border-emerald-500/30 px-2 py-0.5">{b}</span>)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
