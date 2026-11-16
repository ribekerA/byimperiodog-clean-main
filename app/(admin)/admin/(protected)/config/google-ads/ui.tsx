"use client";

// Pecas pequenas compartilhadas pelos paineis do Google Ads.
//
// Formatacao de dinheiro e de porcentagem fica aqui porque a tela mostra os
// mesmos numeros em quatro lugares, e numero de midia paga lido errado faz
// decisao errada: "R$ 4.500" e "R$ 45,00" diferem por um ponto.

import type { ReactNode } from "react";

export const PERIODOS_TELA = [
  { valor: "LAST_7_DAYS", label: "Ultimos 7 dias" },
  { valor: "LAST_14_DAYS", label: "Ultimos 14 dias" },
  { valor: "LAST_30_DAYS", label: "Ultimos 30 dias" },
  { valor: "THIS_MONTH", label: "Este mes" },
  { valor: "LAST_MONTH", label: "Mes passado" },
] as const;

export function reais(valor: number | null | undefined): string {
  const n = typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function numero(valor: number | null | undefined): string {
  const n = typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function porcentagem(valor: number | null | undefined): string {
  const n = typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

const STATUS_TELA: Record<string, { texto: string; classe: string }> = {
  ENABLED: { texto: "Ativa", classe: "bg-emerald-100 text-emerald-800" },
  PAUSED: { texto: "Pausada", classe: "bg-amber-100 text-amber-800" },
  REMOVED: { texto: "Removida", classe: "bg-slate-200 text-slate-700" },
};

export function Selo({ status }: { status: string }) {
  const s = STATUS_TELA[status] ?? { texto: status, classe: "bg-slate-200 text-slate-700" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.classe}`}>{s.texto}</span>
  );
}

export function Cartao({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">{titulo}</h2>
          {descricao ? <p className="text-sm text-[var(--text-muted)]">{descricao}</p> : null}
        </div>
        {acao ? <div className="flex-shrink-0">{acao}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Aviso({
  tom = "info",
  titulo,
  children,
}: {
  tom?: "info" | "alerta" | "erro" | "ok";
  titulo?: string;
  children: ReactNode;
}) {
  const classes = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    alerta: "border-amber-300 bg-amber-50 text-amber-900",
    erro: "border-red-300 bg-red-50 text-red-900",
    ok: "border-emerald-300 bg-emerald-50 text-emerald-900",
  }[tom];
  return (
    <div className={`rounded-2xl border p-4 text-sm ${classes}`} role={tom === "erro" ? "alert" : undefined}>
      {titulo ? <p className="mb-1 font-semibold">{titulo}</p> : null}
      {children}
    </div>
  );
}

export function Botao({
  children,
  onClick,
  tipo = "primario",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  tipo?: "primario" | "secundario" | "perigo";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const classes = {
    primario: "bg-[var(--brand)] text-white hover:opacity-90",
    secundario: "border border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--surface)]",
    perigo: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
  }[tipo];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
    >
      {children}
    </button>
  );
}

export function Campo({
  label,
  ajuda,
  children,
}: {
  label: string;
  ajuda?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
      {children}
      {ajuda ? <span className="block text-xs text-[var(--text-muted)]">{ajuda}</span> : null}
    </label>
  );
}

export const entradaClasse =
  "w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]";

export function ListaDeProblemas({ problemas }: { problemas: string[] }) {
  if (problemas.length === 0) return null;
  return (
    <Aviso tom="erro" titulo="Corrija antes de continuar">
      <ul className="list-disc space-y-1 pl-5">
        {problemas.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </Aviso>
  );
}

/**
 * Le a resposta de erro das rotas do Ads.
 *
 * As rotas devolvem tres formatos (lista de problemas, mensagem da API do
 * Google, erro generico). Tratar os tres num lugar evita a tela mostrar
 * "undefined" quando o Google recusa alguma coisa.
 */
export async function lerErro(resposta: Response): Promise<{ mensagem: string; problemas: string[] }> {
  let corpo: Record<string, unknown> = {};
  try {
    corpo = (await resposta.json()) as Record<string, unknown>;
  } catch {
    corpo = {};
  }
  const problemas = Array.isArray(corpo.problemas) ? (corpo.problemas as string[]) : [];
  const mensagem =
    (typeof corpo.mensagem === "string" && corpo.mensagem) ||
    (typeof corpo.aviso === "string" && corpo.aviso) ||
    (typeof corpo.error === "string" && corpo.error) ||
    `A requisicao falhou (${resposta.status}).`;
  return { mensagem, problemas };
}
