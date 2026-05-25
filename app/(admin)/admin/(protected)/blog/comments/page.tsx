"use client";
// Página de moderação de comentários (mínima / placeholder)
// TODO: Restaurar UI completa se existia anteriormente (filtros, threads, ações em massa).
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BlogSubnav } from '@/components/admin/BlogSubnav';

interface CommentRow { id:string; post_id:string; author?:string|null; content?:string|null; status?:string|null; created_at?:string; }

export default function BlogCommentsModeration(){
	const [items,setItems]=useState<CommentRow[]>([]);
	const [loading,setLoading]=useState(true);
	const [error,setError]=useState<string|null>(null);

	useEffect(()=>{ (async()=>{
		try {
			setLoading(true);
			const res = await fetch('/api/admin/blog/comments?limit=50');
			if(!res.ok){ throw new Error('Falha ao carregar'); }
			const json = await res.json();
			setItems(Array.isArray(json)?json:json?.data||[]);
		} catch(e:any){ setError(String(e?.message||e)); } finally { setLoading(false); }
	})(); },[]);

	return (
		<>
			<div className="space-y-4 px-4 py-6">
				<BlogSubnav />
				<h1 className="text-2xl font-bold">Comentários (Moderação)</h1>
				<p className="text-sm text-zinc-600">Versão simplificada — lista até 50 comentários recentes.</p>
				{loading && <div>Carregando...</div>}
				{error && <div className="text-red-600 text-sm">{error}</div>}
				{!loading && !error && (
					<table className="w-full text-sm border-collapse">
						<thead>
							<tr className="bg-zinc-100 text-left">
								<th className="p-2 border">Post</th>
								<th className="p-2 border">Autor</th>
								<th className="p-2 border">Conteúdo</th>
								<th className="p-2 border">Status</th>
								<th className="p-2 border">Criado</th>
							</tr>
						</thead>
						<tbody>
							{items.map(c=> (
								<tr key={c.id} className="odd:bg-white even:bg-zinc-50">
									<td className="p-2 border"><Link className="underline" href={`/admin/blog/editor?id=${c.post_id}`}>{c.post_id.slice(0,6)}</Link></td>
									<td className="p-2 border max-w-[140px] truncate" title={c.author||''}>{c.author||'—'}</td>
									<td className="p-2 border max-w-[280px] truncate" title={c.content||''}>{c.content||''}</td>
									<td className="p-2 border">{c.status||'—'}</td>
									<td className="p-2 border whitespace-nowrap">{c.created_at? new Date(c.created_at).toLocaleDateString('pt-BR'): '—'}</td>
								</tr>
							))}
							{items.length===0 && <tr><td className="p-3 text-center text-zinc-500" colSpan={5}>Nenhum comentário.</td></tr>}
						</tbody>
					</table>
				)}
			</div>
		</>
	);
}

