"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Bot, UserCheck } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { VirtualizedDataTable } from "@/components/admin/table/VirtualizedDataTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export type AutoSalesSequenceRow = {
  id: string;
  leadId: string;
  leadName: string | null;
  leadPhone: string | null;
  status: string;
  urgency: string | null;
  nextStep: string | null;
  nextRunAt: string | null;
  stepIndex: number;
  totalSteps: number;
  fallbackRequired: boolean;
  fallbackReason: string | null;
  bypassHuman: boolean;
  lastMessageType: string | null;
  lastMessageSentAt: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendada",
  needs_human: "Precisa de humano",
  manual: "Assumida (humano)",
  completed: "Concluída",
};

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
  needs_human: "bg-rose-50 text-rose-700 ring-rose-200",
  manual: "bg-[var(--brand-tint-50)] text-[var(--brand)] ring-[var(--brand-tint-200)]",
  completed: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

const URGENCY_LABEL: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AutoSalesTable({ rows: initialRows }: { rows: AutoSalesSequenceRow[] }) {
  const { push } = useToast();
  const [rows, setRows] = useState(initialRows);
  const [pendingAssume, setPendingAssume] = useState<AutoSalesSequenceRow | null>(null);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.total += 1;
        if (r.status === "scheduled") acc.active += 1;
        if (r.status === "needs_human" || r.fallbackRequired) acc.needsHuman += 1;
        return acc;
      },
      { total: 0, active: 0, needsHuman: 0 },
    );
  }, [rows]);

  const assumeConversation = () => {
    if (!pendingAssume) return;
    const seq = pendingAssume;
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/autosales/assume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequenceId: seq.id }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json?.error || "Erro ao assumir conversa");
        setRows((prev) =>
          prev.map((r) => (r.id === seq.id ? { ...r, status: "manual", bypassHuman: true, nextStep: null, nextRunAt: null, fallbackRequired: false } : r)),
        );
        push({ type: "success", message: `Conversa com ${seq.leadName ?? "lead"} assumida — o AutoSales IA parou de enviar mensagens.` });
      } catch (e) {
        push({ type: "error", message: (e as Error).message });
      } finally {
        setPendingAssume(null);
      }
    });
  };

  const columns = useMemo<ColumnDef<AutoSalesSequenceRow, unknown>[]>(
    () => [
      {
        id: "lead",
        header: "Lead",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
              <a href={`/admin/leads/${r.leadId}`} className="font-semibold text-[var(--brand)] hover:underline">
                {r.leadName ?? "Lead sem nome"}
              </a>
              {r.leadPhone && <p className="text-xs text-[var(--text-muted)]">{r.leadPhone}</p>}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLE[r.status] ?? "bg-zinc-100 text-zinc-600 ring-zinc-200"}`}>
              {STATUS_LABEL[r.status] ?? r.status}
            </span>
          );
        },
      },
      {
        id: "urgencia",
        header: "Urgência",
        cell: ({ row }) => (row.original.urgency ? URGENCY_LABEL[row.original.urgency] ?? row.original.urgency : "—"),
      },
      {
        id: "progresso",
        header: "Progresso",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
              {r.stepIndex}/{r.totalSteps}
              {r.nextStep && <p className="text-xs text-[var(--text-muted)]">Próximo: {r.nextStep}</p>}
            </div>
          );
        },
      },
      {
        id: "nextRun",
        header: "Próxima execução",
        cell: ({ row }) => fmtDateTime(row.original.nextRunAt),
      },
      {
        id: "fallback",
        header: "Fallback",
        cell: ({ row }) => {
          const r = row.original;
          return r.fallbackRequired ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600" title={r.fallbackReason ?? undefined}>
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Sim
            </span>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">Não</span>
          );
        },
      },
      {
        id: "acao",
        header: "Ação",
        cell: ({ row }) => {
          const r = row.original;
          return r.status === "manual" || r.status === "completed" ? (
            <span className="text-xs text-[var(--text-muted)]">—</span>
          ) : (
            <button
              type="button"
              onClick={() => setPendingAssume(r)}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
            >
              <UserCheck className="h-3.5 w-3.5" aria-hidden /> Assumir conversa
            </button>
          );
        },
      },
    ],
    [pending],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-[var(--brand)]" aria-hidden />
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">AutoSales IA</h1>
          <p className="text-sm text-[var(--text-muted)]">Sequências automatizadas de follow-up por WhatsApp geradas para cada lead.</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
        <div className="rounded-xl border border-[var(--border)] bg-white p-3">
          <p className="text-xs text-[var(--text-muted)]">Total</p>
          <p className="text-xl font-bold text-[var(--text)]">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-3">
          <p className="text-xs text-[var(--text-muted)]">Ativas</p>
          <p className="text-xl font-bold text-sky-600">{counts.active}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-3">
          <p className="text-xs text-[var(--text-muted)]">Precisam de humano</p>
          <p className="text-xl font-bold text-rose-600">{counts.needsHuman}</p>
        </div>
      </div>

      <VirtualizedDataTable
        columns={columns}
        data={rows}
        height={560}
        enableSelection={false}
        emptyState="Nenhuma sequência automatizada encontrada."
        role="table"
        aria-label="Sequências automatizadas do AutoSales IA por lead"
      />

      <ConfirmDialog
        open={pendingAssume !== null}
        onOpenChange={(open) => { if (!open) setPendingAssume(null); }}
        title="Assumir esta conversa manualmente?"
        description={`O AutoSales IA vai parar de enviar mensagens automáticas para ${
          pendingAssume?.leadName ?? "este lead"
        }. Use quando você for continuar o atendimento pessoalmente.`}
        confirmLabel="Assumir conversa"
        variant="warning"
        onConfirm={assumeConversation}
      />
    </div>
  );
}
