import type { Metadata } from "next";
import Link from "next/link";

import { PuppiesPageClient } from "./PuppiesPageClient";
import { fetchAdminPuppies, parsePuppyFilters } from "./queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Filhotes | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPuppiesPage(
  props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }
) {
  const searchParams = await props.searchParams;
  const { filters, sort } = parsePuppyFilters(searchParams ?? {});
  const data = await fetchAdminPuppies({ filters, sort });

  return (
    <div className="space-y-[var(--space-6)]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Filhotes</h1>
          <p className="max-w-2xl text-sm text-[var(--text-muted)]">Controle interno de estoque: cadastro, fotos, preço e status. O que muda aqui não altera as páginas do site.</p>
        </div>
        <Link
          href="/admin/puppies/new"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--brand)] min-h-[44px] px-[var(--space-4)] py-[var(--space-2)] text-sm font-semibold text-white shadow-[var(--elevation-2)] transition hover:bg-[var(--brand-hover)] hover:shadow-[var(--elevation-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2"
        >
          Novo filhote
        </Link>
      </header>

      <PuppiesPageClient
        items={data.items}
        filters={filters}
        sort={sort}
        total={data.total}
        truncated={data.truncated}
        statusSummary={data.statusSummary}
        colorOptions={data.colorOptions}
        hasDemand={data.hasDemand}
        configured={data.configured}
        error={data.error}
      />
    </div>
  );
}
