import type { Metadata } from "next";

import { AdminErrorState } from "@/components/admin/ui/AdminErrorState";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

import { AutoSalesTable, type AutoSalesSequenceRow } from "./AutoSalesTable";

export const metadata: Metadata = {
  title: "AutoSales IA | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminAutoSalesPage() {
  const logger = createLogger("admin:autosales");
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("autosales_sequences")
    .select("id,lead_id,status,urgency,next_step,next_run_at,step_index,total_steps,fallback_required,fallback_reason,bypass_human,last_message_type,last_message_sent_at,created_at,leads(nome,first_name,telefone,phone)")
    .order("status", { ascending: true })
    .order("next_run_at", { ascending: true, nullsFirst: false })
    .limit(2000);

  if (error) {
    logger.error("Erro ao carregar sequencias do AutoSalesEngine", { error });
    return (
      <AdminErrorState
        title="Erro ao carregar AutoSales"
        message="Não foi possível carregar as sequências automatizadas agora."
        actionHref="/admin/autosales"
        actionLabel="Recarregar"
      />
    );
  }

  type QueryRow = {
    id: string;
    lead_id: string;
    status: string;
    urgency: string | null;
    next_step: string | null;
    next_run_at: string | null;
    step_index: number;
    total_steps: number;
    fallback_required: boolean;
    fallback_reason: string | null;
    bypass_human: boolean;
    last_message_type: string | null;
    last_message_sent_at: string | null;
    created_at: string;
    leads: { nome: string | null; first_name: string | null; telefone: string | null; phone: string | null } | { nome: string | null; first_name: string | null; telefone: string | null; phone: string | null }[] | null;
  };

  const rows: AutoSalesSequenceRow[] = ((data ?? []) as unknown as QueryRow[]).map((row) => {
    const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads;
    return {
      id: row.id,
      leadId: row.lead_id,
      leadName: lead?.nome ?? lead?.first_name ?? null,
      leadPhone: lead?.telefone ?? lead?.phone ?? null,
      status: row.status,
      urgency: row.urgency,
      nextStep: row.next_step,
      nextRunAt: row.next_run_at,
      stepIndex: row.step_index,
      totalSteps: row.total_steps,
      fallbackRequired: row.fallback_required,
      fallbackReason: row.fallback_reason,
      bypassHuman: row.bypass_human,
      lastMessageType: row.last_message_type,
      lastMessageSentAt: row.last_message_sent_at,
      createdAt: row.created_at,
    };
  });

  return <AutoSalesTable rows={rows} />;
}
