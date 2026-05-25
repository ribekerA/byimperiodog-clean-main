import Link from "next/link";

export interface RelatedLink {
  label: string;
  href: string;
  desc: string;
}

/**
 * "Veja também" — grade de links internos para cross-linking entre páginas da raça.
 * Server Component puro (sem "use client") — renderizado no servidor, indexável.
 */
export function RelatedPages({ links }: { links: RelatedLink[] }) {
  return (
    <section aria-label="Artigos relacionados" className="border-t border-zinc-100 pt-8">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">Veja também</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
          >
            <span className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700 leading-snug">
              {l.label}
            </span>
            <span className="mt-1.5 text-xs text-zinc-500 leading-snug">{l.desc}</span>
            <span className="mt-3 text-xs font-medium text-emerald-700">Ler mais →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
