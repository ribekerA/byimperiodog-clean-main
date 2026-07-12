"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  RefreshCcw,
  Send,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { VirtualizedDataTable } from "@/components/admin/table/VirtualizedDataTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { adminFetch } from "@/lib/adminFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractItem = {
  id: string;
  code: string;
  status: "pendente" | "assinado" | "cancelado";
  signed_at: string | null;
  created_at: string;
  payload: Record<string, string> | null;
  hemograma_path: string | null;
  laudo_path: string | null;
  signature_path: string | null;
  total_price_cents: number | null;
  zapsign_doc_token: string | null;
  zapsign_sign_link: string | null;
  zapsign_status: string | null;
  signed_pdf_url: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CLS = {
  pendente:  "bg-amber-100 text-amber-700",
  assinado:  "bg-[var(--brand-tint-100)] text-[var(--brand)]",
  cancelado: "bg-red-100 text-red-700",
};

const STATUS_LABEL = {
  pendente:  "Pendente",
  assinado:  "Assinado",
  cancelado: "Cancelado",
};

function fmt(cents?: number | null) {
  if (!cents) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const { push } = useToast();
  const [items,     setItems]     = useState<ContractItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [copied,    setCopied]    = useState<string | null>(null);
  const [sending,       setSending]       = useState<string | null>(null);
  const [creating,      setCreating]      = useState(false);
  const [newPrice,      setNewPrice]      = useState("");
  const [newFilhote,    setNewFilhote]    = useState("");
  const [newCor,        setNewCor]        = useState("");
  const [newSexo,       setNewSexo]       = useState("");
  const [newNascimento, setNewNascimento] = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [pendingZapSign, setPendingZapSign] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://www.byimperiodog.com.br";

  async function load() {
    setLoading(true);
    try {
      const res  = await adminFetch("/api/admin/contracts");
      const json = await res.json();
      setItems(json.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function copyLink(code: string) {
    const link = `${baseUrl}/contract/${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(code);
      push({ type: "success", message: "Link copiado!" });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      push({ type: "error", message: "Não foi possível copiar" });
    }
  }

  async function sendToZapSign(contractId: string) {
    setSending(contractId);
    try {
      const res  = await adminFetch(`/api/admin/contracts/${contractId}/zapsign`, { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? json.message ?? "Erro");
      push({ type: "success", message: json.message ?? "Enviado para ZapSign!" });
      load();
    } catch (e) {
      push({ type: "error", message: e instanceof Error ? e.message : "Erro ao enviar" });
    } finally {
      setSending(null);
    }
  }

  async function createContract() {
    setCreating(true);
    try {
      const res  = await adminFetch("/api/admin/contracts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nome_filhote:       newFilhote.trim()    || undefined,
          cor:                newCor.trim()        || undefined,
          sexo:               newSexo              || undefined,
          nascimento_filhote: newNascimento        || undefined,
          total_price_cents:  newPrice ? Math.round(parseFloat(newPrice.replace(",", ".")) * 100) : null,
        }),
      });
      const json = await res.json();
      if (json.error === "puppy_id_not_null") {
        push({ type: "error", message: "Contrato sem filhote vinculado ainda não é suportado — peça para o time técnico aplicar a migração pendente do banco." });
        return;
      }
      if (!json.ok) throw new Error(json.error);
      push({ type: "success", message: `Contrato ${json.code} criado!` });
      setShowCreate(false);
      setNewFilhote(""); setNewCor(""); setNewSexo(""); setNewNascimento(""); setNewPrice("");
      load();
    } catch (e) {
      push({ type: "error", message: e instanceof Error ? e.message : "Erro ao criar contrato" });
    } finally {
      setCreating(false);
    }
  }

  const stats = {
    total:     items.length,
    pendentes: items.filter((c) => c.status === "pendente").length,
    assinados: items.filter((c) => c.status === "assinado").length,
  };

  const expandedContract = items.find((c) => c.id === expanded) ?? null;

  const columns = useMemo<ColumnDef<ContractItem, unknown>[]>(
    () => [
      {
        id: "codigo",
        header: "Código",
        cell: ({ row }) => <span className="font-mono text-xs font-semibold text-[var(--text)]">{row.original.code}</span>,
      },
      {
        id: "filhote",
        header: "Filhote",
        cell: ({ row }) => (
          <span className="font-medium text-[var(--text)]">{(row.original.payload as Record<string, string> | null)?.nome_filhote ?? "—"}</span>
        ),
      },
      {
        id: "comprador",
        header: "Comprador",
        cell: ({ row }) => <span className="text-[var(--text-muted)]">{(row.original.payload as Record<string, string> | null)?.nome ?? "—"}</span>,
      },
      {
        id: "valor",
        header: "Valor",
        cell: ({ row }) => <span className="font-semibold text-[var(--text)]">{fmt(row.original.total_price_cents)}</span>,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLS[row.original.status]}`}>
            {STATUS_LABEL[row.original.status]}
          </span>
        ),
      },
      {
        id: "data",
        header: "Data",
        cell: ({ row }) => {
          const c = row.original;
          return <span className="text-xs text-[var(--text-muted)]">{c.status === "assinado" ? fmtDate(c.signed_at) : fmtDate(c.created_at)}</span>;
        },
      },
      {
        id: "acoes",
        header: "Ações",
        cell: ({ row }) => {
          const c = row.original;
          const contractLink = `${baseUrl}/contract/${c.code}`;
          return (
            <div className="flex items-center gap-1 flex-wrap">
              {!c.zapsign_doc_token ? (
                <button onClick={(e) => { e.stopPropagation(); setPendingZapSign(c.id); }}
                  disabled={sending === c.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-violet-300 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50">
                  {sending === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  ZapSign
                </button>
              ) : c.signed_pdf_url ? (
                <a href={c.signed_pdf_url} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--brand-tint-300)] bg-[var(--brand-tint-50)] px-2 py-1 text-[11px] font-semibold text-[var(--brand)] hover:bg-[var(--brand-tint-100)]">
                  <Download className="h-3 w-3" /> PDF
                </a>
              ) : c.zapsign_sign_link ? (
                <a href={c.zapsign_sign_link} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100">
                  <Send className="h-3 w-3" /> Aguardando
                </a>
              ) : null}

              <button onClick={(e) => { e.stopPropagation(); copyLink(c.code); }}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface)]">
                {copied === c.code ? <Check className="h-3 w-3 text-[var(--brand)]" /> : <Copy className="h-3 w-3" />}
                Link
              </button>

              <a href={`${contractLink}/documento`} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface)]">
                <ExternalLink className="h-3 w-3" />
              </a>

              <button onClick={(e) => { e.stopPropagation(); setExpanded(c.id); }}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface)]">
                Detalhes
              </button>
            </div>
          );
        },
      },
    ],
    [baseUrl, sending, copied],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Contratos</h1>
          <p className="text-sm text-[var(--text-muted)]">Gerencie os contratos digitais de venda de filhotes.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] shadow-sm">
            <RefreshCcw className="h-4 w-4" /> Atualizar
          </button>
          <button onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]">
            <Plus className="h-4 w-4" /> Novo contrato
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total", value: stats.total, cls: "border-[var(--border)]" },
          { label: "Pendentes", value: stats.pendentes, cls: "border-amber-200 bg-amber-50" },
          { label: "Assinados", value: stats.assinados, cls: "border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)]" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-5 py-4 bg-white ${s.cls}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-[var(--text)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-base font-semibold text-[var(--text)]">Gerar novo contrato</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="new-contract-filhote" className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Nome do filhote</label>
              <input id="new-contract-filhote" value={newFilhote} onChange={(e) => setNewFilhote(e.target.value)} placeholder="Aurora"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none" />
            </div>
            <div>
              <label htmlFor="new-contract-cor" className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Cor</label>
              <input id="new-contract-cor" value={newCor} onChange={(e) => setNewCor(e.target.value)} placeholder="Laranja"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none" />
            </div>
            <div>
              <label htmlFor="new-contract-sexo" className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Sexo</label>
              <select id="new-contract-sexo" value={newSexo} onChange={(e) => setNewSexo(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none">
                <option value="">Selecione</option>
                <option value="Fêmea">Fêmea</option>
                <option value="Macho">Macho</option>
              </select>
            </div>
            <div>
              <label htmlFor="new-contract-nascimento" className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Data de nascimento do filhote</label>
              <input id="new-contract-nascimento" type="date" value={newNascimento} onChange={(e) => setNewNascimento(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none" />
            </div>
            <div>
              <label htmlFor="new-contract-price" className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Valor total (R$)</label>
              <input id="new-contract-price" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="3500"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)]">
              Cancelar
            </button>
            <button onClick={createContract} disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Gerar link
            </button>
          </div>
        </div>
      )}

      {/* Contracts table */}
      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-8">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" />
          <p className="text-sm text-[var(--text-muted)]">Carregando contratos...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
          <p className="mt-3 text-sm font-semibold text-[var(--text)]">Nenhum contrato ainda.</p>
          <p className="text-xs text-[var(--text-muted)]">Clique em "Novo contrato" para gerar o primeiro link.</p>
        </div>
      ) : (
        <VirtualizedDataTable
          columns={columns}
          data={items}
          height={560}
          enableSelection={false}
          role="table"
          aria-label="Contratos digitais de venda de filhotes"
          className="shadow-sm"
        />
      )}

      {/* Detalhes do contrato */}
      <Dialog open={expandedContract !== null} onOpenChange={(open) => { if (!open) setExpanded(null); }}>
        <DialogContent title={expandedContract ? `Contrato ${expandedContract.code}` : undefined} className="max-w-2xl">
          {expandedContract && (() => {
            const c = expandedContract;
            const buyer = c.payload as Record<string, string> | null;
            const contractLink = `${baseUrl}/contract/${c.code}`;
            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                {buyer && (
                  <div className="space-y-1">
                    <p className="font-bold uppercase tracking-widest text-[var(--text-muted)]">Comprador</p>
                    {Object.entries(buyer).map(([k, v]) => (
                      <p key={k} className="text-[var(--text)]"><span className="text-[var(--text-muted)] capitalize">{k}:</span> {v}</p>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="font-bold uppercase tracking-widest text-[var(--text-muted)]">Documentos</p>
                  {c.hemograma_path ? (
                    <p className="flex items-center gap-1.5 text-[var(--brand)]">
                      <Check className="h-3 w-3" /> Hemograma enviado
                    </p>
                  ) : (
                    <p className="text-zinc-400">Hemograma — pendente</p>
                  )}
                  {c.laudo_path ? (
                    <p className="flex items-center gap-1.5 text-[var(--brand)]">
                      <Check className="h-3 w-3" /> Laudo enviado
                    </p>
                  ) : (
                    <p className="text-zinc-400">Laudo veterinário — pendente</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="font-bold uppercase tracking-widest text-[var(--text-muted)]">ZapSign</p>
                  {c.zapsign_doc_token ? (
                    <div className="space-y-1">
                      <p className="text-[var(--text)]">
                        Status: <span className="font-semibold">{c.zapsign_status ?? "—"}</span>
                      </p>
                      {c.zapsign_sign_link && !c.signed_pdf_url && (
                        <a href={c.zapsign_sign_link} target="_blank" rel="noopener noreferrer"
                          className="text-violet-700 underline text-[11px]">
                          Link de assinatura →
                        </a>
                      )}
                      {c.signed_pdf_url && (
                        <a href={c.signed_pdf_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--brand)] underline text-[11px]">
                          <Download className="h-3 w-3" /> Baixar PDF assinado
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-[11px]">Não enviado. Clique em "ZapSign" para enviar.</p>
                  )}

                  <p className="font-bold uppercase tracking-widest text-[var(--text-muted)] mt-2">Link do comprador</p>
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 font-mono text-[10px] text-[var(--text)]">
                    <span className="flex-1 truncate">{contractLink}</span>
                    <button onClick={() => copyLink(c.code)} className="flex-shrink-0 text-[var(--brand)] hover:text-[var(--brand-hover)]">
                      {copied === c.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingZapSign !== null}
        onOpenChange={(open) => { if (!open) setPendingZapSign(null); }}
        title="Enviar contrato para assinatura no ZapSign?"
        description="Isso cria um documento no ZapSign e envia o link de assinatura ao comprador. Confira os dados do contrato antes de continuar."
        confirmLabel="Sim, enviar"
        onConfirm={() => {
          if (pendingZapSign) void sendToZapSign(pendingZapSign);
        }}
      />
    </div>
  );
}
