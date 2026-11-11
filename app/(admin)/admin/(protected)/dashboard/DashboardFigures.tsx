import Link from "next/link";

import type { DashboardStock, DayPoint, PipelineStep } from "@/lib/admin/dashboardMetrics";
import { cn } from "@/lib/cn";

/**
 * Figuras do dashboard, desenhadas no servidor (HTML e CSS, sem biblioteca de
 * grafico e sem JavaScript no navegador).
 *
 * Toda figura tem os mesmos numeros em texto logo ao lado ou abaixo: leitor de
 * tela e celular (onde nao existe "passar o mouse") leem a lista ou a tabela.
 */

const numero = new Intl.NumberFormat("pt-BR");

/* ------------------------------------------------------------------ */
/* Leads por dia                                                        */
/* ------------------------------------------------------------------ */

const DEGRAUS_DO_EIXO = [4, 6, 8, 10, 12, 16, 20, 30, 40, 50, 60, 80, 100];

/** Topo do eixo: o primeiro degrau "redondo" e par que cabe o maior valor. */
export function axisTop(max: number): number {
  const degrau = DEGRAUS_DO_EIXO.find((value) => value >= max);
  if (degrau) return degrau;
  const potencia = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / potencia) * potencia;
}

function leadsLabel(value: number): string {
  return `${numero.format(value)} ${value === 1 ? "lead" : "leads"}`;
}

export function LeadsByDayChart({ days }: { days: DayPoint[] }) {
  const total = days.reduce((sum, day) => sum + day.value, 0);

  if (total === 0 || days.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]">
        Nenhum lead nos últimos {days.length || 14} dias.
      </p>
    );
  }

  // Em empate, fica o dia mais recente.
  let peakIndex = 0;
  days.forEach((day, index) => {
    if (day.value >= days[peakIndex].value) peakIndex = index;
  });
  const peak = days[peakIndex];
  const todayIndex = days.length - 1;
  const top = axisTop(peak.value);
  const first = days[0];
  const last = days[todayIndex];

  const summary = `Leads por dia, de ${first.label} a ${last.label}. Total: ${leadsLabel(total)}. Maior dia: ${peak.label}, com ${leadsLabel(peak.value)}. Hoje: ${leadsLabel(last.value)}.`;

  return (
    <figure className="m-0">
      <div role="img" aria-label={summary} className="grid grid-cols-[auto_1fr] gap-x-2 pt-5">
        <div className="relative h-40 w-6 text-right text-[11px] tabular-nums text-[var(--text-muted)]">
          <span className="absolute right-0 top-0 -translate-y-1/2">{top}</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2">{top / 2}</span>
          <span className="absolute bottom-0 right-0 translate-y-1/2">0</span>
        </div>

        <div className="relative h-40">
          <span className="absolute inset-x-0 top-0 border-t border-dashed border-[var(--border)]" />
          <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-[var(--border)]" />
          <span className="absolute inset-x-0 bottom-0 border-t border-[var(--text-muted)]" />

          <div className="absolute inset-0 flex items-end gap-[2px]">
            {days.map((day, index) => {
              const height = (day.value / top) * 100;
              const labelled = day.value > 0 && (index === peakIndex || index === todayIndex);
              return (
                <div key={day.key} className="group relative flex h-full flex-1 items-end justify-center">
                  {day.value > 0 ? (
                    <span
                      className="block w-full max-w-[24px] rounded-t-[4px] bg-[var(--brand)] group-hover:opacity-80"
                      style={{ height: `${height}%`, minHeight: 2 }}
                    />
                  ) : null}
                  {labelled ? (
                    <span
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold tabular-nums text-[var(--text)]"
                      style={{ bottom: `calc(${height}% + 2px)` }}
                    >
                      {day.value}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "pointer-events-none absolute z-10 hidden whitespace-nowrap rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11px] text-[var(--text)] shadow-md group-hover:block",
                      index < 3 ? "left-0" : index > days.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2",
                    )}
                    style={{ bottom: `calc(${height}% + 4px)` }}
                  >
                    {day.label} ({day.weekday}) · {leadsLabel(day.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <span />
        <div className="mt-1.5 flex gap-[2px] text-[10px] tabular-nums text-[var(--text-muted)]">
          {days.map((day, index) => (
            <span key={day.key} className="flex-1 whitespace-nowrap text-center">
              {index === todayIndex ? (
                <span className="font-semibold text-[var(--text)]">hoje</span>
              ) : (todayIndex - index) % 2 === 0 ? (
                day.label
              ) : null}
            </span>
          ))}
        </div>
      </div>

      <details className="mt-3 text-sm">
        <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-medium text-[var(--brand)] underline-offset-2 hover:underline">
          Ver os números em tabela
        </summary>
        <table className="mt-1 w-full max-w-xs text-left text-sm">
          <caption className="sr-only">Leads por dia nos últimos {days.length} dias</caption>
          <thead>
            <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
              <th scope="col" className="py-1.5 font-medium">
                Dia
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                Leads
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.key} className="border-b border-[var(--border)] last:border-0">
                <th scope="row" className="py-1.5 font-normal">
                  {day.label} <span className="text-[var(--text-muted)]">({day.weekday})</span>
                </th>
                <td className="py-1.5 text-right tabular-nums">{numero.format(day.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Funil de leads                                                       */
/* ------------------------------------------------------------------ */

export function PipelineList({ steps }: { steps: PipelineStep[] }) {
  return (
    <ul className="divide-y divide-[var(--border)]">
      {steps.map((step) => (
        <li key={step.status}>
          <Link
            href={`/admin/leads?status=${step.status}`}
            className="grid min-h-[44px] grid-cols-[6.5rem_1fr_auto] items-center gap-3 rounded-md py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            <span className="font-medium">{step.label}</span>
            <span aria-hidden="true" className="block h-2 rounded-full bg-[var(--brand-tint-100)]">
              <span
                className="block h-2 rounded-full bg-[var(--brand)]"
                style={{ width: `${step.pct}%`, minWidth: step.count > 0 ? 4 : 0 }}
              />
            </span>
            <span className="min-w-[4.5rem] text-right tabular-nums">
              {numero.format(step.count)} <span className="text-[var(--text-muted)]">({step.pct}%)</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Estoque por status                                                   */
/* ------------------------------------------------------------------ */

// Cores conferidas no validador de paleta (daltonismo e contraste) nesta ordem.
// O verde claro tem contraste baixo com o branco, por isso cada fatia tem o
// nome e o numero escritos na lista abaixo da barra.
const STOCK_SEGMENTS = [
  { key: "available", label: "Disponíveis", color: "#1baf7a" },
  { key: "reserved", label: "Reservados", color: "#eb6834" },
  { key: "sold", label: "Vendidos", color: "#2a78d6" },
  { key: "unavailable", label: "Indisponíveis", color: "#8a8a85" },
] as const;

export function StockBreakdown({ stock }: { stock: DashboardStock }) {
  if (stock.total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]">
        Nenhum filhote cadastrado.
      </p>
    );
  }

  const segments = STOCK_SEGMENTS.map((segment) => ({ ...segment, count: stock[segment.key] }));

  return (
    <div>
      <div aria-hidden="true" className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]">
        {segments
          .filter((segment) => segment.count > 0)
          .map((segment) => (
            <span
              key={segment.key}
              className="block h-3 min-w-[4px] basis-0"
              style={{ flexGrow: segment.count, backgroundColor: segment.color }}
            />
          ))}
      </div>

      <ul className="mt-2 divide-y divide-[var(--border)]">
        {segments.map((segment) => (
          <li key={segment.key}>
            <Link
              href={`/admin/puppies?status=${segment.key}`}
              className="flex min-h-[44px] items-center gap-3 rounded-md py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)]"
            >
              <span
                aria-hidden="true"
                className="block h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: segment.color }}
              />
              <span className="flex-1 font-medium">{segment.label}</span>
              <span className="tabular-nums">
                {numero.format(segment.count)}{" "}
                <span className="text-[var(--text-muted)]">
                  ({Math.round((segment.count / stock.total) * 100)}%)
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
