import React from 'react';

import { Button } from '../ui/button';

export function ErrorState({ message="Algo deu errado.", onRetry }: { message?:string; onRetry?:()=>void }){
  return <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-[var(--error)]/30 bg-[var(--error)]/5 p-8 text-center">
    <div className="text-sm font-semibold text-[var(--error)]">{message}</div>
    {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Tentar novamente</Button>}
  </div>;
}
