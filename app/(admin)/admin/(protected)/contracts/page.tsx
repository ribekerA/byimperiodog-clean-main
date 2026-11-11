"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
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
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { VirtualizedDataTable } from "@/components/admin/table/VirtualizedDataTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  parseReaisToCents,
  payloadEntries,
  payloadText,
  type ContractFeatures,
  type ContractRow,
} from "@/lib/admin/contractsAdmin";
import { adminFetch } from "@/lib/adminFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractItem = ContractRow & { access_token: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CLS: Record<string, string> = {
  pendente:  "bg-amber-100 text-amber-900",
  assinado:  "bg-[var(--brand-tint-100)] text-[var(--brand)]",
  cancelado: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  pendente:  "Pendente",
  assinado:  "Assinado",
  cancelado: "Cancelado",
};

const ACTION =
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:opacity-50";
const ACTION_NEUTRAL = `${ACTION} border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]`;
const FIELD =
  "min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]";
const FIELD_LABEL = "mb-1 block text-xs font-semibold text-[var(--text-muted)]";

function fmt(cents?: number | null) {
  if (cents === null || cents === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

/** O que cada grupo de colunas ausente deixa de funcionar, em linguagem de quem usa a tela. */
const MISSING_FEATURE_TEXT: Record<keyof ContractFeatures, string> = {
  expiry:
    "Validade do link (coluna expires_at): sem ela não dá para criar contrato novo e o link do comprador não abre.",
  signature:
    "Assinatura do comprador (coluna signature_path): sem ela a assinatura feita na tela não fica gravada.",
  zapsign:
    "ZapSign (colunas zapsign_*): o envio para assinatura no ZapSign fica desligado.",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const { push } = useToast();
  const [items,     setItems]     = useState<ContractItem[]>([]);
  const [features,  setFeatures]  = useState<ContractFeatures | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [copied,    setCopied]    = useState<string | null>(null);
  const [sending,       setSending]       = useState<string | null>(null);
  const [creating,      setCreating]      = useState(false);
  const [newPrice,      setNewPrice]      = useState("");
  const [priceError,    setPriceError]    = useState(false);
  const [newFilhote,    setNewFilhote]    = useState("");
  const [newCor,        setNewCor]        = useState("");
  const [newSexo,       setNewSexo]       = useState("");
  const [newNascimento, setNewNascimento] = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [pendingZapSign, setPendingZapSign] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://byimperiodog.com.br";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await adminFetch("/api/admin/contracts");
      const json = await res.json().catch(() => null);
      // Falha de leitura nao pode virar "Nenhum contrato ainda".
      if (!res.ok || !json?.ok) {
        setLoadError(true);
        return;
      }
      setItems(Array.isArray(json.items) ? json.items : []);
      setFeatures(json.features ?? null);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const copyLink = useCallback(async (contract: ContractItem) => {
    const link = `${baseUrl}/contract/${contract.code}?token=${encodeURIComponent(contract.access_token)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(contract.code);
      push({ type: "success", message: "Link copiado!" });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      push({ type: "error", message: "Não foi possível copiar" });
    }
  }, [baseUrl, push]);

  async function sendToZapSign(contractId: string) {
    setSending(contractId);
    try {
      const res  = await adminFetch(`/api/admin/contracts/${contractId}/zapsign`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!json?.ok) throw new Error(json?.error ?? json?.message ?? "Não foi possível enviar ao ZapSign");
      push({ type: "success", message: json.message ?? "Enviado para ZapSign!" });
      void load();
    } catch (e) {
      push({ type: "error", message: e instanceof Error ? e.message : "Erro ao enviar" });
    } finally {
      setSending(null);
    }
  }

  async function createContract(event: FormEvent) {
    event.preventDefault();
    const cents = newPrice.trim() ? parseReaisToCents(newPrice) : null;
    if (newPrice.trim() && cents === null) {
      setPriceError(true);
      return;
    }
    setPriceError(false);
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
          total_price_cents:  cents,
        }),
      });
      const json = await res.json().catch(() => null);
      if (json?.error === "puppy_id_not_null") {
        push({ type: "error", message: "O banco ainda exige um filhote vinculado ao contrato. Falta aplicar a migração pendente do banco." });
        return;
      }
      // A API manda a explicacao em "message"; "error" pode ser so um codigo.
      if (!json?.ok) throw new Error(json?.message ?? json?.error ?? "Não foi possível criar o contrato");
      push({ type: "success", message: `Contrato ${json.code} criado!` });
      setShowCreate(false);
      setNewFilhote(""); setNewCor(""); setNewSexo(""); setNewNascimento(""); setNewPrice("");
      void load();
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

  const missing = features
    ? (Object.keys(MISSING_FEATURE_TEXT) as Array<keyof ContractFeatures>).filter((key) => !features[key])
    : [];
  const canCreate = features?.expiry === true;
  const canZapSign = features?.zapsign === true;

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
          <span className="font-medium text-[var(--text)]">{payloadText(row.original.payload, "nome_filhote") || "—"}</span>
        ),
      },
      {
        id: "comprador",
        header: "Comprador",
        cell: ({ row }) => <span className="text-[var(--text-muted)]">{payloadText(row.original.payload, "nome") || "—"}</span>,
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
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[row.original.status] ?? "bg-[var(--surface-2)] text-[var(--text)]"}`}>
            {STATUS_LABEL[row.original.status] ?? row.original.status}
          </span>
        ),
      },
      {
        id: "data",
        header: "Data",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <span className="text-xs text-[var(--text-muted)]">
              {c.status === "assinado" ? `Assinado em ${fmtDate(c.signed_at)}` : `Criado em ${fmtDate(c.created_at)}`}
            </span>
          );
        },
      },
      {
        id: "acoes",
        header: "Ações",
        cell: ({ row }) => {
          const c = row.original;
          const documentLink = `${baseUrl}/contract/${c.code}/documento?token=${encodeURIComponent(c.access_token)}`;
          return (
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              {!canZapSign ? null : !c.zapsign_doc_token ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); setPendingZapSign(c.id); }}
                  disabled={sending === c.id}
                  aria-label={`Enviar o contrato ${c.code} ao ZapSign`}
                  className={`${ACTION} border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100`}>
                  {sending === c.id
                    ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                    : <Zap aria-hidden="true" className="h-4 w-4" />}
                  ZapSign
                </button>
              ) : c.signed_pdf_url ? (
                <a href={c.signed_pdf_url} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Baixar o PDF assinado do contrato ${c.code} (abre em nova aba)`}
                  className={`${ACTION} border-[var(--brand)] bg-[var(--brand-tint-100)] text-[var(--brand)]`}>
                  <Download aria-hidden="true" className="h-4 w-4" /> PDF
                </a>
              ) : c.zapsign_sign_link ? (
                <a href={c.zapsign_sign_link} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Abrir o link de assinatura do contrato ${c.code} no ZapSign (abre em nova aba)`}
                  className={`${ACTION} border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100`}>
                  <Send aria-hidden="true" className="h-4 w-4" /> Aguardando
                </a>
              ) : null}

              <button type="button" onClick={(e) => { e.stopPropagation(); void copyLink(c); }}
                aria-label={`Copiar o link do comprador do contrato ${c.code}`}
                className={ACTION_NEUTRAL}>
                {copied === c.code
                  ? <Check aria-hidden="true" className="h-4 w-4 text-[var(--brand)]" />
                  : <Copy aria-hidden="true" className="h-4 w-4" />}
                Link
              </button>

              <a href={documentLink} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Abrir o documento do contrato ${c.code} (abre em nova aba)`}
                className={ACTION_NEUTRAL}>
                <ExternalLink aria-hidden="true" className="h-4 w-4" /> Documento
              </a>

              <button type="button" onClick={(e) => { e.stopPropagation(); setExpanded(c.id); }}
                aria-label={`Ver os detalhes do contrato ${c.code}`}
                className={ACTION_NEUTRAL}>
                Detalhes
              </button>
            </div>
          );
        },
      },
    ],
    [baseUrl, sending, copied, copyLink, canZapSign],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Contratos</h1>
          <p className="text-sm text-[var(--text-muted)]">Contratos digitais de venda de filhotes: gerar o link, acompanhar e conferir.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load()} disabled={loading}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text)] shadow-sm hover:bg-[var(--surface)] disabled:opacity-50">
            <RefreshCcw aria-hidden="true" className="h-4 w-4" /> Atualizar
          </button>
          <button type="button" onClick={() => setShowCreate((v) => !v)}
            disabled={!canCreate}
            aria-expanded={showCreate}
            aria-controls="novo-contrato"
            aria-describedby={!canCreate && features ? "contratos-pendencias" : undefined}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:opacity-50">
            <Plus aria-hidden="true" className="h-4 w-4" /> Novo contrato
          </button>
        </div>
      </div>

      {/* Banco sem as colunas que o fluxo usa */}
      {!loadError && missing.length > 0 && (
        <div id="contratos-pendencias" role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:p-5">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
            O banco ainda não recebeu a atualização dos contratos
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {missing.map((key) => <li key={key}>{MISSING_FEATURE_TEXT[key]}</li>)}
          </ul>
          <p className="mt-2">
            Os contratos já gravados continuam listados abaixo. Para religar o restante, quem cuida do banco precisa aplicar as
            migrações <code className="break-all font-mono text-xs">20260828140000_security_and_lgpd_hardening.sql</code> e{" "}
            <code className="break-all font-mono text-xs">20261111120000_contracts_colunas_de_assinatura.sql</code>, da pasta supabase/migrations.
          </p>
        </div>
      )}

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
          <p className="font-semibold">Não foi possível ler os contratos agora</p>
          <p className="mt-1">Isto é uma falha de leitura, não quer dizer que não existam contratos. Tente de novo em instantes.</p>
          <button type="button" onClick={() => void load()}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-900 hover:bg-red-100">
            <RefreshCcw aria-hidden="true" className="h-4 w-4" /> Tentar de novo
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          {!loading && (
            <dl className="grid grid-cols-3 gap-3">
              {[
                { label: "Total", value: stats.total },
                { label: "Pendentes", value: stats.pendentes },
                { label: "Assinados", value: stats.assinados },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4">
                  <dt className="text-xs font-semibold text-[var(--text-muted)]">{s.label}</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums text-[var(--text)] sm:text-3xl">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Create form */}
          {showCreate && canCreate && (
            <form id="novo-contrato" onSubmit={createContract} noValidate
              className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-semibold text-[var(--text)]">Gerar novo contrato</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Você preenche os dados do filhote; o comprador preenche os dele pelo link. O link vale por 90 dias.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="new-contract-filhote" className={FIELD_LABEL}>Nome do filhote</label>
                  <input id="new-contract-filhote" value={newFilhote} onChange={(e) => setNewFilhote(e.target.value)} maxLength={160} className={FIELD} />
                </div>
                <div>
                  <label htmlFor="new-contract-cor" className={FIELD_LABEL}>Cor</label>
                  <input id="new-contract-cor" value={newCor} onChange={(e) => setNewCor(e.target.value)} maxLength={50} className={FIELD} />
                </div>
                <div>
                  <label htmlFor="new-contract-sexo" className={FIELD_LABEL}>Sexo</label>
                  <select id="new-contract-sexo" value={newSexo} onChange={(e) => setNewSexo(e.target.value)} className={FIELD}>
                    <option value="">Selecione</option>
                    <option value="Fêmea">Fêmea</option>
                    <option value="Macho">Macho</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="new-contract-nascimento" className={FIELD_LABEL}>Data de nascimento do filhote</label>
                  <input id="new-contract-nascimento" type="date" value={newNascimento} onChange={(e) => setNewNascimento(e.target.value)} className={FIELD} />
                </div>
                <div>
                  <label htmlFor="new-contract-price" className={FIELD_LABEL}>Valor total (R$)</label>
                  <input id="new-contract-price" value={newPrice} inputMode="decimal" autoComplete="off"
                    onChange={(e) => { setNewPrice(e.target.value); setPriceError(false); }}
                    aria-invalid={priceError || undefined}
                    aria-describedby="new-contract-price-help"
                    className={FIELD} />
                  <p id="new-contract-price-help" className={`mt-1 text-xs ${priceError ? "font-semibold text-red-800" : "text-[var(--text-muted)]"}`}>
                    {priceError ? "Valor inválido. Escreva como 4.500,00 ou 4500." : "Exemplo: 4.500,00"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="min-h-[44px] rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)]">
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
                  {creating
                    ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                    : <FileText aria-hidden="true" className="h-4 w-4" />}
                  Gerar link
                </button>
              </div>
            </form>
          )}

          {/* Contracts table */}
          {loading ? (
            <div role="status" className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-8">
              <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-[var(--brand)] motion-reduce:animate-none" />
              <p className="text-sm text-[var(--text-muted)]">Carregando contratos...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center">
              <FileText aria-hidden="true" className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
              <p className="mt-3 text-sm font-semibold text-[var(--text)]">Nenhum contrato gravado.</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {canCreate
                  ? "Use “Novo contrato” para gerar o primeiro link."
                  : "Criar contrato fica disponível depois da atualização do banco descrita acima."}
              </p>
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
        </>
      )}

      {/* Detalhes do contrato */}
      <Dialog open={expandedContract !== null} onOpenChange={(open) => { if (!open) setExpanded(null); }}>
        <DialogContent title={expandedContract ? `Contrato ${expandedContract.code}` : undefined} className="max-w-2xl">
          {expandedContract && (() => {
            const c = expandedContract;
            const fields = payloadEntries(c.payload);
            const contractLink = `${baseUrl}/contract/${c.code}?token=${encodeURIComponent(c.access_token)}`;
            return (
              <div className="grid gap-5 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-[var(--text-muted)]">Dados do contrato</h3>
                  {fields.length === 0 ? (
                    <p className="text-[var(--text-muted)]">Nada preenchido ainda.</p>
                  ) : (
                    <dl className="space-y-1">
                      {fields.map((field) => (
                        <div key={field.key} className="flex flex-wrap gap-x-1.5">
                          <dt className="text-[var(--text-muted)]">{field.label}:</dt>
                          <dd className="break-words text-[var(--text)]">{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)]">Documentos</h3>
                    <p className="flex items-center gap-1.5 text-[var(--text)]">
                      {c.hemograma_path && <Check aria-hidden="true" className="h-4 w-4 text-[var(--brand)]" />}
                      Hemograma: {c.hemograma_path ? "enviado" : "pendente"}
                    </p>
                    <p className="flex items-center gap-1.5 text-[var(--text)]">
                      {c.laudo_path && <Check aria-hidden="true" className="h-4 w-4 text-[var(--brand)]" />}
                      Laudo veterinário: {c.laudo_path ? "enviado" : "pendente"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)]">ZapSign</h3>
                    {!canZapSign ? (
                      <p className="text-[var(--text-muted)]">Desligado até a atualização do banco.</p>
                    ) : c.zapsign_doc_token ? (
                      <div className="space-y-1">
                        <p className="text-[var(--text)]">
                          Status: <span className="font-semibold">{c.zapsign_status ?? "—"}</span>
                        </p>
                        {c.zapsign_sign_link && !c.signed_pdf_url && (
                          <a href={c.zapsign_sign_link} target="_blank" rel="noopener noreferrer"
                            className="inline-flex min-h-[44px] items-center font-semibold text-violet-800 underline">
                            Link de assinatura (abre em nova aba)
                          </a>
                        )}
                        {c.signed_pdf_url && (
                          <a href={c.signed_pdf_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-[var(--brand)] underline">
                            <Download aria-hidden="true" className="h-4 w-4" /> Baixar PDF assinado
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-[var(--text-muted)]">Ainda não enviado. Use o botão “ZapSign” na lista.</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)]">Link do comprador</h3>
                    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white py-1 pl-3 pr-1 font-mono text-xs text-[var(--text)]">
                      <span className="min-w-0 flex-1 truncate">{contractLink}</span>
                      <button type="button" onClick={() => void copyLink(c)}
                        aria-label="Copiar o link do comprador"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--brand)] hover:bg-[var(--surface)]">
                        {copied === c.code ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                      </button>
                    </div>
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
