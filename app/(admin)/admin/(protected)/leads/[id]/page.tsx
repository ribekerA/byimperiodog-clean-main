import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadDetailClient } from "../LeadDetailClient";
import { fetchAdminLead } from "../queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead | Admin",
  robots: { index: false, follow: false },
};

const BACK_LINK =
  "inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--brand)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]";

export default async function LeadDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const detail = await fetchAdminLead(params.id);

  if (!detail.configured || detail.error) {
    return (
      <div className="space-y-4">
        <Link href="/admin/leads" className={BACK_LINK}>
          Voltar para Leads
        </Link>
        <div role="alert" className="rounded-2xl border border-[#e5b9a3] bg-[#fdf1ea] p-4 text-sm text-[#8a3a12] sm:p-5">
          <h1 className="text-base font-semibold">
            {detail.configured ? "Não foi possível ler este lead" : "O painel não está ligado ao banco de dados"}
          </h1>
          <p className="mt-1">
            {detail.configured
              ? `O banco recusou a consulta (código ${detail.error?.code}). O lead não foi alterado. Recarregue a página para tentar de novo.`
              : "Faltam as credenciais do banco neste ambiente, então nenhum lead pode ser mostrado."}
          </p>
        </div>
      </div>
    );
  }

  if (!detail.lead || !detail.advisor) notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/leads" className={BACK_LINK}>
        Voltar para Leads
      </Link>
      <LeadDetailClient
        lead={detail.lead}
        history={detail.history}
        historyOk={detail.historyOk}
        matchedPuppy={detail.matchedPuppy}
        insight={detail.insight}
        advisor={detail.advisor}
      />
    </div>
  );
}
