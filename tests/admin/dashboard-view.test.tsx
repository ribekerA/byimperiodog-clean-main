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
  buildRotina,
  buildWhatsAppClicks,
  sourceLabel,
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
    // 1 de 5 leads dos ultimos 30 dias esta como Convertido. Com 5 leads,
    // porcentagem exagera: a tela mostra a contagem.
    const conversao = screen.getByText("Conversão em 30 dias").parentElement as HTMLElement;
    expect(conversao).toHaveTextContent("1 de 5");
    expect(conversao).not.toHaveTextContent("20%");
    expect(screen.getByText(/1 de 5 leads com status Convertido \(poucos leads/)).toBeInTheDocument();
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

describe("base pequena e cliques no WhatsApp", () => {
  it("compara a semana em contagem quando a base e pequena", () => {
    // 2 leads na semana anterior, 1 nesta: "1 a menos", nunca "50% a menos"
    const leads: DashboardLeadRow[] = [
      { id: "a", created_at: "2026-11-09T12:00:00Z", status: "novo" },
      { id: "b", created_at: "2026-11-01T12:00:00Z", status: "novo" },
      { id: "c", created_at: "2026-11-02T12:00:00Z", status: "novo" },
    ];
    render(<DashboardView {...carga({ leads })} />);
    const tile = screen.getByText("Leads em 7 dias").parentElement as HTMLElement;
    expect(tile).toHaveTextContent("1 a menos que nos 7 dias anteriores (2)");
    expect(tile).not.toHaveTextContent("%");
  });

  it("escreve origem e preferencia sem codigo cru", () => {
    expect(sourceLabel("direct")).toBe("Sem origem registrada");
    const leads: DashboardLeadRow[] = [
      { id: "a", created_at: "2026-11-09T12:00:00Z", nome: "Pessoa", cor_preferida: "Creme", sexo_preferido: "tanto_faz", status: "novo", source: "Direct" },
    ];
    const { container } = render(<DashboardView {...carga({ leads })} />);
    expect(container.textContent).not.toMatch(/tanto_faz|Direct/);
    expect(container.textContent).toMatch(/Creme · tanto faz/);
  });

  it("preenche com zero os dias que o GA4 nao devolve e soma as semanas", () => {
    const cliques = buildWhatsAppClicks({ "2026-11-10": 3, "2026-11-04": 2, "2026-10-28": 5, "2026-10-20": 9 }, AGORA);
    expect(cliques.days).toHaveLength(14);
    expect(cliques.days[0].key).toBe("2026-10-28");
    expect(cliques.days[13].key).toBe("2026-11-10");
    expect(cliques.today).toBe(3);
    expect(cliques.last7).toBe(5);
    expect(cliques.prev7).toBe(5);
    expect(cliques.days.filter((d) => d.value === 0)).toHaveLength(11);
  });

  it("mostra os cliques como cliques, nunca como leads ou vendas", () => {
    const data = buildWhatsAppClicks({ "2026-11-10": 3, "2026-11-04": 2 }, AGORA);
    render(<DashboardView {...carga()} whatsapp={{ status: "ok", data }} />);
    const bloco = screen.getByRole("region", { name: "Cliques no WhatsApp" });
    expect(bloco).toHaveTextContent("5 cliques em 7 dias");
    expect(bloco).toHaveTextContent("não conversas nem vendas");
    expect(within(bloco).getByRole("img")).toHaveAttribute("aria-label", expect.stringMatching(/^Cliques no WhatsApp por dia/));
    expect(within(bloco).queryByText(/\blead/i)).not.toBeInTheDocument();
  });

  it("sem leitura do GA4, diz que nao verificou em vez de mostrar zero", async () => {
    const { container } = render(
      <DashboardView {...carga()} whatsapp={{ status: "erro", motivo: "O Google respondeu 403 ao ler o GA4." }} />,
    );
    const bloco = screen.getByRole("region", { name: "Cliques no WhatsApp" });
    expect(bloco).toHaveTextContent("Cliques não verificados agora.");
    expect(bloco).toHaveTextContent("O Google respondeu 403");
    expect(within(bloco).queryByRole("img")).not.toBeInTheDocument();
    expect(await violacoes(container)).toEqual([]);
  });

  it("sem conexao com o GA4, avisa que nao leu", () => {
    render(<DashboardView {...carga()} whatsapp={{ status: "nao_conectado" }} />);
    expect(screen.getByRole("region", { name: "Cliques no WhatsApp" })).toHaveTextContent("não está conectado");
  });
});

describe("rotina do dia", () => {
  it("marca em dia so o que o dado comprova", () => {
    const { leads, stock } = carga().data;
    const rotina = buildRotina(leads, stock)!;
    const estado = Object.fromEntries(rotina.map((item) => [item.id, item.feito]));
    expect(estado).toEqual({
      "responder-atrasados": false,
      "responder-recentes": true,
      "cores-sem-estoque": false,
      "catalogo-com-disponivel": true,
      "cadastro-completo": false,
      "filhotes-parados": true,
      "vendas-com-data": true,
    });
    const cores = rotina.find((item) => item.id === "cores-sem-estoque")!;
    expect(cores.pendente).toContain("Preto");
    expect(cores.pendente).not.toContain("Laranja");
    const cadastro = rotina.find((item) => item.id === "cadastro-completo")!;
    expect(cadastro.pendente).toBe("1 filhote sem preço e 1 filhote disponível sem foto.");
  });

  it("mostra o progresso e o proximo passo com link", async () => {
    const { container } = render(<DashboardView {...carga()} />);
    const rotina = screen.getByRole("region", { name: "Rotina do dia" });
    expect(within(rotina).getByText(/^4 de 7 conferências em dia/)).toBeInTheDocument();
    expect(within(rotina).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "4");
    expect(within(rotina).getByRole("link", { name: /Abrir leads novos/ })).toHaveAttribute("href", "/admin/leads?status=novo");
    expect(await violacoes(container)).toEqual([]);
  });

  it("some quando leads ou filhotes nao foram lidos", () => {
    expect(buildRotina(null, carga().data.stock)).toBeNull();
    render(<DashboardView {...carga({ leads: null })} />);
    expect(screen.queryByRole("region", { name: "Rotina do dia" })).not.toBeInTheDocument();
  });
});

describe("pecas do dashboard", () => {
  it("escolhe um topo de eixo redondo e par", () => {
    expect(axisTop(1)).toBe(2);
    expect(axisTop(2)).toBe(2);
    expect(axisTop(3)).toBe(4);
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
