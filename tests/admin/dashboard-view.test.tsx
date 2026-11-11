/// <reference types="@testing-library/jest-dom" />
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { axisTop } from "../../app/(admin)/admin/(protected)/dashboard/DashboardFigures";
import { DashboardView, formatClock } from "../../app/(admin)/admin/(protected)/dashboard/DashboardView";
import { RefreshButton } from "../../app/(admin)/admin/(protected)/dashboard/RefreshButton";
import type { DashboardLoad } from "../../src/lib/admin/dashboardData";
import {
  buildDashboard,
  type DashboardLeadRow,
  type DashboardPuppyRow,
} from "../../src/lib/admin/dashboardMetrics";

afterEach(cleanup);

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh }),
  usePathname: () => "/admin/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Meio-dia de 10/11/2026 em Sao Paulo (UTC-3).
const AGORA = new Date("2026-11-10T15:00:00Z");

const LEADS: DashboardLeadRow[] = [
  // parado em Novo ha mais de 24 h, pediu uma cor sem estoque
  { id: "lead-1", created_at: "2026-11-08T12:00:00Z", nome: "Pessoa Um", cidade: "Campinas", estado: "SP", cor_preferida: "Preto", sexo_preferido: "macho", status: "novo", source: "site_org" },
  { id: "lead-2", created_at: "2026-11-09T12:00:00Z", nome: "Pessoa Dois", cor_preferida: "Preto", status: "novo", source: "google" },
  { id: "lead-3", created_at: "2026-11-10T13:00:00Z", nome: "Pessoa Tres", cor_preferida: "Laranja", status: "contatado", source: "google", first_responded_at: "2026-11-10T14:00:00Z" },
  { id: "lead-4", created_at: "2026-11-05T12:00:00Z", nome: "Pessoa Quatro", cor_preferida: "Laranja", status: "convertido", source: "instagram" },
  { id: "lead-5", created_at: "2026-10-28T12:00:00Z", nome: "Pessoa Cinco", status: "perdido", source: "site_org" },
];

const FILHOTES: DashboardPuppyRow[] = [
  { id: "p-1", nome: "Thor", status: "disponivel", price_cents: 450000, cor: "Laranja", midia: ["https://x/1.jpg"], created_at: "2026-11-01T12:00:00Z" },
  { id: "p-2", nome: "Luna", status: "disponivel", price_cents: null, cor: "Creme", midia: [], created_at: "2026-11-02T12:00:00Z" },
  { id: "p-3", nome: "Bob", status: "reservado", price_cents: 500000, cor: "Branco", midia: ["https://x/3.jpg"], created_at: "2026-10-20T12:00:00Z" },
  { id: "p-4", nome: "Mel", status: "vendido", price_cents: 480000, cor: "Laranja", midia: ["https://x/4.jpg"], created_at: "2026-10-01T12:00:00Z", sold_at: "2026-11-03T12:00:00Z" },
];

function carga(parte: { leads?: DashboardLeadRow[] | null; puppies?: DashboardPuppyRow[] | null; configured?: boolean } = {}): DashboardLoad {
  const leads = parte.leads === undefined ? LEADS : parte.leads;
  const puppies = parte.puppies === undefined ? FILHOTES : parte.puppies;
  const configured = parte.configured ?? true;
  return {
    data: buildDashboard({ leads, puppies, now: AGORA }),
    configured,
    errors: {
      leads: configured && leads === null ? { code: "42703" } : null,
      puppies: configured && puppies === null ? { code: "PGRST205" } : null,
    },
  };
}

/** Regras de estrutura do axe. Contraste fica de fora: o happy-dom nao calcula cor. */
async function violacoes(container: HTMLElement): Promise<string[]> {
  const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  return result.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.html).join(" | ")}`);
}

describe("dashboard com os dois blocos lidos", () => {
  it("mostra os seis numeros do resumo com rotulo", () => {
    render(<DashboardView {...carga()} />);
    for (const rotulo of [
      "Leads hoje",
      "Leads em 7 dias",
      "Aguardando 1º contato",
      "Conversão em 30 dias",
      "Filhotes disponíveis",
      "Vendas em novembro",
    ]) {
      expect(screen.getByText(rotulo)).toBeInTheDocument();
    }
    // 1 de 5 leads dos ultimos 30 dias esta como Convertido
    expect(screen.getByText("Conversão em 30 dias").parentElement).toHaveTextContent("20%");
    expect(screen.getByText(/1 de 5 leads com status Convertido/)).toBeInTheDocument();
  });

  it("escreve a regra em cada recomendacao e leva para a tela certa", () => {
    render(<DashboardView {...carga()} />);
    const bloco = screen.getByRole("region", { name: "Recomendações automáticas" });
    const itens = within(bloco).getAllByRole("listitem");
    expect(itens.length).toBeGreaterThan(0);
    for (const item of itens) {
      expect(within(item).getByText("Regra:")).toBeInTheDocument();
      expect(within(item).getByRole("link")).toHaveAttribute("href", expect.stringMatching(/^\/admin\//));
    }
    expect(within(bloco).getByText("Urgente")).toBeInTheDocument();
    expect(within(bloco).getByRole("link", { name: /leads novos/i })).toHaveAttribute("href", "/admin/leads?status=novo");
  });

  it("nao chama as regras de IA", () => {
    const { container } = render(<DashboardView {...carga()} />);
    expect(container.textContent).not.toMatch(/\bIA\b|inteligência artificial/i);
    expect(screen.getByText(/Regras fixas aplicadas aos números desta tela/)).toBeInTheDocument();
  });

  it("liga cada lead recente a sua ficha", () => {
    render(<DashboardView {...carga()} />);
    const bloco = screen.getByRole("region", { name: "Últimos leads" });
    expect(within(bloco).getByRole("link", { name: /Pessoa Tres/ })).toHaveAttribute("href", "/admin/leads/lead-3");
    expect(within(bloco).getByRole("link", { name: "Ver todos" })).toHaveAttribute("href", "/admin/leads");
  });

  it("descreve o grafico em texto e oferece os mesmos numeros em tabela", () => {
    render(<DashboardView {...carga()} />);
    const grafico = screen.getByRole("img", { name: /Leads por dia, de/ });
    expect(grafico.getAttribute("aria-label")).toMatch(/Total: 5 leads\. .*Hoje: 1 lead\./);
    expect(screen.getByText("Ver os números em tabela")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /Leads por dia nos últimos 14 dias/, hidden: true })).toBeInTheDocument();
  });

  it("leva cada etapa do funil e cada status de filhote para a lista filtrada", () => {
    render(<DashboardView {...carga()} />);
    const funil = screen.getByRole("region", { name: "Em que etapa estão os leads" });
    expect(within(funil).getByRole("link", { name: /Qualificado/ })).toHaveAttribute("href", "/admin/leads?status=qualificado");
    const estoque = screen.getByRole("region", { name: "Filhotes por status" });
    expect(within(estoque).getByRole("link", { name: /Reservados/ })).toHaveAttribute("href", "/admin/puppies?status=reserved");
    expect(within(estoque).getByText(/4 filhotes cadastrados/)).toBeInTheDocument();
  });

  it("marca a cor pedida que nao tem filhote disponivel", () => {
    render(<DashboardView {...carga()} />);
    const tabela = screen.getByRole("region", { name: "Tabela de cores pedidas e estoque" });
    const linha = within(tabela).getByRole("row", { name: /Preto/ });
    expect(within(linha).getByText("0 · sem estoque")).toBeInTheDocument();
  });

  it("passa nas regras de estrutura do axe", async () => {
    const { container } = render(<DashboardView {...carga()} />);
    expect(await violacoes(container)).toEqual([]);
  });
});

describe("dashboard sem movimento", () => {
  it("explica o vazio em vez de desenhar grafico e tabela sem nada", () => {
    render(<DashboardView {...carga({ leads: [], puppies: [] })} />);
    expect(screen.getByText("Nenhum lead nos últimos 14 dias.")).toBeInTheDocument();
    expect(screen.getByText("Nenhum lead nos últimos 90 dias.")).toBeInTheDocument();
    expect(screen.getByText(/Nenhum filhote cadastrado\./)).toBeInTheDocument();
    expect(screen.getByText("Nenhum lead informou cor nos últimos 30 dias.")).toBeInTheDocument();
    expect(screen.getByText(/Nada pede ação agora/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // sem lead no periodo nao existe taxa: travessao, nunca "0%"
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("passa nas regras de estrutura do axe", async () => {
    const { container } = render(<DashboardView {...carga({ leads: [], puppies: [] })} />);
    expect(await violacoes(container)).toEqual([]);
  });
});

describe("dashboard quando a leitura falha", () => {
  it("avisa a falha dos leads com o codigo e nao mostra zero no lugar", () => {
    render(<DashboardView {...carga({ leads: null })} />);
    const aviso = screen.getByRole("alert");
    expect(aviso).toHaveTextContent("Não foi possível ler os leads agora");
    expect(aviso).toHaveTextContent("42703");
    expect(screen.queryByText("Leads hoje")).not.toBeInTheDocument();
    expect(screen.queryByText("Últimos leads")).not.toBeInTheDocument();
    // o estoque foi lido e continua na tela
    expect(screen.getByText("Filhotes disponíveis")).toBeInTheDocument();
    expect(screen.getByText(/Parte dos dados não foi lida/)).toBeInTheDocument();
  });

  it("avisa a falha dos filhotes e mantem os leads", () => {
    render(<DashboardView {...carga({ puppies: null })} />);
    expect(screen.getByRole("alert")).toHaveTextContent("PGRST205");
    expect(screen.queryByText("Filhotes disponíveis")).not.toBeInTheDocument();
    expect(screen.getByText("Leads hoje")).toBeInTheDocument();
    expect(screen.getByText(/O estoque não pôde ser lido agora/)).toBeInTheDocument();
  });

  it("sem banco ligado mostra so o aviso, sem nenhum numero", () => {
    render(<DashboardView {...carga({ leads: null, puppies: null, configured: false })} />);
    expect(screen.getByRole("alert")).toHaveTextContent("O banco de dados não está ligado neste ambiente");
    expect(screen.queryByText("Leads hoje")).not.toBeInTheDocument();
    expect(screen.queryByText("Filhotes disponíveis")).not.toBeInTheDocument();
    expect(screen.queryByText("Recomendações automáticas")).not.toBeInTheDocument();
  });

  it("passa nas regras de estrutura do axe nos tres casos", async () => {
    for (const parte of [{ leads: null }, { puppies: null }, { leads: null, puppies: null, configured: false }]) {
      const { container, unmount } = render(<DashboardView {...carga(parte)} />);
      expect(await violacoes(container)).toEqual([]);
      unmount();
    }
  });
});

describe("pecas do dashboard", () => {
  it("escolhe um topo de eixo redondo e par", () => {
    expect(axisTop(1)).toBe(4);
    expect(axisTop(4)).toBe(4);
    expect(axisTop(5)).toBe(6);
    expect(axisTop(13)).toBe(16);
    expect(axisTop(100)).toBe(100);
    expect(axisTop(101)).toBe(200);
    expect(axisTop(1234)).toBe(2000);
  });

  it("mostra a hora de Sao Paulo", () => {
    expect(formatClock("2026-11-10T15:05:00Z")).toBe("12:05");
  });

  it("o botao Atualizar pede os dados de novo e nao anuncia nada ao abrir", () => {
    refresh.mockClear();
    render(<RefreshButton generatedAt="2026-11-10T15:05:00Z" timeLabel="12:05" />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
