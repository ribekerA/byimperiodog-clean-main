// Página simplificada de Analytics do Blog (temporária)
// TODO: Restaurar versão completa se necessário (gráficos detalhados, etc.)
import React from 'react';
import { BlogSubnav } from '@/components/admin/BlogSubnav';
import ReindexEmbeddingsButton from '@/components/admin/ReindexEmbeddingsButton';

export const dynamic = 'force-dynamic';

async function getStats(): Promise<{total:number; published:number; scheduled:number; draft:number}> {
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/blog?summary=1`, { cache: 'no-store' });
		if(!res.ok) throw new Error('fail');
		const json = await res.json();
		return json?.summary || { total:0, published:0, scheduled:0, draft:0 };
	} catch {
		return { total:0, published:0, scheduled:0, draft:0 };
	}
}

export default async function BlogAnalyticsPage(){
	const stats = await getStats();
	return (
		<div className="space-y-6 px-4 py-6">
			<BlogSubnav />
				<header>
					<div className="flex items-center justify-between gap-3">
						<h1 className="text-2xl font-bold">Analytics do Blog</h1>
						<ReindexEmbeddingsButton />
					</div>
					<p className="text-sm text-zinc-600">Visão rápida de status dos posts. (Versão mínima)</p>
				</header>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<Stat label="Total" value={stats.total} />
					<Stat label="Publicados" value={stats.published} />
					<Stat label="Agendados" value={stats.scheduled} />
					<Stat label="Rascunhos" value={stats.draft} />
				</div>
				<div className="text-sm text-zinc-600">
					<p>Funcionalidade completa de analytics será reimplementada após estabilização do build.</p>
				</div>
		</div>
	);
}

function Stat({label,value}:{label:string;value:number}){
	return <div className="rounded border p-4 bg-white"><div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></div>;
}

