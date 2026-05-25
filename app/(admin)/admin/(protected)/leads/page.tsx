import type { Metadata } from "next";

import { createLogger } from "@/lib/logger";

import LeadsCRM from "./LeadsCRM";
import { fetchAdminLeads, parseLeadFilters } from "./queries";
import { AdminErrorState } from "@/components/admin/ui/AdminErrorState";

export const metadata: Metadata = {
  title: "Leads | Admin",
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const logger = createLogger("admin:leads");
  const { filters, page } = parseLeadFilters(searchParams ?? {});
  try {
    const payload = await fetchAdminLeads({ filters, page });
    return <LeadsCRM {...payload} filters={filters} />;
  } catch (error) {
    logger.error("Falha ao carregar leads", { error });
    return (
      <AdminErrorState
        title="Erro ao carregar leads"
        message="Nao foi possivel carregar os leads agora. Tente novamente ou ajuste os filtros."
        actionHref="/admin/leads"
        actionLabel="Recarregar"
      />
    );
  }
}
