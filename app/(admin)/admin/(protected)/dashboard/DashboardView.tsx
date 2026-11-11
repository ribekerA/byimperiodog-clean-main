import { AlertCircle, AlertTriangle, ArrowRight, Info, Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { LeadStatus } from "@/domain/lead-status";
import type { DashboardBlockError, DashboardLoad } from "@/lib/admin/dashboardData";
import {
  DASHBOARD_TIME_ZONE,
  ROW_LIMIT,
  formatAge,
  formatDuration,
  type DashboardLeads,
  type DashboardStock,
  type Recommendation,
  type RecommendationSeverity,
} from "@/lib/admin/dashboardMetrics";
import { cn } from "@/lib/cn";

import { LeadsByDayChart, PipelineList, StockBreakdown } from "./DashboardFigures";

/**
 * Tela do dashboard. So desenha: recebe os numeros prontos e nao le banco,
 * nao guarda estado e nao usa nada do navegador. Por isso da para testar a
 * tela inteira (inclusive acessibilidade) sem entrar no painel.
 */

const numero = new Intl.NumberFormat("pt-BR");
const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const relogio = new Intl.DateTimeFormat("pt-BR", { timeZone: DASHBOARD_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const diaMes = new Intl.DateTimeFormat("pt-BR", { timeZone: DASHBOARD_TIME_ZONE, day: "2-digit", month: "2-digit" });

/** "14:05", no horario de Sao Paulo. */
export function formatClock(iso: string): string {
  return relogio.format(new Date(iso));
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${numero.format(count)} ${count === 1 ? singular : pluralForm}`;
}

export const CARD = "rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5";
export const LINK = "font-medium text-[var(--brand)] underline underline-offset-2 hover:no-underline";

/* ------------------------------------------------------------------ */
/* Pecas pequenas                                                       */
/* ------------------------------------------------------------------ */

export function Tile({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className={cn(CARD, "flex flex-col")}>
      <dt className="text-xs font-medium text-[var(--text-muted)] sm:text-sm">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold tabular-nums leading-tight text-[var(--text)]">{value}</dd>
      {children ? <dd className="mt-2 text-xs leading-snug text-[var(--text-muted)] sm:text-sm">{children}</dd> : null}
    </div>
  );
}

export function BlockError({ title, what, error }: { title: string; what: string; error: DashboardBlockError }) {
  return (
    <div role="alert" className="flex gap-3 rounded-2xl border border-[#e9b4ae] bg-[#fdf1ef] p-4 text-sm text-[#5c1009]">
      <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1">
          {what} ficaram fora da tela para não aparecer zero no lugar de um dado que não foi lido. Use o botão Atualizar;
          se continuar, informe o código <span className="font-mono font-semibold">{error.code}</span> a quem cuida do
          site.
        </p>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<LeadStatus, string> = {
  novo: "bg-[#fff1d6] text-[#6b4000]",
  contatado: "bg-[#e3effb] text-[#184a7d]",
  qualificado: "bg-[#ece8fb] text-[#45308f]",
  convertido: "bg-[#dff3e9] text-[#0d5a3c]",
  perdido: "bg-[#ececea] text-[#4a4a46]",
};

function StatusBadge({ status, label }: { status: LeadStatus; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_BADGE[status])}>
      {label}
    </span>
  );
}

const SEVERITY: Record<RecommendationSeverity, { label: string; box: string; tag: string; Icon: typeof Info }> = {
  critica: {
    label: "Urgente",
    box: "border-[#e9b4ae] bg-[#fdf1ef]",
    tag: "text-[#8f1d14]",
    Icon: AlertCircle,
  },
  atencao: {
    label: "Atenção",
    box: "border-[#ecd09a] bg-[#fff8e8]",
    tag: "text-[#6b4000]",
    Icon: AlertTriangle,
  },
  info: {
    label: "Para conferir",
    box: "border-[var(--border)] bg-white",
    tag: "text-[var(--text-muted)]",
    Icon: Info,
  },
};

function RecommendationItem({ item }: { item: Recommendation }) {
  const style = SEVERITY[item.severity];
  return (
    <li className={cn("rounded-xl border p-4", style.box)}>
      <p className={cn("flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide", style.tag)}>
        <style.Icon aria-hidden="true" className="h-4 w-4" />
        {style.label}
      </p>
      <h3 className="mt-1.5 text-base font-semibold leading-snug text-[var(--text)]">{item.title}</h3>
      <p className="mt-1 text-sm text-[var(--text)]">{item.detail}</p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        <span className="font-semibold">Regra:</span> {item.rule}
      </p>
      <Link href={item.href} className={cn(LINK, "mt-2 inline-flex min-h-[44px] items-center gap-1 text-sm")}>
        {item.hrefLabel}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Blocos                                                               */
/* ------------------------------------------------------------------ */

function LeadTiles({ leads }: { leads: DashboardLeads }) {
  const { awaiting, response, deltaPct } = leads;
  const DeltaIcon = deltaPct === null || deltaPct === 0 ? Minus : deltaPct > 0 ? TrendingUp : TrendingDown;
  const deltaText =
    deltaPct === null
      ? "Sem leads nos 7 dias anteriores para comparar"
      : deltaPct === 0
        ? `Igual aos 7 dias anteriores (${numero.format(leads.prev7)})`
        : `${numero.format(Math.abs(deltaPct))}% ${deltaPct > 0 ? "a mais" : "a menos"} que nos 7 dias anteriores (${numero.format(leads.prev7)})`;
  const converted = leads.pipeline30.find((step) => step.status === "convertido")?.count ?? 0;

  return (
    <>
      <Tile label="Leads hoje" value={numero.format(leads.today)}>
        Ontem: {numero.format(leads.yesterday)}
      </Tile>

      <Tile label="Leads em 7 dias" value={numero.format(leads.last7)}>
        <span className="inline-flex items-start gap-1">
          <DeltaIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {deltaText}
        </span>
      </Tile>

      <Tile label="Aguardando 1º contato" value={numero.format(awaiting.count)}>
        {awaiting.count === 0 ? (
          "Nenhum lead parado em Novo"
        ) : (
          <>
            {awaiting.over24h > 0
              ? `${numero.format(awaiting.over24h)} há mais de 24 h`
              : "Todos chegaram nas últimas 24 h"}
            {awaiting.oldestHours !== null ? ` · o mais antigo chegou ${formatAge(awaiting.oldestHours)}` : ""}
            <br />
            <Link href="/admin/leads?status=novo" className={cn(LINK, "inline-flex min-h-[44px] items-center")}>
              Abrir leads novos
            </Link>
          </>
        )}
        {response.avgHours !== null ? (
          <span className="block">
            Tempo médio até o 1º contato: {formatDuration(response.avgHours)} ({plural(response.sample, "lead", "leads")})
          </span>
        ) : null}
      </Tile>

      <Tile
        label="Conversão em 30 dias"
        value={leads.conversionPct30 === null ? "—" : `${numero.format(leads.conversionPct30)}%`}
      >
        {leads.conversionPct30 === null
          ? "Sem leads nos últimos 30 dias"
          : `${numero.format(converted)} de ${plural(leads.last30, "lead", "leads")} com status Convertido`}
      </Tile>
    </>
  );
}

function StockTiles({ stock }: { stock: DashboardStock }) {
  return (
    <>
      <Tile label="Filhotes disponíveis" value={numero.format(stock.available)}>
        {plural(stock.reserved, "reservado", "reservados")}
        {stock.available > 0 ? ` · ${reais.format(stock.availableValueCents / 100)} em preço de tabela` : ""}
      </Tile>

      <Tile label={`Vendas em ${stock.soldThisMonth.monthLabel}`} value={numero.format(stock.soldThisMonth.count)}>
        {stock.soldThisMonth.count > 0
          ? `${reais.format(stock.soldThisMonth.cents / 100)} em preço de tabela`
          : "Nenhuma venda com data neste mês"}
        {stock.soldWithoutDate > 0 ? (
          <span className="block">
            {plural(stock.soldWithoutDate, "vendido sem data fica", "vendidos sem data ficam")} fora desta conta
          </span>
        ) : null}
      </Tile>
    </>
  );
}

export function ScrollTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    // Em tela estreita a tabela rola de lado; o foco no bloco deixa rolar pelo teclado.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-md">
      {children}
    </div>
  );
}

export const TH = "py-2 pr-3 text-xs font-medium text-[var(--text-muted)]";
export const TD = "py-2 pr-3";

function LeadDetails({ leads }: { leads: DashboardLeads }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="dash-por-dia" className={CARD}>
          <h2 id="dash-por-dia" className="text-base font-semibold text-[var(--text)]">
            Leads por dia
          </h2>
          <p className="mb-3 text-sm text-[var(--text-muted)]">Últimos 14 dias, no horário de São Paulo.</p>
          <LeadsByDayChart days={leads.byDay} />
        </section>

        <section aria-labelledby="dash-funil" className={CARD}>
          <h2 id="dash-funil" className="text-base font-semibold text-[var(--text)]">
            Em que etapa estão os leads
          </h2>
          <p className="mb-2 text-sm text-[var(--text-muted)]">
            {plural(leads.last30, "lead chegou", "leads chegaram")} nos últimos 30 dias. Toque numa etapa para abrir a
            lista.
          </p>
          <PipelineList steps={leads.pipeline30} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="dash-ultimos" className={CARD}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="dash-ultimos" className="text-base font-semibold text-[var(--text)]">
              Últimos leads
            </h2>
            <Link href="/admin/leads" className={cn(LINK, "inline-flex min-h-[44px] items-center text-sm")}>
              Ver todos
            </Link>
          </div>
          {leads.latest.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]">
              Nenhum lead nos últimos {leads.windowDays} dias.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {leads.latest.map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="flex min-h-[44px] items-start justify-between gap-3 rounded-md py-2.5 text-sm hover:bg-[var(--surface-2)]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[var(--text)]">{lead.name}</span>
                      <span className="block text-xs text-[var(--text-muted)]">
                        {[lead.place, lead.preference].filter(Boolean).join(" · ") || "Sem cidade nem preferência"}
                      </span>
                      {lead.matchedPuppy ? (
                        <span className="block text-xs text-[var(--text-muted)]">
                          Filhote associado: {lead.matchedPuppy.name}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={lead.status} label={lead.statusLabel} />
                      <span className="text-xs text-[var(--text-muted)]">
                        chegou {formatAge(lead.ageHours)}
                        <span className="sr-only">, em {diaMes.format(new Date(lead.createdAt))}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="dash-origem" className={CARD}>
          <h2 id="dash-origem" className="text-base font-semibold text-[var(--text)]">
            De onde vieram os leads
          </h2>
          <p className="mb-2 text-sm text-[var(--text-muted)]">Últimos 30 dias, pela origem gravada no formulário.</p>
          {leads.sources30.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]">
              Nenhum lead nos últimos 30 dias.
            </p>
          ) : (
            <ScrollTable label="Tabela de origem dos leads">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th scope="col" className={TH}>
                      Origem
                    </th>
                    <th scope="col" className={cn(TH, "text-right")}>
                      Leads
                    </th>
                    <th scope="col" className={cn(TH, "text-right")}>
                      Parte
                    </th>
                    <th scope="col" className={cn(TH, "pr-0 text-right")}>
                      Convertidos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.sources30.map((row) => (
                    <tr key={row.source} className="border-b border-[var(--border)] last:border-0">
                      <th scope="row" className={cn(TD, "font-medium text-[var(--text)]")}>
                        {row.label}
                      </th>
                      <td className={cn(TD, "text-right tabular-nums")}>{numero.format(row.count)}</td>
                      <td className={cn(TD, "text-right tabular-nums")}>{row.pct}%</td>
                      <td className={cn(TD, "pr-0 text-right tabular-nums")}>{numero.format(row.converted)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
          )}
        </section>
      </div>
    </>
  );
}

function ColorDemand({ leads }: { leads: DashboardLeads }) {
  const stockUnknown = leads.demandByColor30.some((row) => row.stock === null);
  return (
    <section aria-labelledby="dash-cores" className={CARD}>
      <h2 id="dash-cores" className="text-base font-semibold text-[var(--text)]">
        Cores pedidas e estoque
      </h2>
      <p className="mb-2 text-sm text-[var(--text-muted)]">
        Cor que o lead escolheu no formulário nos últimos 30 dias, ao lado dos filhotes disponíveis hoje nessa cor.
      </p>
      {leads.demandByColor30.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]">
          Nenhum lead informou cor nos últimos 30 dias.
        </p>
      ) : (
        <ScrollTable label="Tabela de cores pedidas e estoque">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th scope="col" className={TH}>
                  Cor
                </th>
                <th scope="col" className={cn(TH, "text-right")}>
                  Leads que pediram
                </th>
                <th scope="col" className={cn(TH, "pr-0 text-right")}>
                  Disponíveis hoje
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.demandByColor30.map((row) => (
                <tr key={row.color} className="border-b border-[var(--border)] last:border-0">
                  <th scope="row" className={cn(TD, "font-medium text-[var(--text)]")}>
                    {row.color}
                  </th>
                  <td className={cn(TD, "text-right tabular-nums")}>{numero.format(row.leads)}</td>
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
      {stockUnknown ? (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          O estoque não pôde ser lido agora, por isso a última coluna está sem número.
        </p>
      ) : null}
    </section>
  );
}

function StockDetails({ stock }: { stock: DashboardStock }) {
  const pending = [
    stock.noPrice > 0 ? plural(stock.noPrice, "sem preço", "sem preço") : null,
    stock.noPhoto > 0 ? plural(stock.noPhoto, "disponível sem foto", "disponíveis sem foto") : null,
  ].filter(Boolean);

  return (
    <section aria-labelledby="dash-estoque" className={CARD}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="dash-estoque" className="text-base font-semibold text-[var(--text)]">
          Filhotes por status
        </h2>
        <Link href="/admin/puppies" className={cn(LINK, "inline-flex min-h-[44px] items-center text-sm")}>
          Abrir filhotes
        </Link>
      </div>
      <p className="mb-3 text-sm text-[var(--text-muted)]">
        {plural(stock.total, "filhote cadastrado", "filhotes cadastrados")}
        {pending.length ? ` · ${pending.join(" · ")}` : ""}
      </p>
      <StockBreakdown stock={stock} />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tela                                                                 */
/* ------------------------------------------------------------------ */

export type DashboardViewProps = DashboardLoad & {
  /** Botao de atualizar; fica de fora nos testes porque depende do navegador. */
  refreshSlot?: ReactNode;
};

export function DashboardView({ data, configured, errors, refreshSlot }: DashboardViewProps) {
  const { leads, stock, recommendations } = data;
  const partial = configured && (!leads || !stock);
  const truncated = [
    leads?.truncated ? `os ${numero.format(ROW_LIMIT)} leads mais recentes` : null,
    stock?.truncated ? `os ${numero.format(ROW_LIMIT)} filhotes mais recentes` : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Leads e filhotes lidos do banco às {formatClock(data.generatedAt)} de{" "}
            {diaMes.format(new Date(data.generatedAt))}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {refreshSlot}
          <nav aria-label="Atalhos do dashboard" className="flex flex-wrap gap-2">
            <Link href="/admin/leads" className="btn-outline text-sm">
              Leads
            </Link>
            <Link href="/admin/puppies" className="btn-outline text-sm">
              Filhotes
            </Link>
            <Link href="/admin/analytics" className="btn-outline text-sm">
              Analytics
            </Link>
          </nav>
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

      {leads || stock ? (
        <>
          <section aria-labelledby="dash-resumo">
            <h2 id="dash-resumo" className="sr-only">
              Resumo
            </h2>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {leads ? <LeadTiles leads={leads} /> : null}
              {stock ? <StockTiles stock={stock} /> : null}
            </dl>
          </section>

          <section aria-labelledby="dash-recomendacoes" className={CARD}>
            <h2 id="dash-recomendacoes" className="text-base font-semibold text-[var(--text)]">
              Recomendações automáticas
            </h2>
            <p className="mb-3 text-sm text-[var(--text-muted)]">
              Regras fixas aplicadas aos números desta tela. Cada item mostra a regra que o gerou e some quando o dado
              é corrigido.
              {partial ? " Parte dos dados não foi lida, então a lista considera só o que está na tela." : ""}
            </p>
            {recommendations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]">
                Nada pede ação agora. As regras conferem leads sem resposta, queda de leads, cor pedida sem estoque e
                cadastro de filhote incompleto.
              </p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {recommendations.map((item) => (
                  <RecommendationItem key={item.id} item={item} />
                ))}
              </ul>
            )}
          </section>

          {leads ? <LeadDetails leads={leads} /> : null}

          {leads || stock ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {stock ? <StockDetails stock={stock} /> : null}
              {leads ? <ColorDemand leads={leads} /> : null}
            </div>
          ) : null}

          {truncated.length ? (
            <p className="text-xs text-[var(--text-muted)]">
              Esta tela considera {truncated.join(" e ")}
              {leads?.truncated ? ` dos últimos ${leads.windowDays} dias` : ""}.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
