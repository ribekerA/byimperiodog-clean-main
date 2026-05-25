"use client";
import React from 'react';

interface Props { required: string[]; className?: string }

function detectMissing(required: string[]): string[] {
  if (typeof window === 'undefined') return [];
  const w: Record<string, unknown> = Object.create(null);
  // Copiar somente props enumeráveis (fallback simples)
  for (const k in window) {
    w[k] = (window as unknown as Record<string, unknown>)[k];
  }
  return required.filter(r => r.startsWith('NEXT_PUBLIC_') && !(r in process.env) && typeof w[r] === 'undefined');
}

export default function EnvDiagnostics({ required, className }: Props){
  if (process.env.NODE_ENV === 'production') return null;
  const missing = detectMissing(required);
  if (missing.length === 0) return null;
  return (
    <div className={"my-4 rounded border border-red-400 bg-red-50 p-3 text-xs text-red-800 dark:border-red-500 dark:bg-red-900/20 dark:text-red-200 " + (className||'')}>
      <p className="font-semibold mb-1">Variáveis públicas ausentes</p>
      <ul className="list-disc pl-4 space-y-0.5">
        {missing.map(m => <li key={m}><code>{m}</code></li>)}
      </ul>
      <p className="mt-2 opacity-80">Defina no arquivo .env.local e reinicie o dev server.</p>
    </div>
  );
}
