import { describe, expect, it } from "vitest";

import {
  buildAnalytics,
  buildLeadAnalytics,
  buildMonthSales,
  pagePath,
  parseAnalyticsPeriod,
  type AnalyticsLeadRow,
} from "../../src/lib/admin/analyticsMetrics";
import type { DashboardPuppyRow } from "../../src/lib/admin/dashboardMetrics";

// Meio-dia de terca, 10/11/2026, em Sao Paulo (UTC-3).
const AGORA = new Date("2026-11-10T15:00:00Z");

const LEADS: AnalyticsLeadRow[] = [
  {
    id: "a1",
    created_at: "2026-11-10T13:00:00Z",
    status: "contatado",
    cidade: "São Paulo",
    estado: "sp",
    cor_preferida: "Laranja",
    sexo_preferido: "macho",
    utm_source: "google",
    utm_campaign: "Lulu Marca",
    page: "https://byimperiodog.com.br/filhotes?x=1",
    first_responded_at: "2026-11-10T13:30:00Z",
  },
  {
    id: "a2",
    created_at: "2026-11-09T12:00:00Z",
    status: "convertido",
    cidade: "sao paulo",
    cor_preferida: "laranja",
    sexo_preferido: "Macho",
    utm_source: "google",
    page_slug: "/filhotes/",
    first_responded_at: "2026-11-09T22:00:00Z",
  },
  { id: "a3", created_at: "2026-11-05T12:00:00Z", status: "novo", cidade: "Campinas", cor_preferida: "Preto" },
  // 00h30 de 04/11 em Sao Paulo: primeiro dia do periodo de 7 dias
  { id: "a4", created_at: "2026-11-04T03:30:00Z", status: "qualificado" },
  // 23h de 03/11 em Sao Paulo: ja e o periodo anterior
  { id: "a5", created_at: "2026-11-04T02:00:00Z", status: "novo" },
  { id: "a6", created_at: "2026-10-28T12:00:00Z", status: "perdido" },
  // antes do periodo anterior
  { id: "a7", created_at: "2026-10-27T12:00:00Z", status: "novo" },
  // data no futuro e data invalida ficam fora
  { id: "a8", created_at: "2026-11-11T12:00:00Z", status: "novo" },
  { id: "a9", created_at: "lixo", status: "novo" },
];

const FILHOTES: DashboardPuppyRow[] = [
  { id: "p-1", nome: "Thor", status: "disponivel", price_cents: 450000, cor: "Laranja", midia: [], created_at: "2026-11-01T12:00:00Z" },
  { id: "p-2", nome: "Bob", status: "reservado", price_cents: 500000, cor: "Preto", midia: [], created_at: "2026-10-20T12:00:00Z" },
  { id: "p-3", nome: "Mel", status: "vendido", price_cents: 480000, cor: "Laranja", midia: [], created_at: "2026-10-01T12:00:00Z", sold_at: "2026-11-03T12:00:00Z" },
  { id: "p-4", nome: "Nina", status: "vendido", price_cents: 400000, cor: "Creme", midia: [], created_at: "2025-12-01T12:00:00Z", sold_at: "2026-01-15T12:00:00Z" },
  { id: "p-5", nome: "Zeca", status: "vendido", price_cents: 400000, cor: "Creme", midia: [], created_at: "2025-12-01T12:00:00Z" },
];

describe("parseAnalyticsPeriod", () => {
  it("aceita só 7, 30 e 90 e cai em 30 no resto", () => {
    expect(parseAnalyticsPeriod("7")).toBe(7);
    expect(parseAnalyticsPeriod(["90", "7"])).toBe(90);
    expect(parseAnalyticsPeriod("15")).toBe(30);
    expect(parseAnalyticsPeriod(undefined)).toBe(30);
    expect(parseAnalyticsPeriod("abc")).toBe(30);
  });
});

describe("pagePath", () => {
  it("tira domínio, parâmetros e barra final", () => {
    expect(pagePath({ page: "https://byimperiodog.com.br/filhotes/?gclid=1#topo" })).toBe("/filhotes");
    expect(pagePath({ page: "/blog/x", page_slug: "/filhotes/" })).toBe("/filhotes");
    expect(pagePath({ page: "/" })).toBe("/");
    expect(pagePath({ page: null, page_slug: "  " })).toBe("");
  });
});

describe("buildLeadAnalytics em 7 dias", () => {
  const leads = buildLeadAnalytics(LEADS, FILHOTES, AGORA, 7);

  it("conta o período e o anterior pelo dia de São Paulo", () => {
    expect(leads.total).toBe(4);
    expect(leads.prevTotal).toBe(2);
    expect(leads.deltaPct).toBe(100);
    expect(leads.perDayAvg).toBe(0.6);
  });

  it("monta uma barra por dia, com hoje por último", () => {
    expect(leads.granularity).toBe("dia");
    expect(leads.series).toHaveLength(7);
    expect(leads.series.map((point) => point.value)).toEqual([1, 1, 0, 0, 0, 1, 1]);
    expect(leads.series[0].key).toBe("2026-11-04");
    expect(leads.series[6]).toMatchObject({ key: "2026-11-10", label: "10/11", detail: "10/11 (ter)", tick: true });
  });

  it("conversão é convertidos sobre o total, pelo status de hoje", () => {
    expect(leads.converted).toBe(1);
    expect(leads.conversionPct).toBe(25);
    const porStatus = Object.fromEntries(leads.pipeline.map((step) => [step.status, step.count]));
    expect(porStatus).toEqual({ novo: 1, contatado: 1, qualificado: 1, perdido: 0, convertido: 1 });
  });

  it("tempo até o primeiro contato só usa quem tem a data gravada", () => {
    expect(leads.response).toEqual({
      sample: 2,
      medianHours: 5.3,
      avgHours: 5.3,
      within1h: 1,
      within24h: 1,
      over24h: 0,
      notRecorded: 1,
    });
  });

  it("junta cidades escritas com e sem acento", () => {
    expect(leads.cities.rows[0]).toMatchObject({ key: "sao paulo", label: "São Paulo · SP", count: 2, pct: 50, converted: 1 });
    expect(leads.cities.rows[1]).toMatchObject({ label: "Campinas", count: 1 });
    expect(leads.cities.missing).toBe(1);
  });

  it("separa campanha, página, sexo e origem, com os não informados à parte", () => {
    expect(leads.campaigns.rows).toHaveLength(1);
    expect(leads.campaigns.rows[0]).toMatchObject({ label: "Lulu Marca", count: 1 });
    expect(leads.campaigns.missing).toBe(3);
    expect(leads.pages.rows[0]).toMatchObject({ label: "/filhotes", count: 2 });
    expect(leads.pages.missing).toBe(2);
    expect(leads.sexes.rows[0]).toMatchObject({ label: "Macho", count: 2 });
    expect(leads.sexes.missing).toBe(2);
    expect(leads.sources.rows[0].count).toBe(2);
    expect(leads.sources.rows.reduce((sum, row) => sum + row.count, 0) + leads.sources.rest).toBe(4);
  });

  it("põe o estoque disponível de hoje ao lado da cor pedida", () => {
    expect(leads.colors.rows).toEqual([
      expect.objectContaining({ key: "laranja", label: "Laranja", count: 2, stock: 1 }),
      // o unico preto esta reservado: nao conta como disponivel
      expect.objectContaining({ key: "preto", label: "Preto", count: 1, stock: 0 }),
    ]);
    expect(leads.colors.missing).toBe(1);
  });

  it("sem leitura de filhotes, o estoque vem null e não zero", () => {
    const semEstoque = buildLeadAnalytics(LEADS, null, AGORA, 7);
    expect(semEstoque.colors.rows.every((row) => row.stock === null)).toBe(true);
  });

  it("dias da semana começam na segunda", () => {
    expect(leads.weekdays.map((day) => day.label)[0]).toBe("Segunda");
    expect(leads.weekdays.map((day) => day.count)).toEqual([1, 1, 1, 1, 0, 0, 0]);
  });

  it("leitura cortada no teto não compara com o período anterior", () => {
    const cortado = buildLeadAnalytics(LEADS, FILHOTES, AGORA, 7, true);
    expect(cortado.truncated).toBe(true);
    expect(cortado.deltaPct).toBeNull();
  });

  it("período vazio não inventa taxa", () => {
    const vazio = buildLeadAnalytics([], FILHOTES, AGORA, 30);
    expect(vazio.total).toBe(0);
    expect(vazio.conversionPct).toBeNull();
    expect(vazio.deltaPct).toBeNull();
    expect(vazio.response.medianHours).toBeNull();
    expect(vazio.series).toHaveLength(30);
  });
});

describe("buildLeadAnalytics em 90 dias", () => {
  const leads = buildLeadAnalytics(LEADS, FILHOTES, AGORA, 90);

  it("agrupa em semanas contadas de hoje para trás", () => {
    expect(leads.granularity).toBe("semana");
    expect(leads.series).toHaveLength(13);
    expect(leads.series[12]).toMatchObject({ key: "2026-11-04", detail: "04/11 a 10/11", value: 4 });
    expect(leads.series[0].key).toBe("2026-08-13");
    expect(leads.series.reduce((sum, point) => sum + point.value, 0)).toBe(leads.total);
    expect(leads.total).toBe(7);
  });
});

describe("buildMonthSales", () => {
  it("conta vendidos com data de venda nos últimos seis meses", () => {
    const sales = buildMonthSales(FILHOTES, AGORA);
    expect(sales.map((month) => month.label)).toEqual(["jun/26", "jul/26", "ago/26", "set/26", "out/26", "nov/26"]);
    expect(sales[5]).toEqual({ key: "2026-11", label: "nov/26", count: 1, cents: 480000 });
    expect(sales.slice(0, 5).every((month) => month.count === 0)).toBe(true);
  });

  it("atravessa a virada do ano", () => {
    const sales = buildMonthSales(FILHOTES, new Date("2026-02-10T15:00:00Z"));
    expect(sales[0].key).toBe("2025-09");
    expect(sales.find((month) => month.key === "2026-01")?.count).toBe(1);
  });
});

describe("buildAnalytics", () => {
  it("leitura que falhou vira null, nunca zero", () => {
    const data = buildAnalytics({ leads: null, puppies: null, now: AGORA, period: 30 });
    expect(data.leads).toBeNull();
    expect(data.stock).toBeNull();
    expect(data.sales).toBeNull();
    expect(data.range).toEqual({ startKey: "2026-10-12", endKey: "2026-11-10", startLabel: "12/10", endLabel: "10/11" });
  });
});
