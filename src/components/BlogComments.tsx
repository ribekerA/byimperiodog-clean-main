"use client";

import React, { useEffect, useState } from "react";

type Comment = {
  id: string;
  post_id: string;
  author_name?: string;
  body: string;
  created_at: string;
};

export default function BlogComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchComments();
    // poll every 60s
    const t = setInterval(fetchComments, 60000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function fetchComments(before?: string) {
    try {
      const qs = new URLSearchParams({ post_id: postId });
      if (before) qs.set("before", before);
      const res = await fetch(`/api/blog/comments?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro ao carregar comentários");
      const items = Array.isArray(json) ? json : json?.items ?? [];
      if (before) setComments((prev) => [...prev, ...items]);
      else setComments(items);
      setNextCursor(Array.isArray(json) ? null : json?.nextCursor ?? null);
    } catch (err: any) {
      console.error(err);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/blog/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, author_name: author, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || json?.message || "Erro ao enviar comentário");
      setMessage("Comentário enviado para moderação.");
      setAuthor("");
      setBody("");
      fetchComments();
    } catch (err: any) {
      setMessage(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-12">
      <h3 className="text-lg font-semibold">Comentários</h3>
      <div className="mt-4 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-zinc-600">Seja o primeiro a comentar.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded border p-3">
              <div className="text-sm font-medium">{c.author_name || "Anônimo"}</div>
              <div className="mt-1 text-sm text-zinc-800">{c.body}</div>
              <div className="mt-2 text-xs text-zinc-500">{new Date(c.created_at).toLocaleString()}</div>
            </div>
          ))
        )}
        {nextCursor && (
          <div className="pt-2">
            <button
              type="button"
              className="rounded border px-3 py-1 text-sm"
              disabled={loadingMore}
              onClick={async () => {
                if (!nextCursor) return;
                setLoadingMore(true);
                try {
                  await fetchComments(nextCursor);
                } finally {
                  setLoadingMore(false);
                }
              }}
            >
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div>
          <label className="block text-sm">Nome</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm">Comentário</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1 block w-full rounded border px-3 py-2" required />
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded bg-blue-600 text-white px-3 py-1" disabled={loading}>{loading ? "Enviando..." : "Enviar"}</button>
          <button type="button" className="rounded border px-3 py-1" onClick={() => { setMessage(null); }}>Limpar</button>
        </div>
        {message && <div className="text-sm mt-2">{message}</div>}
      </form>
    </section>
  );
}
