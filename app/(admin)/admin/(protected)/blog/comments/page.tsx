"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { BlogSubnav } from '@/components/admin/BlogSubnav';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { adminFetch } from '@/lib/adminFetch';

interface CommentRow {
  id: string;
  post_id: string;
  author_name: string | null;
  author_email: string | null;
  body: string | null;
  approved: boolean;
  created_at: string;
}

type CommentFilter = 'pending' | 'approved' | 'all';

const BUTTON = 'inline-flex min-h-10 items-center justify-center rounded-lg border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function BlogCommentsModeration(){
  const { push } = useToast();
  const [items, setItems] = useState<CommentRow[]>([]);
  const [filter, setFilter] = useState<CommentFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CommentRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/blog/comments?limit=200');
      const json = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(json)) {
        throw new Error(json?.error || 'Não foi possível carregar os comentários.');
      }
      setItems(json);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleItems = useMemo(() => items.filter((comment) =>
    filter === 'all' || (filter === 'approved' ? comment.approved : !comment.approved)
  ), [filter, items]);

  async function setApproved(comment: CommentRow, approved: boolean) {
    setBusy(comment.id);
    try {
      const res = await adminFetch('/api/admin/blog/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: comment.id, approved }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.id) throw new Error(json?.error || 'Não foi possível atualizar o comentário.');
      setItems((current) => current.map((item) => item.id === comment.id ? { ...item, approved } : item));
      push({ type: 'success', message: approved ? 'Comentário aprovado.' : 'Aprovação removida.' });
    } catch (reason) {
      push({ type: 'error', message: reason instanceof Error ? reason.message : 'Falha ao atualizar o comentário.' });
    } finally {
      setBusy(null);
    }
  }

  async function remove(comment: CommentRow) {
    setBusy(comment.id);
    try {
      const res = await adminFetch(`/api/admin/blog/comments?id=${encodeURIComponent(comment.id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Não foi possível excluir o comentário.');
      setItems((current) => current.filter((item) => item.id !== comment.id));
      push({ type: 'success', message: 'Comentário excluído.' });
    } catch (reason) {
      push({ type: 'error', message: reason instanceof Error ? reason.message : 'Falha ao excluir o comentário.' });
    } finally {
      setBusy(null);
      setPendingDelete(null);
    }
  }

	return (
		<>
			<div className="space-y-4 px-4 py-6">
				<BlogSubnav />
				<h1 className="text-2xl font-bold">Comentários (Moderação)</h1>
				<p className="text-sm text-zinc-600">A lista mostra até 200 comentários mais recentes.</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar comentários">
          {([
            ['pending', 'Pendentes'],
            ['approved', 'Aprovados'],
            ['all', 'Todos'],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}
              className={`${BUTTON} ${filter === key ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-zinc-300 bg-white text-zinc-800'}`}>
              {label}
              <span className="ml-2 tabular-nums">
                ({key === 'all' ? items.length : items.filter((item) => key === 'approved' ? item.approved : !item.approved).length})
              </span>
            </button>
          ))}
          <button type="button" onClick={() => void load()} disabled={loading} className={`${BUTTON} border-zinc-300 bg-white text-zinc-800`}>
            Atualizar
          </button>
        </div>
        {loading && <div role="status">Carregando comentários...</div>}
        {error && <div role="alert" className="text-sm text-red-700">{error}</div>}
				{!loading && !error && (
					<table className="w-full text-sm border-collapse">
						<thead>
							<tr className="bg-zinc-100 text-left">
								<th className="p-2 border">Post</th>
								<th className="p-2 border">Autor</th>
								<th className="p-2 border">Conteúdo</th>
								<th className="p-2 border">Status</th>
								<th className="p-2 border">Criado</th>
                <th className="p-2 border">Ações</th>
							</tr>
						</thead>
						<tbody>
							{visibleItems.map(c=> (
								<tr key={c.id} className="odd:bg-white even:bg-zinc-50">
									<td className="p-2 border"><Link className="underline" href={`/admin/blog/editor?id=${c.post_id}`}>{c.post_id.slice(0,6)}</Link></td>
									<td className="p-2 border max-w-[140px] truncate" title={c.author_name || ''}>{c.author_name || '—'}</td>
									<td className="p-2 border max-w-[280px] truncate" title={c.body || ''}>{c.body || '—'}</td>
									<td className="p-2 border">{c.approved ? 'Aprovado' : 'Pendente'}</td>
									<td className="p-2 border whitespace-nowrap">{formatDate(c.created_at)}</td>
                  <td className="p-2 border whitespace-nowrap">
                    <div className="flex gap-2">
                      <button type="button" disabled={busy === c.id} onClick={() => void setApproved(c, !c.approved)}
                        className={`${BUTTON} ${c.approved ? 'border-zinc-300 bg-white text-zinc-800' : 'border-emerald-700 bg-emerald-700 text-white'}`}>
                        {c.approved ? 'Retirar aprovação' : 'Aprovar'}
                      </button>
                      <button type="button" disabled={busy === c.id} onClick={() => setPendingDelete(c)}
                        className={`${BUTTON} border-red-300 bg-white text-red-800`}>
                        Excluir
                      </button>
                    </div>
                  </td>
								</tr>
							))}
							{visibleItems.length===0 && <tr><td className="p-3 text-center text-zinc-500" colSpan={6}>Nenhum comentário nesta categoria.</td></tr>}
						</tbody>
					</table>
				)}
			</div>
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Excluir este comentário?"
        description="A exclusão é permanente e o comentário será removido do artigo."
        confirmLabel="Sim, excluir"
        variant="danger"
        onConfirm={() => { if (pendingDelete) void remove(pendingDelete); }}
      />
		</>
	);
}

