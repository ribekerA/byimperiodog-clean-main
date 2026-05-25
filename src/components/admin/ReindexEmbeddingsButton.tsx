"use client";
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { adminFetch } from '@/lib/adminFetch';

export function ReindexEmbeddingsButton({ className }: { className?: string }){
  const [loading,setLoading] = useState(false);
  const [msg,setMsg] = useState<string|null>(null);
  const { push: pushToast } = useToast?.() || { push: (_:any)=>{} } as any;
  async function onClick(){
    try {
      setLoading(true); setMsg(null);
      const r = await adminFetch('/api/admin/embeddings/reindex', { method:'POST' });
      const j = await r.json().catch(()=>null);
      if(!r.ok) throw new Error(j?.error || 'Erro ao reindexar');
      setMsg(`Atualizados: ${j?.updated ?? 0}`);
      try { pushToast({ message: `Embeddings atualizados: ${j?.updated ?? 0}`, type: 'success' }); } catch {}
    } catch(e:any){
      setMsg(`Falha: ${e?.message||e}`);
      try { pushToast({ message: `Falha ao reindexar: ${e?.message||e}` , type: 'error' }); } catch {}
    } finally { setLoading(false); }
  }
  return (
    <div className={className}>
      <Button size="sm" variant="outline" onClick={onClick} disabled={loading}>
        {loading? 'Reindexando…':'Reindexar Embeddings'}
      </Button>
      {msg && <div className="mt-1 text-[11px] text-zinc-600" role="status">{msg}</div>}
    </div>
  );
}

export default ReindexEmbeddingsButton;
