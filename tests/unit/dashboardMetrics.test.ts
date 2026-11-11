import { describe, expect, it } from "vitest";

import { normalizeLeadStatus, toDbLeadStatus } from "@/domain/lead-status";
import {
  buildDashboard,
  buildLeads,
  buildRecommendations,
  buildStock,
  dayKey,
  formatAge,
  formatDuration,
  leadSource,
  puppyHasMedia,
  puppyPriceCents,
  shiftDayKey,
  sourceLabel,
  type DashboardLeadRow,
  type DashboardPuppyRow,
} from "@/lib/admin/dashboardMetrics";

// Meio-dia de 10/11/2026 em Sao Paulo (UTC-3).
const AGORA = new Date("2026-11-10T15:00:00Z");

let seq = 0;
function lead(partial: Partial<DashboardLeadRow> & { created_at: string }): DashboardLeadRow {
  seq += 1;
  return { id: `lead-${seq}`, status: "novo", ...partial };
}
function filhote(partial: Partial<DashboardPuppyRow>): DashboardPuppyRow {
  seq += 1;
  return { id: `puppy-${seq}`, status: "disponivel", price_cents: 450000, midia: [{ url: "https://x/y.jpg" }], created_at: "2026-11-01T12:00:00Z", ...partial };
}

describe("datas no horario de Sao Paulo", () => {
  it("joga para o dia anterior o que acontece antes das 3h UTC", () => {
    expect(dayKey("2026-11-11T01:30:00Z")).toBe("2026-11-10");
    expect(dayKey("2026-11-11T03:00:00Z")).toBe("2026-11-11");
  });

  it("devolve null para data vazia ou invalida", () => {
    expect(dayKey(null)).toBeNull();
    expect(dayKey("")).toBeNull();
    expect(dayKey("nao e data")).toBeNull();
  });

  it("soma e subtrai dias atravessando o mes", () => {
    expect(shiftDayKey("2026-11-01", -1)).toBe("2026-10-31");
    expect(shiftDayKey("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("escreve idade e duracao em portugues", () => {
    expect(formatAge(0.25)).toBe("há 15 min");
    expect(formatAge(5.2)).toBe("há 5 h");
    expect(formatAge(30)).toBe("há 1 dia");
    expect(formatAge(80)).toBe("há 3 dias");
    expect(formatDuration(0.5)).toBe("30 min");
    expect(formatDuration(5.5)).toBe("5,5 h");
    expect(formatDuration(2)).toBe("2 h");
    expect(formatDuration(72)).toBe("3 dias");
  });
});

describe("status de lead", () => {
  it("aceita os cinco valores do banco e traduz os apelidos antigos", () => {
    expect(normalizeLeadStatus("Convertido")).toBe("convertido");
    expect(normalizeLeadStatus("em_contato")).toBe("contatado");
    expect(normalizeLeadStatus("fechado")).toBe("convertido");
    expect(normalizeLeadStatus(null)).toBe("novo");
    expect(normalizeLeadStatus("qualquer coisa")).toBe("novo");
  });

  it("nunca manda ao banco um valor que o enum recusa", () => {
    expect(toDbLeadStatus("em_contato")).toBe("contatado");
    expect(toDbLeadStatus("fechado")).toBe("convertido");
    expect(toDbLeadStatus("qualquer coisa")).toBeNull();
    expect(toDbLeadStatus("")).toBeNull();
  });
});

describe("estoque", () => {
  it("conta os status em portugues, como o banco de producao guarda", () => {
    const stock = buildStock(
      [
        filhote({ status: "disponivel" }),
        filhote({ status: "disponivel" }),
        filhote({ status: "reservado" }),
        filhote({ status: "vendido", sold_at: "2026-11-05T12:00:00Z" }),
        filhote({ status: "indisponivel" }),
      ],
      AGORA,
    );
    expect(stock).toMatchObject({ total: 5, available: 2, reserved: 1, sold: 1, unavailable: 1 });
    expect(stock.availableValueCents).toBe(900000);
  });

  it("soma as vendas do mes pela data de venda e separa as sem data", () => {
    const stock = buildStock(
      [
        filhote({ status: "vendido", sold_at: "2026-11-02T12:00:00Z", price_cents: 500000 }),
        // 01/11 as 01h UTC ainda e 31/10 em Sao Paulo: fica fora de novembro
        filhote({ status: "vendido", sold_at: "2026-11-01T01:00:00Z", price_cents: 700000 }),
        filhote({ status: "vendido", sold_at: null, price_cents: 600000 }),
      ],
      AGORA,
    );
    expect(stock.sold).toBe(3);
    expect(stock.soldThisMonth).toEqual({ count: 1, cents: 500000, monthLabel: "novembro" });
    expect(stock.soldWithoutDate).toBe(1);
  });

  it("aponta sem preco, sem foto e parado ha mais de 90 dias", () => {
    const stock = buildStock(
      [
        filhote({ price_cents: null }),
        filhote({ status: "reservado", price_cents: 0 }),
        filhote({ status: "vendido", price_cents: null, sold_at: "2026-11-02T12:00:00Z" }), // vendido nao conta
        filhote({ midia: [] }),
        filhote({ midia: null }),
        filhote({ created_at: "2026-07-01T12:00:00Z" }),
        filhote({ status: "reservado", created_at: "2026-01-01T12:00:00Z" }), // reservado nao e "parado"
      ],
      AGORA,
    );
    expect(stock.noPrice).toBe(2);
    expect(stock.noPhoto).toBe(2);
    expect(stock.aged).toBe(1);
  });

  it("le preco da coluna antiga e midia em varios formatos", () => {
    expect(puppyPriceCents({ price_cents: null, preco: "4500.00" })).toBe(450000);
    expect(puppyPriceCents({ price_cents: 123, preco: 9 })).toBe(123);
    expect(puppyPriceCents({ price_cents: null, preco: null })).toBe(0);
    expect(puppyHasMedia(["https://x/a.jpg"])).toBe(true);
    expect(puppyHasMedia([{ url: "https://x/a.jpg" }])).toBe(true);
    expect(puppyHasMedia('[{"url":"https://x/a.jpg"}]')).toBe(true);
    expect(puppyHasMedia([{ url: "" }, ""])).toBe(false);
    expect(puppyHasMedia("[]")).toBe(false);
    expect(puppyHasMedia({})).toBe(false);
    expect(puppyHasMedia(undefined)).toBe(false);
  });
});

describe("leads", () => {
  it("separa hoje e ontem pelo dia de Sao Paulo", () => {
    const leads = buildLeads(
      [
        lead({ created_at: "2026-11-10T14:00:00Z" }), // hoje 11h
        lead({ created_at: "2026-11-10T03:30:00Z" }), // hoje 00h30
        lead({ created_at: "2026-11-10T02:30:00Z" }), // ontem 23h30
        lead({ created_at: "2026-11-09T15:00:00Z" }), // ontem
      ],
      null,
      AGORA,
    );
    expect(leads.today).toBe(2);
    expect(leads.yesterday).toBe(2);
  });

  it("compara os ultimos 7 dias com os 7 anteriores", () => {
    const rows = [
      ...Array.from({ length: 6 }, () => lead({ created_at: "2026-11-08T15:00:00Z" })),
      ...Array.from({ length: 4 }, () => lead({ created_at: "2026-10-30T15:00:00Z" })),
      lead({ created_at: "2026-10-20T15:00:00Z" }), // fora das duas semanas
    ];
    const leads = buildLeads(rows, null, AGORA);
    expect(leads.last7).toBe(6);
    expect(leads.prev7).toBe(4);
    expect(leads.deltaPct).toBe(50);
    expect(leads.last30).toBe(11);
  });

  it("nao inventa variacao quando a semana anterior ficou vazia", () => {
    const leads = buildLeads([lead({ created_at: "2026-11-09T15:00:00Z" })], null, AGORA);
    expect(leads.prev7).toBe(0);
    expect(leads.deltaPct).toBeNull();
  });

  it("entrega 14 dias seguidos terminando hoje, com zero onde nao houve lead", () => {
    const leads = buildLeads([lead({ created_at: "2026-11-10T14:00:00Z" })], null, AGORA);
    expect(leads.byDay).toHaveLength(14);
    expect(leads.byDay[0]).toMatchObject({ key: "2026-10-28", label: "28/10", value: 0 });
    expect(leads.byDay[13]).toMatchObject({ key: "2026-11-10", label: "10/11", weekday: "ter", value: 1 });
  });

  it("ignora lead com data no futuro ou invalida", () => {
    const leads = buildLeads(
      [lead({ created_at: "2026-11-12T15:00:00Z" }), lead({ created_at: "lixo" }), lead({ created_at: "2026-11-10T14:00:00Z" })],
      null,
      AGORA,
    );
    expect(leads.today).toBe(1);
    expect(leads.last30).toBe(1);
  });

  it("monta o funil de 30 dias e a taxa de conversao com os status de producao", () => {
    const leads = buildLeads(
      [
        lead({ created_at: "2026-11-09T15:00:00Z", status: "novo" }),
        lead({ created_at: "2026-11-08T15:00:00Z", status: "contatado" }),
        lead({ created_at: "2026-11-07T15:00:00Z", status: "qualificado" }),
        lead({ created_at: "2026-11-06T15:00:00Z", status: "convertido" }),
        lead({ created_at: "2026-11-05T15:00:00Z", status: "perdido" }),
      ],
      null,
      AGORA,
    );
    expect(leads.pipeline30.map((step) => [step.status, step.count])).toEqual([
      ["novo", 1],
      ["contatado", 1],
      ["qualificado", 1],
      ["convertido", 1],
      ["perdido", 1],
    ]);
    expect(leads.conversionPct30).toBe(20);
  });

  it("conta quem aguarda o primeiro contato e ha quanto tempo", () => {
    const leads = buildLeads(
      [
        lead({ created_at: "2026-11-10T13:00:00Z" }), // 2 h
        lead({ created_at: "2026-11-08T15:00:00Z" }), // 48 h
        lead({ created_at: "2026-11-08T15:00:00Z", status: "contatado" }),
      ],
      null,
      AGORA,
    );
    expect(leads.awaiting).toEqual({ count: 2, over24h: 1, oldestHours: 48 });
  });

  it("so calcula tempo de resposta quando a data do primeiro contato existe", () => {
    const semData = buildLeads([lead({ created_at: "2026-11-09T15:00:00Z", status: "contatado" })], null, AGORA);
    expect(semData.response).toEqual({ avgHours: null, sample: 0 });

    const comData = buildLeads(
      [
        lead({ created_at: "2026-11-09T12:00:00Z", status: "contatado", first_responded_at: "2026-11-09T14:00:00Z" }),
        lead({ created_at: "2026-11-08T12:00:00Z", status: "contatado", first_responded_at: "2026-11-08T16:00:00Z" }),
        // resposta "antes" da chegada e dado quebrado: fica fora
        lead({ created_at: "2026-11-08T12:00:00Z", status: "contatado", first_responded_at: "2026-11-07T12:00:00Z" }),
      ],
      null,
      AGORA,
    );
    expect(comData.response).toEqual({ avgHours: 3, sample: 2 });
  });

  it("agrupa a origem pela campanha e conta conversao so no status Convertido", () => {
    const leads = buildLeads(
      [
        lead({ created_at: "2026-11-09T15:00:00Z", utm_source: "Google", source: "google", status: "convertido" }),
        lead({ created_at: "2026-11-09T15:00:00Z", utm_source: "google", status: "contatado" }),
        lead({ created_at: "2026-11-09T15:00:00Z", utm_source: null, source: "site_org" }),
        lead({ created_at: "2026-11-09T15:00:00Z", utm_source: " ", source: null }),
      ],
      null,
      AGORA,
    );
    expect(leads.sources30).toEqual([
      { source: "google", label: "Google", count: 2, pct: 50, converted: 1 },
      { source: "direto", label: "Sem origem registrada", count: 1, pct: 25, converted: 0 },
      { source: "site_org", label: "Site, sem campanha", count: 1, pct: 25, converted: 0 },
    ]);
    expect(leadSource({ utm_source: null, source: null })).toBe("direto");
    expect(sourceLabel("meta_ads")).toBe("Meta ads");
  });

  it("lista os mais recentes primeiro, com o filhote associado em qualquer formato", () => {
    const puppies = [filhote({ id: "p1", name: "Thor" }), filhote({ id: "p2", name: null, nome: "Mel" })];
    const leads = buildLeads(
      [
        lead({ id: "a", created_at: "2026-11-08T15:00:00Z", nome: "Ana", cidade: "Bragança Paulista", estado: "SP", lead_ai_insights: { matched_puppy_id: "p1" } }),
        lead({ id: "b", created_at: "2026-11-10T14:00:00Z", nome: null, first_name: "Bia", cor_preferida: "laranja", sexo_preferido: "fêmea", lead_ai_insights: [{ matched_puppy_id: "p2" }] }),
        lead({ id: "c", created_at: "2026-11-09T15:00:00Z", nome: " ", lead_ai_insights: [{ matched_puppy_id: "nao-existe" }] }),
      ],
      puppies,
      AGORA,
    );
    expect(leads.latest.map((item) => item.id)).toEqual(["b", "c", "a"]);
    expect(leads.latest[0]).toMatchObject({ name: "Bia", preference: "laranja · fêmea", place: null, matchedPuppy: { id: "p2", name: "Mel" }, ageHours: 1 });
    expect(leads.latest[1]).toMatchObject({ name: "Lead sem nome", matchedPuppy: null });
    expect(leads.latest[2]).toMatchObject({ place: "Bragança Paulista · SP", matchedPuppy: { id: "p1", name: "Thor" } });
  });

  it("escreve o sexo pedido com acento, mesmo quando o formulario gravou sem", () => {
    const leads = buildLeads(
      [
        lead({ id: "a", created_at: "2026-11-10T14:00:00Z", cor_preferida: "creme", sexo_preferido: "femea" }),
        lead({ id: "b", created_at: "2026-11-10T13:00:00Z", sexo_preferido: " Macho " }),
        lead({ id: "c", created_at: "2026-11-10T12:00:00Z", sexo_preferido: "tanto faz" }),
      ],
      [],
      AGORA,
    );
    expect(leads.latest.map((item) => item.preference)).toEqual(["creme · fêmea", "macho", "tanto faz"]);
  });

  it("cruza a cor pedida com o estoque disponivel, sem diferenciar maiusculas", () => {
    const puppies = [filhote({ color: "Laranja" }), filhote({ color: null, cor: "creme", status: "vendido" })];
    const rows = [
      lead({ created_at: "2026-11-09T15:00:00Z", cor_preferida: "laranja" }),
      lead({ created_at: "2026-11-09T15:00:00Z", cor_preferida: "Creme" }),
      lead({ created_at: "2026-11-09T15:00:00Z", cor_preferida: "creme " }),
      lead({ created_at: "2026-11-09T15:00:00Z", cor_preferida: null }),
    ];
    expect(buildLeads(rows, puppies, AGORA).demandByColor30).toEqual([
      { color: "Creme", leads: 2, stock: 0 },
      { color: "Laranja", leads: 1, stock: 1 },
    ]);
    // sem leitura de filhotes, o estoque vem null — nunca zero
    expect(buildLeads(rows, null, AGORA).demandByColor30[0]).toEqual({ color: "Creme", leads: 2, stock: null });
  });
});

describe("recomendacoes automaticas", () => {
  it("fica vazia quando nada pede acao", () => {
    const data = buildDashboard({
      leads: [lead({ created_at: "2026-11-09T15:00:00Z", status: "contatado" })],
      puppies: [filhote({})],
      now: AGORA,
    });
    expect(data.recommendations).toEqual([]);
  });

  it("traz a regra que gerou cada item e ordena do mais grave para o menos", () => {
    const data = buildDashboard({
      leads: [
        lead({ created_at: "2026-11-08T15:00:00Z" }), // novo ha 48 h
        lead({ created_at: "2026-11-10T14:00:00Z" }), // novo ha 1 h
        lead({ created_at: "2026-11-09T15:00:00Z", status: "contatado", cor_preferida: "preto" }),
        lead({ created_at: "2026-11-09T15:00:00Z", status: "contatado", cor_preferida: "preto" }),
      ],
      puppies: [
        filhote({ price_cents: null, midia: [], created_at: "2026-06-01T12:00:00Z", color: "laranja" }),
        filhote({ status: "vendido", sold_at: null }),
      ],
      now: AGORA,
    });
    const ids = data.recommendations.map((item) => item.id);
    expect(ids).toEqual([
      "leads-aguardando-24h",
      "leads-novos",
      "cor-sem-estoque-preto",
      "filhotes-sem-preco",
      "filhotes-sem-foto",
      "filhotes-parados",
      "vendidos-sem-data",
    ]);
    expect(data.recommendations.map((item) => item.severity)).toEqual([
      "critica",
      "atencao",
      "atencao",
      "atencao",
      "atencao",
      "info",
      "info",
    ]);
    for (const item of data.recommendations) {
      expect(item.rule.length).toBeGreaterThan(20);
      expect(item.href.startsWith("/admin/")).toBe(true);
    }
    expect(data.recommendations[0].title).toBe("1 lead espera o primeiro contato há mais de 24 horas");
    expect(data.recommendations[5].title).toBe("1 filhote está disponível há mais de 90 dias");
  });

  it("avisa queda de leads so com base suficiente na semana anterior", () => {
    const semana = (n: number, dia: string) => Array.from({ length: n }, () => lead({ created_at: `${dia}T15:00:00Z`, status: "contatado" }));
    const comBase = buildLeads([...semana(2, "2026-11-08"), ...semana(10, "2026-10-30")], null, AGORA);
    expect(buildRecommendations(comBase, null).map((item) => item.id)).toEqual(["queda-de-leads"]);

    const semBase = buildLeads([...semana(1, "2026-11-08"), ...semana(4, "2026-10-30")], null, AGORA);
    expect(buildRecommendations(semBase, null)).toEqual([]);
  });

  it("avisa quando ha filhotes cadastrados e nenhum disponivel", () => {
    const stock = buildStock([filhote({ status: "reservado" }), filhote({ status: "vendido", sold_at: "2026-11-02T12:00:00Z" })], AGORA);
    expect(buildRecommendations(null, stock).map((item) => item.id)).toEqual(["sem-disponiveis"]);
    // sem nenhum cadastro nao e alerta: e catalogo vazio
    expect(buildRecommendations(null, buildStock([], AGORA))).toEqual([]);
  });
});

describe("falha de leitura", () => {
  it("mantem o estoque quando os leads falham, e o contrario", () => {
    const soEstoque = buildDashboard({ leads: null, puppies: [filhote({})], now: AGORA });
    expect(soEstoque.leads).toBeNull();
    expect(soEstoque.stock?.available).toBe(1);

    const soLeads = buildDashboard({ leads: [lead({ created_at: "2026-11-10T14:00:00Z" })], puppies: null, now: AGORA });
    expect(soLeads.stock).toBeNull();
    expect(soLeads.leads?.today).toBe(1);
    expect(soLeads.generatedAt).toBe(AGORA.toISOString());
  });
});
