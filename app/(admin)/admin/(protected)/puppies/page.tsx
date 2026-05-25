import type { Metadata } from "next";

import { PuppiesPageClient } from "./PuppiesPageClient";
import { fetchAdminPuppies, parsePuppyFilters } from "./queries";

export const metadata: Metadata = {
  title: "Filhotes | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPuppiesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const { filters, sort } = parsePuppyFilters(searchParams ?? {});
  const data = await fetchAdminPuppies({ filters, sort });

  return (
    <div className="space-y-[var(--space-6)]">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Filhotes</h1>
          <p className="text-sm text-[var(--text-muted)]">Gerencie os filhotes (criar, editar, status).</p>
        </div>
        <a
          href="/admin/puppies/new"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-full)] bg-emerald-600 px-[var(--space-4)] py-[var(--space-2)] text-sm font-semibold text-white shadow-[var(--elevation-2)] transition hover:bg-emerald-700 hover:shadow-[var(--elevation-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Novo filhote
        </a>
      </header>

      <PuppiesPageClient
        items={data.items}
        leadCounts={data.leadCounts}
        filters={filters}
        sort={sort}
        total={data.total}
        hasMore={data.hasMore}
        statusSummary={data.statusSummary}
        colorOptions={data.colorOptions}
      />
    </div>
  );
}
