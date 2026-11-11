/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AnalyticsView } from "../../app/(admin)/admin/(protected)/analytics/AnalyticsView";
import type { AnalyticsLoad } from "../../src/lib/admin/analyticsData";
import { buildAnalytics, type AnalyticsLeadRow, type AnalyticsPeriod } from "../../src/lib/admin/analyticsMetrics";
import type { DashboardPuppyRow } from "../../src/lib/admin/dashboardMetrics";

vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: vi.fn(), hasServiceRoleKey: () => true }));

afterEach(cleanup);

// Meio-dia de 10/11/2026 em Sao Paulo (UTC-3).
const AGORA = new Date("2026-11-10T15:00:00Z");

const LEADS: AnalyticsLeadRow[] = [
  { id: "a1", created_at: "2026-11-10T13:00:00Z", status: "contatado", cidade: "São Paulo", estado: "SP", cor_preferida: "Laranja", sexo_preferido: "macho", utm_source: "google", utm_campaign: "Lulu Marca", page: "/filhotes", first_responded_at: "2026-11-10T13:30:00Z" },
  { id: "a2", created_at: "2026-11-09T12:00:00Z", status: "convertido", cidade: "sao paulo", cor_preferida: "Laranja", utm_source: "google", page: "/filhotes" },
  { id: "a3", created_at: "2026-11-05T12:00:00Z", status: "novo", cor_preferida: "Preto" },
  { id: "a4", created_at: "2026-10-30T12:00:00Z", status: "perdido" },
];

const FILHOTES: DashboardPuppyRow[] = [
  { id: "p-1", nome: "Thor", status: "disponivel", price_cents: 450000, cor: "Laranja", midia: [], created_at: "2026-11-01T12:00:00Z" },
  { id: "p-2", nome: "Mel", status: "vendido", price_cents: 480000, cor: "Laranja", midia: [], created_at: "2026-10-01T12:00:00Z", sold_at: "2026-11-03T12:00:00Z" },
  { id: "p-3", nome: "Zeca", status: "vendido", price_cents: 400000, cor: "Creme", midia: [], created_at: "2025-12-01T12:00:00Z" },
];

function carga(
  parte: {
    leads?: AnalyticsLeadRow[] | null;
    puppies?: DashboardPuppyRow[] | null;
    configured?: boolean;
    period?: AnalyticsPeriod;
    truncated?: boolean;
  } = {},
): AnalyticsLoad {
  const leads = parte.leads === undefined ? LEADS : parte.leads;
  const puppies = parte.puppies === undefined ? FILHOTES : parte.puppies;
  const configured = parte.configured ?? true;
  return {
    data: buildAnalytics({ leads, puppies, now: AGORA, period: parte.period ?? 7, leadsTruncated: parte.truncated }),
    configured,
    errors: {
      leads: configured && leads === null ? { code: "42703" } : null,
      puppies: configured && puppies === null ? { code: "PGRST205" } : null,
    },
  };
}

/** Regras de estrutura do axe. Contraste fica de fora: o happy-dom nao calcula cor. */
async function violacoes(container: HTMLElement): Promise<string[]> {
  const result = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  return result.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`);
}

describe("AnalyticsView", () => {
  it("mostra os números do período e marca o período escolhido", async () => {
    const { container } = render(<AnalyticsView {...carga()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Analytics" })).toBeInTheDocument();

    const periodo = screen.getByRole("navigation", { name: "Período" });
    const sete = within(periodo).getByRole("link", { name: "7 dias" });
    expect(sete).toHaveAttribute("aria-current", "page");
    expect(sete).toHaveAttribute("href", "/admin/analytics?period=7");
    expect(within(periodo).getByRole("link", { name: "30 dias" })).not.toHaveAttribute("aria-current");

    expect(screen.getByText("Leads em 7 dias")).toBeInTheDocument();
    expect(screen.getByText(/200% a mais que nos 7 dias anteriores \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/1 de 3 leads com status Convertido hoje/)).toBeInTheDocument();

    const grafico = screen.getByRole("img", { name: /Leads por dia, de 04\/11 a hoje\. Total: 3 leads/ });
    expect(grafico).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Leads por dia no período" })).toBeInTheDocument();

    expect(await violacoes(container)).toEqual([]);
  });

  it("junta as cidades e avisa quantos leads não informaram", () => {
    render(<AnalyticsView {...carga()} />);
    const cidades = screen.getByRole("table", { name: "Tabela de cidades dos leads" });
    expect(within(cidades).getByRole("rowheader", { name: "São Paulo · SP" })).toBeInTheDocument();
    expect(screen.getByText("1 lead não informou cidade.")).toBeInTheDocument();
    expect(screen.getByText("2 leads não vieram com campanha no link.")).toBeInTheDocument();
  });

  it("aponta a cor pedida que está sem estoque", () => {
    render(<AnalyticsView {...carga()} />);
    const cores = screen.getByRole("table", { name: "Cores pedidas pelos leads e filhotes disponíveis" });
    const preto = within(cores).getByRole("rowheader", { name: "Preto" }).closest("tr") as HTMLElement;
    expect(within(preto).getByText("0 · sem estoque")).toBeInTheDocument();
  });

  it("mostra as vendas por mês e avisa do vendido sem data", () => {
    render(<AnalyticsView {...carga()} />);
    const vendas = screen.getByRole("table", { name: "Filhotes vendidos por mês" });
    const novembro = within(vendas).getByRole("rowheader", { name: "nov/26" }).closest("tr") as HTMLElement;
    expect(within(novembro).getByText("1")).toBeInTheDocument();
    expect(within(novembro).getByText(/4\.800/)).toBeInTheDocument();
    expect(screen.getByText(/1 filhote vendido está sem data de venda/)).toBeInTheDocument();
  });

  it("em 90 dias o gráfico passa a ser por semana", () => {
    render(<AnalyticsView {...carga({ period: 90 })} />);
    expect(screen.getByRole("heading", { name: "Leads por semana" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "90 dias" })).toHaveAttribute("aria-current", "page");
  });

  it("sem leads no período escreve o vazio em vez de um gráfico em branco", async () => {
    const { container } = render(<AnalyticsView {...carga({ leads: [] })} />);
    expect(screen.getAllByText("Nenhum lead chegou neste período.").length).toBeGreaterThan(0);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(await violacoes(container)).toEqual([]);
  });

  it("falha ao ler os leads vira aviso, não zeros", async () => {
    const { container } = render(<AnalyticsView {...carga({ leads: null })} />);
    expect(screen.getByText("Não foi possível ler os leads agora")).toBeInTheDocument();
    expect(screen.queryByText("Leads em 7 dias")).not.toBeInTheDocument();
    // os filhotes foram lidos e continuam na tela
    expect(screen.getByRole("heading", { name: "Filhotes por status" })).toBeInTheDocument();
    expect(await violacoes(container)).toEqual([]);
  });

  it("falha ao ler os filhotes deixa o estoque sem número", () => {
    render(<AnalyticsView {...carga({ puppies: null })} />);
    expect(screen.getByText("Não foi possível ler os filhotes agora")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Filhotes por status" })).not.toBeInTheDocument();
    expect(screen.getByText(/o estoque não pôde ser lido agora/i)).toBeInTheDocument();
  });

  it("sem banco ligado avisa e não desenha números", () => {
    render(<AnalyticsView {...carga({ leads: null, puppies: null, configured: false })} />);
    expect(screen.getByRole("alert")).toHaveTextContent("O banco de dados não está ligado neste ambiente");
    expect(screen.queryByText("Leads em 7 dias")).not.toBeInTheDocument();
  });

  it("avisa quando a leitura parou no teto", () => {
    render(<AnalyticsView {...carga({ truncated: true })} />);
    expect(screen.getByText(/A leitura parou nos 5\.000 leads mais recentes/)).toBeInTheDocument();
    expect(screen.getByText(/Sem comparação: o período anterior não foi lido inteiro/)).toBeInTheDocument();
  });
});
