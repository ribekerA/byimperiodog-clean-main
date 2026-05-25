"use client";
import React, { useState } from 'react';

export default function QABlock({ className }: { className?: string }){
  const [q,setQ]=useState('');
  const [loading,setLoading]=useState(false);
  const [answer,setAnswer]=useState<string|null>(null);
  const [citations,setCitations]=useState<{ slug:string; snippet:string; score:number }[]>([]);
  const [error,setError]=useState<string|null>(null);

  async function onAsk(e:React.FormEvent){
    e.preventDefault();
    if(!q.trim()) return;
    setLoading(true); setError(null); setAnswer(null); setCitations([]);
    try {
      const r = await fetch('/api/qa', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ q }) });
      const j = await r.json();
      if(!j.ok) throw new Error(j.error||'Erro');
      setAnswer(j.answer);
      setCitations(j.citations||[]);
    } catch(e:any){ setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className={className}>
      <form onSubmit={onAsk} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Pergunte algo sobre o conteúdo do blog" className="flex-1 rounded border px-3 py-2 text-sm" />
          <button disabled={loading} className="rounded bg-emerald-600 px-4 py-2 text-white text-sm disabled:opacity-50">{loading? '...' : 'Perguntar'}</button>
        </div>
        {answer && (
          <div className="mt-3 rounded border p-3 bg-white/70 dark:bg-zinc-900/40">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{answer}</p>
            {citations.length>0 && (
              <ul className="mt-3 space-y-2 text-xs text-zinc-600">
                {citations.map(c=> <li key={c.slug+c.snippet.slice(0,10)} className="border-l-2 pl-2 border-emerald-400"><a className="hover:underline" href={`/blog/${c.slug}`}>/{c.slug}</a> — {c.snippet.slice(0,140)}...</li>)}
              </ul>
            )}
          </div>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
