import { notFound } from 'next/navigation';
import React from 'react';

import { BlogSubnav } from '@/components/admin/BlogSubnav';
import { adminFetchSSR } from '@/lib/adminFetchSSR';

// Página de preview segura (noindex) para posts ainda não publicados ou agendados.
// Usa fetch server-side com credencial admin em contexto (assume middleware protege rota).

async function fetchPost(id:string){
  try {
    const res = await adminFetchSSR(`/api/admin/blog?id=${encodeURIComponent(id)}`);
    if(!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata(){
  return { robots: { index:false, follow:false }, title:'Preview Post' };
}

export default async function PreviewPage(props:{ params: Promise<{ id:string }> }) {
  const params = await props.params;
  const post = await fetchPost(params.id);
  if(!post) return notFound();
  const isDraft = post.status !== 'published';
  return (
    <>
      <BlogSubnav />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold leading-tight flex-1">{post.title || '(sem título)'}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDraft? 'bg-amber-600 text-white':'bg-[var(--brand)] text-white'}`}>{post.status}</span>
        </div>
        <div className="mb-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide">
          <span className="rounded bg-[var(--surface-2)] px-2 py-1">PREVIEW</span>
          {post.scheduled_at && <span className="rounded bg-[var(--surface-2)] px-2 py-1">Agendado: {new Date(post.scheduled_at).toLocaleString('pt-BR')}</span>}
          {post.published_at && <span className="rounded bg-[var(--surface-2)] px-2 py-1">Publicado: {new Date(post.published_at).toLocaleDateString('pt-BR')}</span>}
        </div>
        {post.cover_url && (
          <figure className="mb-8 overflow-hidden rounded-md border border-[var(--border)]">
            <img src={post.cover_url} alt={post.cover_alt||''} className="w-full aspect-[16/9] object-cover" />
          </figure>
        )}
        {post.subtitle && <p className="mb-6 text-lg text-[var(--text-muted)]">{post.subtitle}</p>}
        <article className="prose prose-sm max-w-none dark:prose-invert">
          {/* Conteúdo MDX simples (markdown plano) - futura renderização MDX rica */}
          {post.content_mdx?.split(/\n{2,}/).map((blk:string,i:number)=> <p key={i}>{blk}</p>)}
        </article>
      </div>
    </>
  );
}
