import { AlertTriangle, Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { AnalyticsLoad } from "@/lib/admin/analyticsData";
import {
  ANALYTICS_PERIODS,
  ANALYTICS_ROW_CAP,
  type AnalyticsLeads,
  type Breakdown,
  type ColorRow,
  type MonthSales,
  type SeriesPoint,
} from "@/lib/admin/analyticsMetrics";
import { DASHBOARD_TIME_ZONE, formatDuration, type DashboardStock } from "@/lib/admin/dashboardMetrics";
import { cn } from "@/lib/cn";

import { axisTop, PipelineList, StockBreakdown } from "../dashboard/DashboardFigures";
import { BlockError, CARD, LINK, ScrollTable, TD, TH, Tile } from "../dashboard/DashboardView";

/**
 * Tela de Analytics. So desenha os numeros prontos: nao le banco, nao guarda
 * estado e nao usa nada do navegador.
 *
 * Tudo aqui e contagem do que esta gravado. A tela antiga mostrava previsao de
 * vendas, simulacoes e "conversao estimada" calculadas com taxas fixas; esses
 * blocos sairam porque nao tinham dado por tras.
 */

const numero = new Intl.NumberFormat("pt-BR");
const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const relogio = new Intl.DateTimeFormat("pt-BR", { timeZone: DASHBOARD_TIME_ZONE, hour: "2-digit", minute: "2-digit" });

const EMPTY = "rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]";
const H2 = "text-base font-semibold text-[var(--text)]";
const NOTE = "mb-3 text-sm text-[var(--text-muted)]";

export function formatAnalyticsClock(iso: string): string {
  return relogio.format(new Date(iso));
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${numero.format(count)} ${count === 1 ? singular : pluralForm}`;
}

function leadsLabel(value: number): string {
  return plural(value, "lead", "leads");
}

/* ------------------------------------------------------------------ */
/* Grafico de barras do periodo                                         */
/* ------------------------------------------------------------------ */

function PeriodChart({ points, unit }: { points: SeriesPoint[]; unit: "dia" | "semana" }) {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  if (total === 0 || points.length === 0) {
    return <p className={EMPTY}>Nenhum lead chegou neste período.</p>;
  }

  // Em empate, fica o mais recente.
  let peakIndex = 0;
  points.forEach((point, index) => {
    if (point.value >= points[peakIndex].value) peakIndex = index;
  });
  const peak = points[peakIndex];
  const lastIndex = points.length - 1;
  const top = axisTop(peak.value);
  const columnTitle = unit === "dia" ? "Dia" : "Semana";

  const summary = `Leads por ${unit}, de ${points[0].label} a hoje. Total: ${leadsLabel(total)}. ${
    unit === "dia" ? "Maior dia" : "Maior semana"
  }: ${peak.detail}, com ${leadsLabel(peak.value)}.`;

  return (
    <figure className="m-0">
      <div role="img" aria-label={summary} className="grid grid-cols-[auto_1fr] gap-x-2 pt-5">
        <div className="relative h-44 w-7 text-right text-[11px] tabular-nums text-[var(--text-muted)]">
          <span className="absolute right-0 top-0 -translate-y-1/2">{top}</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2">{top / 2}</span>
          <span className="absolute bottom-0 right-0 translate-y-1/2">0</span>
        </div>

        <div className="relative h-44">
          <span className="absolute inset-x-0 top-0 border-t border-dashed border-[var(--border)]" />
          <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-[var(--border)]" />
          <span className="absolute inset-x-0 bottom-0 border-t border-[var(--text-muted)]" />

          <div className="absolute inset-0 flex items-end gap-[2px]">
            {points.map((point, index) => {
              const height = (point.value / top) * 100;
              const labelled = point.value > 0 && (index === peakIndex || index === lastIndex);
              return (
                <div key={point.key} className="group relative flex h-full flex-1 items-end justify-center">
                  {point.value > 0 ? (
                    <span
                      className="block w-full max-w-[28px] rounded-t-[4px] bg-[var(--brand)] group-hover:opacity-80"
                      style={{ height: `${height}%`, minHeight: 2 }}
                    />
                  ) : null}
                  {labelled ? (
                    <span
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold tabular-nums text-[var(--text)]"
                      style={{ bottom: `calc(${height}% + 2px)` }}
                    >
                      {point.value}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "pointer-events-none absolute z-10 hidden whitespace-nowrap rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11px] text-[var(--text)] shadow-md group-hover:block",
                      index < points.length / 3
                        ? "left-0"
                        : index > (points.length * 2) / 3
                          ? "right-0"
                          : "left-1/2 -translate-x-1/2",
                    )}
                    style={{ bottom: `calc(${height}% + 4px)` }}
                  >
                    {point.detail} · {leadsLabel(point.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <span />
        <div className="mt-1.5 flex gap-[2px] text-[10px] tabular-nums text-[var(--text-muted)]">
          {points.map((point, index) => (
            <span key={point.key} className="relative h-4 flex-1">
              {point.tick ? (
                <span
                  className={cn(
                    "absolute top-0 whitespace-nowrap",
                    index === lastIndex ? "right-0" : "left-1/2 -translate-x-1/2",
                    index === lastIndex && unit === "dia" ? "font-semibold text-[var(--text)]" : "",
                  )}
                >
                  {index === lastIndex && unit === "dia" ? "hoje" : point.label}
                </span>
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
          <caption className="sr-only">Leads por {unit} no período</caption>
          <thead>
            <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
              <th scope="col" className="py-1.5 font-medium">
                {columnTitle}
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                Leads
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.key} className="border-b border-[var(--border)] last:border-0">
                <th scope="row" className="py-1.5 font-normal">
                  {point.detail}
                </th>
                <td className="py-1.5 text-right tabular-nums">{numero.format(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Tabela de divisao (origem, cidade, pagina...)                        */
/* ------------------------------------------------------------------ */

function BreakdownTable({
  caption,
  firstColumn,
  data,
  empty,
  missingLabel,
  showConverted = true,
}: {
  caption: string;
  firstColumn: string;
  data: Breakdown;
  empty: string;
  /** Fim da frase "N lead(s) não ...", no singular e no plural. */
  missingLabel?: [string, string];
  showConverted?: boolean;
}) {
  if (data.rows.length === 0) return <p className={EMPTY}>{empty}</p>;
  const max = data.rows[0].count;
  const notes = [
    data.rest > 0 ? `${leadsLabel(data.rest)} em outros grupos menores` : null,
    data.missing > 0 && missingLabel
      ? `${plural(data.missing, "lead não", "leads não")} ${missingLabel[data.missing === 1 ? 0 : 1]}`
      : null,
  ].filter(Boolean);

  return (
    <>
      <ScrollTable label={caption}>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th scope="col" className={TH}>
                {firstColumn}
              </th>
              <td aria-hidden="true" className="hidden w-1/4 sm:table-cell" />
              <th scope="col" className={cn(TH, "text-right")}>
                Leads
              </th>
              <th scope="col" className={cn(TH, "text-right", showConverted ? "" : "pr-0")}>
                Parte
              </th>
              {showConverted ? (
                <th scope="col" className={cn(TH, "pr-0 text-right")}>
                  Convertidos
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.key} className="border-b border-[var(--border)] last:border-0">
                <th scope="row" className={cn(TD, "max-w-[11rem] break-words font-medium text-[var(--text)]")}>
                  {row.label}
                </th>
                <td aria-hidden="true" className="hidden pr-3 sm:table-cell">
                  <span className="block h-2 rounded-full bg-[var(--brand-tint-100)]">
                    <span
                      className="block h-2 rounded-full bg-[var(--brand)]"
                      style={{ width: `${(row.count / max) * 100}%`, minWidth: 4 }}
                    />
                  </span>
                </td>
                <td className={cn(TD, "text-right tabular-nums")}>{numero.format(row.count)}</td>
                <td className={cn(TD, "text-right tabular-nums", showConverted ? "" : "pr-0")}>{row.pct}%</td>
                {showConverted ? (
                  <td className={cn(TD, "pr-0 text-right tabular-nums")}>{numero.format(row.converted)}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
      {notes.length ? <p className="mt-2 text-xs text-[var(--text-muted)]">{notes.join(" · ")}.</p> : null}
    </>
  );
}

function Panel({ id, title, note, children }: { id: string; title: string; note: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={CARD}>
      <h2 id={id} className={H2}>
        {title}
      </h2>
      <p className={NOTE}>{note}</p>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Blocos                                                               */
/* ------------------------------------------------------------------ */

function LeadTiles({ leads, periodDays }: { leads: AnalyticsLeads; periodDays: number }) {
  const { deltaPct, response } = leads;
  const DeltaIcon = deltaPct === null || deltaPct === 0 ? Minus : deltaPct > 0 ? TrendingUp : TrendingDown;
  const deltaText = leads.truncated
    ? "Sem comparação: o período anterior não foi lido inteiro"
    : deltaPct === null
      ? `Sem leads nos ${periodDays} dias anteriores para comparar`
      : deltaPct === 0
        ? `Igual aos ${periodDays} dias anteriores (${numero.format(leads.prevTotal)})`
        : `${numero.format(Math.abs(deltaPct))}% ${deltaPct > 0 ? "a mais" : "a menos"} que nos ${periodDays} dias anteriores (${numero.format(leads.prevTotal)})`;

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile label={`Leads em ${periodDays} dias`} value={numero.format(leads.total)}>
        <span className="inline-flex items-start gap-1">
          <DeltaIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {deltaText}
        </span>
      </Tile>

      <Tile label="Média por dia" value={numero.format(leads.perDayAvg)}>
        Total do período dividido por {periodDays} dias
      </Tile>

      <Tile label="Conversão" value={leads.conversionPct === null ? "—" : `${numero.format(leads.conversionPct)}%`}>
        {leads.conversionPct === null
          ? "Sem leads no período"
          : `${numero.format(leads.converted)} de ${leadsLabel(leads.total)} com status Convertido hoje`}
      </Tile>

      <Tile
        label="Tempo até o 1º contato"
        value={response.medianHours === null ? "—" : formatDuration(response.medianHours)}
      >
        {response.medianHours === null
          ? "Nenhum lead do período tem a data do primeiro contato gravada"
          : `Mediana de ${leadsLabel(response.sample)} com a data gravada`}
      </Tile>
    </dl>
  );
}

function ResponsePanel({ leads }: { leads: AnalyticsLeads }) {
  const { response } = leads;
  const rows = [
    { label: "Em até 1 hora", count: response.within1h },
    { label: "De 1 a 24 horas", count: response.within24h },
    { label: "Mais de 24 horas", count: response.over24h },
  ];
  return (
    <Panel
      id="an-resposta"
      title="Tempo até o primeiro contato"
      note="Da chegada do lead até a data de primeiro contato gravada. Só entram leads com essa data."
    >
      {response.sample === 0 ? (
        <p className={EMPTY}>Nenhum lead do período tem a data do primeiro contato gravada.</p>
      ) : (
        <>
          <ul className="divide-y divide-[var(--border)]">
            {rows.map((row) => {
              const pct = Math.round((row.count / response.sample) * 100);
              return (
                <li key={row.label} className="grid min-h-[44px] grid-cols-[8.5rem_1fr_auto] items-center gap-3 py-2 text-sm">
                  <span className="font-medium text-[var(--text)]">{row.label}</span>
                  <span aria-hidden="true" className="block h-2 rounded-full bg-[var(--brand-tint-100)]">
                    <span
                      className="block h-2 rounded-full bg-[var(--brand)]"
                      style={{ width: `${pct}%`, minWidth: row.count > 0 ? 4 : 0 }}
                    />
                  </span>
                  <span className="min-w-[4.5rem] text-right tabular-nums">
                    {numero.format(row.count)} <span className="text-[var(--text-muted)]">({pct}%)</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-sm text-[var(--text)]">
            Mediana: {formatDuration(response.medianHours ?? 0)} · média: {formatDuration(response.avgHours ?? 0)}.
          </p>
        </>
      )}
      {response.notRecorded > 0 ? (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {plural(response.notRecorded, "lead já saiu", "leads já saíram")} de Novo sem essa data gravada e{" "}
          {response.notRecorded === 1 ? "ficou" : "ficaram"} fora desta conta.
        </p>
      ) : null}
    </Panel>
  );
}

function ColorPanel({ rows, rest, missing }: { rows: ColorRow[]; rest: number; missing: number }) {
  const stockUnknown = rows.some((row) => row.stock === null);
  const notes = [
    rest > 0 ? `${leadsLabel(rest)} em outras cores` : null,
    missing > 0 ? `${plural(missing, "lead não informou", "leads não informaram")} cor` : null,
    stockUnknown ? "o estoque não pôde ser lido agora, por isso a última coluna está sem número" : null,
  ].filter(Boolean);

  return (
    <Panel
      id="an-cores"
      title="Cores pedidas e estoque"
      note="Cor escolhida no formulário pelos leads do período, ao lado dos filhotes disponíveis hoje nessa cor."
    >
      {rows.length === 0 ? (
        <p className={EMPTY}>Nenhum lead do período informou cor.</p>
      ) : (
        <ScrollTable label="Tabela de cores pedidas e estoque">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Cores pedidas pelos leads e filhotes disponíveis</caption>
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th scope="col" className={TH}>
                  Cor
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Leads
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Parte
                </th>
                <th scope="col" className={cn(TH, "pr-0 text-right")}>
                  Disponíveis hoje
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-[var(--border)] last:border-0">
                  <th scope="row" className={cn(TD, "font-medium text-[var(--text)]")}>
                    {row.label}
                  </th>
                  <td className={cn(TD, "text-right tabular-nums")}>{numero.format(row.count)}</td>
                  <td className={cn(TD, "text-right tabular-nums")}>{row.pct}%</td>
                  <td className={cn(TD, "pr-0 text-right tabular-nums")}>
                    {row.stock === null ? (
                      <>
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">não lido</span>
                      </>
                    ) : row.stock === 0 ? (
                      <span className="font-semibold text-[#8f1d14]">0 · sem estoque</span>
                    ) : (
                      numero.format(row.stock)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      )}
      {notes.length ? <p className="mt-2 text-xs text-[var(--text-muted)]">{capitalizeFirst(notes.join(" · "))}.</p> : null}
    </Panel>
  );
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function WeekdayPanel({ leads }: { leads: AnalyticsLeads }) {
  const max = Math.max(...leads.weekdays.map((day) => day.count));
  return (
    <Panel id="an-semana" title="Dia da semana em que os leads chegam" note="Leads do período, pelo dia em São Paulo.">
      {leads.total === 0 ? (
        <p className={EMPTY}>Nenhum lead chegou neste período.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {leads.weekdays.map((day) => (
            <li key={day.key} className="grid min-h-[40px] grid-cols-[5.5rem_1fr_auto] items-center gap-3 py-1.5 text-sm">
              <span className="font-medium text-[var(--text)]">{day.label}</span>
              <span aria-hidden="true" className="block h-2 rounded-full bg-[var(--brand-tint-100)]">
                <span
                  className="block h-2 rounded-full bg-[var(--brand)]"
                  style={{ width: `${max > 0 ? (day.count / max) * 100 : 0}%`, minWidth: day.count > 0 ? 4 : 0 }}
                />
              </span>
              <span className="min-w-[4.5rem] text-right tabular-nums">
                {numero.format(day.count)} <span className="text-[var(--text-muted)]">({day.pct}%)</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function SalesPanel({ sales, stock }: { sales: MonthSales[]; stock: DashboardStock }) {
  const total = sales.reduce((sum, month) => sum + month.count, 0);
  return (
    <Panel
      id="an-vendas"
      title="Vendas por mês"
      note="Filhotes com status Vendido, pelo mês da data de venda. O valor é o preço de tabela do cadastro, não o valor recebido."
    >
      {total === 0 ? (
        <p className={EMPTY}>Nenhum filhote vendido com data de venda nos últimos {sales.length} meses.</p>
      ) : (
        <ScrollTable label="Tabela de vendas por mês">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Filhotes vendidos por mês</caption>
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th scope="col" className={TH}>
                  Mês
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Vendidos
                </th>
                <th scope="col" className={cn(TH, "pr-0 text-right")}>
                  Preço de tabela
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.map((month) => (
                <tr key={month.key} className="border-b border-[var(--border)] last:border-0">
                  <th scope="row" className={cn(TD, "font-medium text-[var(--text)]")}>
                    {month.label}
                  </th>
                  <td className={cn(TD, "text-right tabular-nums")}>{numero.format(month.count)}</td>
                  <td className={cn(TD, "pr-0 text-right tabular-nums")}>
                    {month.count > 0 ? reais.format(month.cents / 100) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      )}
      {stock.soldWithoutDate > 0 ? (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {plural(stock.soldWithoutDate, "filhote vendido está", "filhotes vendidos estão")} sem data de venda e{" "}
          {stock.soldWithoutDate === 1 ? "ficou" : "ficaram"} fora desta tabela.
        </p>
      ) : null}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Tela                                                                 */
/* ------------------------------------------------------------------ */

export type AnalyticsViewProps = AnalyticsLoad & {
  /** Botao de atualizar; fica de fora nos testes porque depende do navegador. */
  refreshSlot?: ReactNode;
};

export function AnalyticsView({ data, configured, errors, refreshSlot }: AnalyticsViewProps) {
  const { leads, stock, sales, period, range } = data;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Analytics</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Leads que chegaram de {range.startLabel} a {range.endLabel}, no horário de São Paulo. Lido do banco às{" "}
            {formatAnalyticsClock(data.generatedAt)}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Período" className="flex gap-2">
            {ANALYTICS_PERIODS.map((days) => (
              <Link
                key={days}
                href={`/admin/analytics?period=${days}`}
                aria-current={days === period ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 text-sm font-semibold",
                  days === period
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : "border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--surface-2)]",
                )}
              >
                {days} dias
              </Link>
            ))}
          </nav>
          {refreshSlot}
        </div>
      </header>

      {!configured ? (
        <div role="alert" className="flex gap-3 rounded-2xl border border-[#ecd09a] bg-[#fff8e8] p-4 text-sm text-[#4f3000]">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">O banco de dados não está ligado neste ambiente</p>
            <p className="mt-1">
              Faltam as credenciais do banco no servidor, então nenhum número foi lido. A tela não mostra zeros para
              não parecer que não há leads nem filhotes.
            </p>
          </div>
        </div>
      ) : null}

      {errors.leads ? (
        <BlockError title="Não foi possível ler os leads agora" what="Os números de leads" error={errors.leads} />
      ) : null}
      {errors.puppies ? (
        <BlockError title="Não foi possível ler os filhotes agora" what="Os números de filhotes" error={errors.puppies} />
      ) : null}

      {leads ? (
        <>
          <section aria-labelledby="an-resumo">
            <h2 id="an-resumo" className="sr-only">
              Resumo do período
            </h2>
            <LeadTiles leads={leads} periodDays={period} />
          </section>

          <Panel
            id="an-serie"
            title={leads.granularity === "dia" ? "Leads por dia" : "Leads por semana"}
            note={
              leads.granularity === "dia"
                ? "Cada barra é um dia, no horário de São Paulo."
                : "Cada barra soma 7 dias contados de hoje para trás; a mais antiga pode ter menos dias."
            }
          >
            <PeriodChart points={leads.series} unit={leads.granularity} />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              id="an-funil"
              title="Em que etapa estão os leads"
              note="Status de hoje dos leads que chegaram no período. Toque numa etapa para abrir a lista."
            >
              <PipelineList steps={leads.pipeline} />
            </Panel>
            <ResponsePanel leads={leads} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              id="an-origem"
              title="De onde vieram os leads"
              note="Origem gravada no formulário: a fonte da campanha quando existe, senão o campo de origem."
            >
              <BreakdownTable
                caption="Tabela de origem dos leads"
                firstColumn="Origem"
                data={leads.sources}
                empty="Nenhum lead chegou neste período."
              />
            </Panel>
            <Panel
              id="an-campanha"
              title="Campanhas"
              note="Nome da campanha que veio no link do anúncio. Lead sem campanha no link não entra na tabela."
            >
              <BreakdownTable
                caption="Tabela de campanhas"
                firstColumn="Campanha"
                data={leads.campaigns}
                empty="Nenhum lead do período chegou com nome de campanha no link."
                missingLabel={["veio com campanha no link", "vieram com campanha no link"]}
              />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel id="an-cidade" title="Cidades" note="Cidade que o lead informou no formulário.">
              <BreakdownTable
                caption="Tabela de cidades dos leads"
                firstColumn="Cidade"
                data={leads.cities}
                empty="Nenhum lead do período informou cidade."
                missingLabel={["informou cidade", "informaram cidade"]}
              />
            </Panel>
            <Panel id="an-pagina" title="Página em que o lead preencheu o formulário" note="Endereço gravado junto com o lead.">
              <BreakdownTable
                caption="Tabela de páginas de origem"
                firstColumn="Página"
                data={leads.pages}
                empty="Nenhum lead do período tem a página gravada."
                missingLabel={["tem a página gravada", "têm a página gravada"]}
              />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ColorPanel rows={leads.colors.rows} rest={leads.colors.rest} missing={leads.colors.missing} />
            <Panel id="an-sexo" title="Sexo preferido" note="Preferência marcada no formulário pelos leads do período.">
              <BreakdownTable
                caption="Tabela de sexo preferido"
                firstColumn="Preferência"
                data={leads.sexes}
                empty="Nenhum lead do período informou preferência de sexo."
                missingLabel={["informou preferência", "informaram preferência"]}
                showConverted={false}
              />
            </Panel>
          </div>

          <WeekdayPanel leads={leads} />
        </>
      ) : null}

      {stock && sales ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section aria-labelledby="an-estoque" className={CARD}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="an-estoque" className={H2}>
                Filhotes por status
              </h2>
              <Link href="/admin/puppies" className={cn(LINK, "inline-flex min-h-[44px] items-center text-sm")}>
                Abrir filhotes
              </Link>
            </div>
            <p className={NOTE}>
              {plural(stock.total, "filhote cadastrado", "filhotes cadastrados")} hoje. Não depende do período escolhido.
            </p>
            <StockBreakdown stock={stock} />
          </section>
          <SalesPanel sales={sales} stock={stock} />
        </div>
      ) : null}

      {leads || stock ? (
        <p className="text-xs text-[var(--text-muted)]">
          Esta tela só conta o que está gravado no banco: não há previsão de vendas, simulação nem número estimado.
          {leads?.truncated
            ? ` A leitura parou nos ${numero.format(ANALYTICS_ROW_CAP)} leads mais recentes, então os totais podem estar abaixo do real.`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
