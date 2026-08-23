import Link from 'next/link';

import { Header } from '@/components/dashboard/Header';
import { Main } from '@/components/dashboard/Main';

export const revalidate = 0;

export default function ContentIndex(){
  return (
      <>
      <Header />
      <Main>
        <section className="space-y-3">
          <h1 className="text-xl font-semibold tracking-tight">Conteúdo</h1>
          <p className="text-[var(--text-muted)] text-sm">Gerencie seus artigos, rascunhos e moderação.</p>
          <div className="flex gap-2 text-sm">
            <Link href="/admin/content/editor" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Abrir Editor (Wizard)</Link>
            <Link href="/admin/content/calendar" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Calendário Editorial</Link>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-sm text-[var(--text-muted)]">Tabela de conteúdo (mock). Integraremos DataTable e filtros aqui.</p>
          </div>
        </section>
  </Main>
  </>
  );
}
