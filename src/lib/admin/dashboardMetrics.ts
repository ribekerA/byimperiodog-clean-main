/**
 * Numeros do dashboard do admin.
 *
 * Tudo aqui e funcao pura: recebe as linhas ja lidas do banco e um "agora",
 * devolve o que a tela mostra. Nao le banco, nao grava nada, nao depende de
 * servidor — por isso da para testar cada numero sem entrar no painel.
 *
 * Regras que valem para o arquivo inteiro:
 *  - "Hoje", "ontem" e os dias do grafico seguem o horario de Sao Paulo, nao o
 *    do servidor (que roda em UTC e viraria o dia as 21h).
 *  - Status de filhote e de lead passam pelos normalizadores de src/domain,
 *    porque o banco guarda em portugues (disponivel, vendido, convertido...).
 *  - Nenhum numero e estimado. Onde falta dado, o campo vem null e a tela diz
 *    que falta, em vez de mostrar zero.
 */

import { LEAD_STATUS, LEAD_STATUS_LABEL, normalizeLeadStatus, type LeadStatus } from "@/domain/lead-status";
import { normalizePuppyStatus } from "@/domain/puppy-status";

export const DASHBOARD_TIME_ZONE = "America/Sao_Paulo";

/** Janela de leads que a tela carrega. */
export const LEADS_WINDOW_DAYS = 90;
/** Teto de linhas por consulta (o banco corta em 1000 de qualquer forma). */
export const ROW_LIMIT = 1000;

/** Limiares das recomendacoes. Mudou aqui, muda o texto da regra junto. */
export const RULES = {
  awaitingHours: 24,
  agedDays: 90,
  demandMinLeads: 2,
  dropPct: 30,
  dropMinBase: 5,
} as const;

/* ------------------------------------------------------------------ */
/* Linhas de entrada                                                    */
/* ------------------------------------------------------------------ */

type MatchEmbed = { matched_puppy_id?: string | null };

export type DashboardLeadRow = {
  id: string;
  created_at: string;
  nome?: string | null;
  first_name?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  status?: string | null;
  source?: string | null;
  utm_source?: string | null;
  first_responded_at?: string | null;
  /** Vem como objeto ou lista, conforme a relacao no banco. */
  lead_ai_insights?: MatchEmbed | MatchEmbed[] | null;
};

export type DashboardPuppyRow = {
  id: string;
  codigo?: string | null;
  name?: string | null;
  nome?: string | null;
  status?: string | null;
  price_cents?: number | null;
  preco?: number | string | null;
  created_at?: string | null;
  color?: string | null;
  cor?: string | null;
  sexo?: string | null;
  midia?: unknown;
  sold_at?: string | null;
};

/* ------------------------------------------------------------------ */
/* Saida                                                                */
/* ------------------------------------------------------------------ */

export type DayPoint = {
  /** AAAA-MM-DD no horario de Sao Paulo. */
  key: string;
  /** DD/MM */
  label: string;
  /** seg, ter, qua... */
  weekday: string;
  value: number;
};

export type PipelineStep = { status: LeadStatus; label: string; count: number; pct: number };

export type SourceRow = { source: string; label: string; count: number; pct: number; converted: number };

export type LatestLead = {
  id: string;
  name: string;
  place: string | null;
  preference: string | null;
  status: LeadStatus;
  statusLabel: string;
  createdAt: string;
  ageHours: number;
  matchedPuppy: { id: string; name: string } | null;
};

export type ColorDemand = {
  color: string;
  leads: number;
  /** null quando o estoque nao pode ser lido. */
  stock: number | null;
};

export type DashboardLeads = {
  windowDays: number;
  truncated: boolean;
  today: number;
  yesterday: number;
  last7: number;
  prev7: number;
  /** null quando a semana anterior nao teve leads (nao ha base de comparacao). */
  deltaPct: number | null;
  last30: number;
  byDay: DayPoint[];
  pipeline30: PipelineStep[];
  conversionPct30: number | null;
  awaiting: { count: number; over24h: number; oldestHours: number | null };
  /** Tempo ate o primeiro contato; so existe para leads com a data gravada. */
  response: { avgHours: number | null; sample: number };
  sources30: SourceRow[];
  latest: LatestLead[];
  demandByColor30: ColorDemand[];
};

export type DashboardStock = {
  total: number;
  truncated: boolean;
  available: number;
  reserved: number;
  sold: number;
  unavailable: number;
  availableValueCents: number;
  noPrice: number;
  noPhoto: number;
  aged: number;
  soldThisMonth: { count: number; cents: number; monthLabel: string };
  soldWithoutDate: number;
};

export type RecommendationSeverity = "critica" | "atencao" | "info";

export type Recommendation = {
  id: string;
  severity: RecommendationSeverity;
  title: string;
  detail: string;
  /** A regra fixa que gerou a recomendacao, em portugues claro. */
  rule: string;
  href: string;
  hrefLabel: string;
};

export type DashboardData = {
  generatedAt: string;
  leads: DashboardLeads | null;
  stock: DashboardStock | null;
  recommendations: Recommendation[];
};

/* ------------------------------------------------------------------ */
/* Datas                                                                */
/* ------------------------------------------------------------------ */

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

const dayPartsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: DASHBOARD_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const weekdayFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short" });
const monthFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: DASHBOARD_TIME_ZONE, month: "long" });

function toDate(input: Date | string | number | null | undefined): Date | null {
  if (input === null || input === undefined || input === "") return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Dia (AAAA-MM-DD) em que o instante cai no horario de Sao Paulo. */
export function dayKey(input: Date | string | number | null | undefined): string | null {
  const date = toDate(input);
  if (!date) return null;
  const parts = dayPartsFormat.formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

/** Soma ou subtrai dias de uma chave AAAA-MM-DD. */
export function shiftDayKey(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dayLabel(key: string): string {
  return `${key.slice(8, 10)}/${key.slice(5, 7)}`;
}

function weekdayLabel(key: string): string {
  return weekdayFormat.format(new Date(`${key}T12:00:00Z`)).replace(".", "");
}

/** "há 20 min", "há 5 h", "há 3 dias". */
export function formatAge(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return "agora";
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(hours * 60));
    return `há ${minutes} min`;
  }
  if (hours < 24) return `há ${Math.round(hours)} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}

/** "40 min", "5,5 h", "3 dias" — para duracoes, sem o "há". */
export function formatDuration(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 24) return `${hours.toFixed(1).replace(".", ",").replace(",0", "")} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1 dia" : `${days} dias`;
}

/* ------------------------------------------------------------------ */
/* Ajudantes                                                            */
/* ------------------------------------------------------------------ */

function clean(value?: string | null): string {
  return (value ?? "").trim();
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/** O formulario grava "femea" sem acento; na tela sai escrito certo. Valor desconhecido passa como veio. */
function sexLabel(value?: string | null): string {
  const raw = clean(value);
  const key = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (key === "femea" || key === "f") return "fêmea";
  if (key === "macho" || key === "m") return "macho";
  return raw;
}

function colorKey(value?: string | null): string {
  return clean(value).toLowerCase();
}

const SOURCE_LABEL: Record<string, string> = {
  site_org: "Site, sem campanha",
  direto: "Sem origem registrada",
};

/** Origem do lead: a campanha (utm_source) quando existe; senao o campo source. */
export function leadSource(row: Pick<DashboardLeadRow, "utm_source" | "source">): string {
  return (clean(row.utm_source) || clean(row.source) || "direto").toLowerCase();
}

export function sourceLabel(source: string): string {
  return SOURCE_LABEL[source] ?? capitalize(source.replace(/[_-]+/g, " "));
}

export function puppyDisplayName(row: Pick<DashboardPuppyRow, "name" | "nome" | "codigo">): string {
  return clean(row.name) || clean(row.nome) || clean(row.codigo) || "Filhote sem nome";
}

/** Preco em centavos; aceita a coluna antiga "preco" (em reais) quando price_cents esta vazio. */
export function puppyPriceCents(row: Pick<DashboardPuppyRow, "price_cents" | "preco">): number {
  if (typeof row.price_cents === "number" && row.price_cents > 0) return row.price_cents;
  const reais = typeof row.preco === "string" ? Number.parseFloat(row.preco) : row.preco;
  return typeof reais === "number" && Number.isFinite(reais) && reais > 0 ? Math.round(reais * 100) : 0;
}

/** O filhote tem ao menos uma foto ou video cadastrado? */
export function puppyHasMedia(midia: unknown): boolean {
  let value = midia;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return false;
    try {
      value = JSON.parse(text);
    } catch {
      return true; // texto solto: tratamos como um endereco de midia
    }
  }
  if (!Array.isArray(value)) return false;
  return value.some((item) => {
    if (typeof item === "string") return item.trim().length > 0;
    if (item && typeof item === "object") {
      const url = (item as { url?: unknown }).url;
      return typeof url === "string" && url.trim().length > 0;
    }
    return false;
  });
}

function matchedPuppyId(row: DashboardLeadRow): string | null {
  const embed = row.lead_ai_insights;
  if (!embed) return null;
  const first = Array.isArray(embed) ? embed.find((item) => item?.matched_puppy_id) : embed;
  return first?.matched_puppy_id ?? null;
}

/* ------------------------------------------------------------------ */
/* Estoque                                                              */
/* ------------------------------------------------------------------ */

export function buildStock(rows: DashboardPuppyRow[], now: Date): DashboardStock {
  const todayKey = dayKey(now) ?? "";
  const monthPrefix = todayKey.slice(0, 7);

  const stock: DashboardStock = {
    total: rows.length,
    truncated: rows.length >= ROW_LIMIT,
    available: 0,
    reserved: 0,
    sold: 0,
    unavailable: 0,
    availableValueCents: 0,
    noPrice: 0,
    noPhoto: 0,
    aged: 0,
    soldThisMonth: { count: 0, cents: 0, monthLabel: monthFormat.format(now) },
    soldWithoutDate: 0,
  };

  for (const row of rows) {
    const status = normalizePuppyStatus(row.status);
    const price = puppyPriceCents(row);

    if (status === "available") {
      stock.available += 1;
      stock.availableValueCents += price;
      if (price <= 0) stock.noPrice += 1;
      if (!puppyHasMedia(row.midia)) stock.noPhoto += 1;
      const created = toDate(row.created_at);
      if (created && now.getTime() - created.getTime() >= RULES.agedDays * DAY_MS) stock.aged += 1;
    } else if (status === "reserved") {
      stock.reserved += 1;
      if (price <= 0) stock.noPrice += 1;
    } else if (status === "sold") {
      stock.sold += 1;
      const soldKey = dayKey(row.sold_at);
      if (!soldKey) {
        stock.soldWithoutDate += 1;
      } else if (soldKey.startsWith(monthPrefix)) {
        stock.soldThisMonth.count += 1;
        stock.soldThisMonth.cents += price;
      }
    } else {
      stock.unavailable += 1;
    }
  }

  return stock;
}

function availableByColor(rows: DashboardPuppyRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (normalizePuppyStatus(row.status) !== "available") continue;
    const key = colorKey(row.color) || colorKey(row.cor);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Leads                                                                */
/* ------------------------------------------------------------------ */

export function buildLeads(
  rows: DashboardLeadRow[],
  puppies: DashboardPuppyRow[] | null,
  now: Date,
): DashboardLeads {
  const todayKey = dayKey(now) ?? "";
  const yesterdayKey = shiftDayKey(todayKey, -1);
  const start7 = shiftDayKey(todayKey, -6);
  const startPrev7 = shiftDayKey(todayKey, -13);
  const start30 = shiftDayKey(todayKey, -29);

  const valid = rows
    .map((row) => ({ row, key: dayKey(row.created_at), at: toDate(row.created_at) }))
    .filter((item): item is { row: DashboardLeadRow; key: string; at: Date } => Boolean(item.key && item.at))
    // relogio adiantado na origem: fora das contas e da lista
    .filter((item) => item.key <= todayKey)
    .sort((a, b) => b.at.getTime() - a.at.getTime());

  const perDay = new Map<string, number>();
  let last7 = 0;
  let prev7 = 0;
  let last30 = 0;
  let awaitingCount = 0;
  let awaitingOver = 0;
  let oldestHours: number | null = null;
  let responseSum = 0;
  let responseSample = 0;

  const statusCount = new Map<LeadStatus, number>(LEAD_STATUS.map((status) => [status, 0]));
  const sources = new Map<string, { count: number; converted: number }>();
  const colors = new Map<string, number>();

  for (const { row, key, at } of valid) {
    perDay.set(key, (perDay.get(key) ?? 0) + 1);

    const status = normalizeLeadStatus(row.status);
    const ageHours = (now.getTime() - at.getTime()) / HOUR_MS;

    if (key >= start7) last7 += 1;
    else if (key >= startPrev7) prev7 += 1;

    if (status === "novo") {
      awaitingCount += 1;
      if (ageHours >= RULES.awaitingHours) awaitingOver += 1;
      if (oldestHours === null || ageHours > oldestHours) oldestHours = ageHours;
    }

    if (key >= start30) {
      last30 += 1;
      statusCount.set(status, (statusCount.get(status) ?? 0) + 1);

      const source = leadSource(row);
      const entry = sources.get(source) ?? { count: 0, converted: 0 };
      entry.count += 1;
      if (status === "convertido") entry.converted += 1;
      sources.set(source, entry);

      const color = colorKey(row.cor_preferida);
      if (color) colors.set(color, (colors.get(color) ?? 0) + 1);

      const responded = toDate(row.first_responded_at);
      if (responded && responded.getTime() >= at.getTime()) {
        responseSum += (responded.getTime() - at.getTime()) / HOUR_MS;
        responseSample += 1;
      }
    }
  }

  const byDay: DayPoint[] = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const key = shiftDayKey(todayKey, -offset);
    byDay.push({ key, label: dayLabel(key), weekday: weekdayLabel(key), value: perDay.get(key) ?? 0 });
  }

  const pipeline30: PipelineStep[] = LEAD_STATUS.map((status) => {
    const count = statusCount.get(status) ?? 0;
    return { status, label: LEAD_STATUS_LABEL[status], count, pct: pct(count, last30) };
  });

  const sources30: SourceRow[] = Array.from(sources.entries())
    .map(([source, entry]) => ({
      source,
      label: sourceLabel(source),
      count: entry.count,
      pct: pct(entry.count, last30),
      converted: entry.converted,
    }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source))
    .slice(0, 8);

  const stockByColor = puppies ? availableByColor(puppies) : null;
  const demandByColor30: ColorDemand[] = Array.from(colors.entries())
    .map(([color, leads]) => ({
      color: capitalize(color),
      leads,
      stock: stockByColor ? stockByColor.get(color) ?? 0 : null,
    }))
    .sort((a, b) => b.leads - a.leads || a.color.localeCompare(b.color))
    .slice(0, 6);

  const puppyNames = new Map((puppies ?? []).map((puppy) => [puppy.id, puppyDisplayName(puppy)]));
  const latest: LatestLead[] = valid.slice(0, 8).map(({ row, at }) => {
    const status = normalizeLeadStatus(row.status);
    const matchedId = matchedPuppyId(row);
    const place = [clean(row.cidade), clean(row.estado)].filter(Boolean).join(" · ") || null;
    const preference = [clean(row.cor_preferida), sexLabel(row.sexo_preferido)].filter(Boolean).join(" · ") || null;
    return {
      id: row.id,
      name: clean(row.nome) || clean(row.first_name) || "Lead sem nome",
      place,
      preference,
      status,
      statusLabel: LEAD_STATUS_LABEL[status],
      createdAt: at.toISOString(),
      ageHours: Math.max(0, (now.getTime() - at.getTime()) / HOUR_MS),
      matchedPuppy:
        matchedId && puppyNames.has(matchedId) ? { id: matchedId, name: puppyNames.get(matchedId) as string } : null,
    };
  });

  return {
    windowDays: LEADS_WINDOW_DAYS,
    truncated: rows.length >= ROW_LIMIT,
    today: perDay.get(todayKey) ?? 0,
    yesterday: perDay.get(yesterdayKey) ?? 0,
    last7,
    prev7,
    deltaPct: prev7 > 0 ? round1(((last7 - prev7) / prev7) * 100) : null,
    last30,
    byDay,
    pipeline30,
    conversionPct30: last30 > 0 ? round1(((statusCount.get("convertido") ?? 0) / last30) * 100) : null,
    awaiting: { count: awaitingCount, over24h: awaitingOver, oldestHours },
    response: { avgHours: responseSample > 0 ? round1(responseSum / responseSample) : null, sample: responseSample },
    sources30,
    latest,
    demandByColor30,
  };
}

/* ------------------------------------------------------------------ */
/* Recomendacoes automaticas (regras fixas, sem modelo de IA)           */
/* ------------------------------------------------------------------ */

const SEVERITY_ORDER: Record<RecommendationSeverity, number> = { critica: 0, atencao: 1, info: 2 };

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function buildRecommendations(leads: DashboardLeads | null, stock: DashboardStock | null): Recommendation[] {
  const list: Recommendation[] = [];

  if (leads) {
    const { awaiting } = leads;
    if (awaiting.over24h > 0) {
      list.push({
        id: "leads-aguardando-24h",
        severity: "critica",
        title: `${plural(awaiting.over24h, "lead espera", "leads esperam")} o primeiro contato há mais de ${RULES.awaitingHours} horas`,
        detail:
          awaiting.oldestHours !== null
            ? `O mais antigo chegou ${formatAge(awaiting.oldestHours)}. Responda e mude o status para Contatado para ele sair desta lista.`
            : "Responda e mude o status para Contatado para eles saírem desta lista.",
        rule: `Lead com status Novo criado há ${RULES.awaitingHours} horas ou mais, nos últimos ${leads.windowDays} dias.`,
        href: "/admin/leads?status=novo",
        hrefLabel: "Abrir leads novos",
      });
    }
    const fresh = awaiting.count - awaiting.over24h;
    if (fresh > 0) {
      list.push({
        id: "leads-novos",
        severity: "atencao",
        title: `${plural(fresh, "lead novo chegou", "leads novos chegaram")} nas últimas ${RULES.awaitingHours} horas`,
        detail: "Ainda estão no prazo. Responda e mude o status para Contatado para eles saírem desta lista.",
        rule: `Lead com status Novo criado há menos de ${RULES.awaitingHours} horas.`,
        href: "/admin/leads?status=novo",
        hrefLabel: "Abrir leads novos",
      });
    }
    if (leads.deltaPct !== null && leads.prev7 >= RULES.dropMinBase && leads.deltaPct <= -RULES.dropPct) {
      list.push({
        id: "queda-de-leads",
        severity: "atencao",
        title: `Os leads caíram ${Math.abs(leads.deltaPct).toLocaleString("pt-BR")}% em uma semana`,
        detail: `Foram ${leads.last7} nos últimos 7 dias, contra ${leads.prev7} nos 7 anteriores. Vale conferir se os anúncios e o formulário do site estão no ar.`,
        rule: `Queda de ${RULES.dropPct}% ou mais entre os últimos 7 dias e os 7 anteriores, quando a semana anterior teve ao menos ${RULES.dropMinBase} leads.`,
        href: "/admin/analytics",
        hrefLabel: "Abrir analytics",
      });
    }
    for (const item of leads.demandByColor30) {
      if (item.stock === 0 && item.leads >= RULES.demandMinLeads) {
        list.push({
          id: `cor-sem-estoque-${item.color.toLowerCase().replace(/\s+/g, "-")}`,
          severity: "atencao",
          title: `${item.leads} leads pediram a cor ${item.color.toLowerCase()} e não há filhote disponível`,
          detail: "Se houver filhote dessa cor fora do catálogo, cadastre ou atualize o status dele.",
          rule: `${RULES.demandMinLeads} ou mais leads em 30 dias pedindo a cor, e nenhum filhote com status Disponível nessa cor.`,
          href: "/admin/puppies",
          hrefLabel: "Abrir filhotes",
        });
      }
    }
  }

  if (stock) {
    if (stock.total > 0 && stock.available === 0) {
      list.push({
        id: "sem-disponiveis",
        severity: "critica",
        title: "Nenhum filhote está como Disponível",
        detail: "O catálogo do site só mostra filhotes disponíveis ou reservados. Confira se algum cadastro ficou com o status errado.",
        rule: "Há filhotes cadastrados, mas nenhum com status Disponível.",
        href: "/admin/puppies",
        hrefLabel: "Abrir filhotes",
      });
    }
    if (stock.noPrice > 0) {
      list.push({
        id: "filhotes-sem-preco",
        severity: "atencao",
        title: `${plural(stock.noPrice, "filhote está", "filhotes estão")} sem preço`,
        detail: "Filhote sem preço fica fora das somas desta tela.",
        rule: "Filhote Disponível ou Reservado com preço vazio ou zero.",
        href: "/admin/puppies",
        hrefLabel: "Abrir filhotes",
      });
    }
    if (stock.noPhoto > 0) {
      list.push({
        id: "filhotes-sem-foto",
        severity: "atencao",
        title: `${plural(stock.noPhoto, "filhote disponível está", "filhotes disponíveis estão")} sem foto`,
        detail: "Cadastre ao menos uma foto antes de divulgar o filhote.",
        rule: "Filhote Disponível sem nenhuma foto ou vídeo cadastrado.",
        href: "/admin/puppies",
        hrefLabel: "Abrir filhotes",
      });
    }
    if (stock.aged > 0) {
      list.push({
        id: "filhotes-parados",
        severity: "info",
        title: `${plural(stock.aged, "filhote está disponível", "filhotes estão disponíveis")} há mais de ${RULES.agedDays} dias`,
        detail: "Confira se o cadastro continua correto: status, preço e fotos.",
        rule: `Filhote Disponível cadastrado há ${RULES.agedDays} dias ou mais.`,
        href: "/admin/puppies",
        hrefLabel: "Abrir filhotes",
      });
    }
    if (stock.soldWithoutDate > 0) {
      list.push({
        id: "vendidos-sem-data",
        severity: "info",
        title: `${plural(stock.soldWithoutDate, "filhote vendido está", "filhotes vendidos estão")} sem data de venda`,
        detail: "Sem a data, a venda não entra na soma do mês.",
        rule: "Filhote com status Vendido e data de venda vazia.",
        href: "/admin/puppies",
        hrefLabel: "Abrir filhotes",
      });
    }
  }

  return list.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/* ------------------------------------------------------------------ */
/* Montagem                                                             */
/* ------------------------------------------------------------------ */

export function buildDashboard(input: {
  /** null = a leitura de leads falhou. */
  leads: DashboardLeadRow[] | null;
  /** null = a leitura de filhotes falhou. */
  puppies: DashboardPuppyRow[] | null;
  now: Date;
}): DashboardData {
  const stock = input.puppies ? buildStock(input.puppies, input.now) : null;
  const leads = input.leads ? buildLeads(input.leads, input.puppies, input.now) : null;
  return {
    generatedAt: input.now.toISOString(),
    leads,
    stock,
    recommendations: buildRecommendations(leads, stock),
  };
}
