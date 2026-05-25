import React from 'react';

import { Button } from '../ui/button';

export function EmptyState({ title="Nada por aqui ainda.", description="Crie um novo item para começar.", actionLabel, onAction }: { title?:string; description?:string; actionLabel?:string; onAction?:()=>void }){
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
    <div className="text-base font-semibold text-[var(--text)]">{title}</div>
    <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
    {actionLabel && <Button variant="solid" size="md" className="mt-6" onClick={onAction}>{actionLabel}</Button>}
  </div>;
}
