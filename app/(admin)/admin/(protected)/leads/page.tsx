import type { Metadata } from "next";

import LeadsCRM from "./LeadsCRM";
import { LEADS_PAGE_SIZE, fetchAdminLeads, parseLeadFilters } from "./queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leads | Admin",
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminLeadsPage(props: { searchParams?: Promise<SearchParams> }) {
  const searchParams = (await props.searchParams) ?? {};
  const { filters, page } = parseLeadFilters(searchParams);
  const payload = await fetchAdminLeads({ filters, page, pageSize: LEADS_PAGE_SIZE });

  return (
    <div className="space-y-[var(--space-6)]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Leads</h1>
          <p className="max-w-2xl text-sm text-[var(--text-muted)]">
            Quem pediu contato pelo site, do mais recente para o mais antigo. Mude o status conforme o atendimento
            avança; o painel registra sozinho a hora da primeira resposta.
          </p>
        </div>
      </header>
      <LeadsCRM {...payload} filters={filters} />
    </div>
  );
}
