/// <reference types="@testing-library/jest-dom" />
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh }),
  usePathname: () => "/admin/leads",
  useSearchParams: () => new URLSearchParams(),
}));

import LeadsCRM, { type LeadsCRMProps } from "../../app/(admin)/admin/(protected)/leads/LeadsCRM";
import type { LeadListItem } from "../../app/(admin)/admin/(protected)/leads/queries";
import { LeadCrossMatchCard } from "../../app/(admin)/admin/(protected)/leads/ui/LeadCrossMatchCard";
import { LeadFraudBadge } from "../../app/(admin)/admin/(protected)/leads/ui/LeadFraudBadge";
import { LeadIntelCard } from "../../app/(admin)/admin/(protected)/leads/ui/LeadIntelCard";
import { LeadPuppyRecommenderCard } from "../../app/(admin)/admin/(protected)/leads/ui/LeadPuppyRecommenderCard";

const fetchMock = vi.fn();

function lead(overrides: Partial<LeadListItem> = {}): LeadListItem {
  return {
    id: "l1",
    name: "Ana Souza",
    phone: "(11) 98765-4321",
    whatsapp: "5511987654321",
    city: "Campinas",
    state: "SP",
    color: "Laranja",
    preferredSex: "Fêmea",
    status: "novo",
    createdAt: "2026-11-10T15:00:00Z",
    updatedAt: null,
    firstRespondedAt: null,
    page: "filhotes",
    source: "google",
    gclid: "abc",
    message: "Quero saber mais",
    aiSummary: null,
    matchedPuppy: null,
    priority: { level: "alta", reason: "Chegou há pouco e ainda não teve resposta." },
    ...overrides,
  } as LeadListItem;
}

function props(overrides: Partial<LeadsCRMProps> = {}): LeadsCRMProps {
  return {
    items: [lead(), lead({ id: "l2", name: "Bruno Lima", phone: "123", whatsapp: null, status: "contatado", gclid: null })],
    total: 2,
    page: 1,
    pageSize: 50,
    hasNext: false,
    statusSummary: { novo: 1, contatado: 1, qualificado: 0, convertido: 0, perdido: 0 },
    colorOptions: ["Creme", "Laranja"],
    cityOptions: ["Campinas"],
    configured: true,
    error: null,
    filters: { statuses: [], colors: [] },
    ...overrides,
  };
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(" | ")}`)).toEqual([]);
}

beforeEach(() => {
  push.mockReset();
  refresh.mockReset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("lista de leads", () => {
  it("mostra os cinco status reais com a contagem e o link de filtro", () => {
    render(<LeadsCRM {...props()} />);
    const nav = screen.getByRole("navigation", { name: "Leads por status" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/admin/leads?status=novo",
      "/admin/leads?status=contatado",
      "/admin/leads?status=qualificado",
      "/admin/leads?status=convertido",
      "/admin/leads?status=perdido",
    ]);
    expect(within(nav).queryByText(/em contato|fechado/i)).toBeNull();
  });

  it("marca o status filtrado como página atual", () => {
    render(<LeadsCRM {...props({ filters: { statuses: ["contatado"], colors: [] } })} />);
    const nav = screen.getByRole("navigation", { name: "Leads por status" });
    expect(within(nav).getByRole("link", { current: "page" })).toHaveAttribute("href", "/admin/leads?status=contatado");
  });

  it("lista os leads com link para o detalhe e aviso de quem espera contato", () => {
    render(<LeadsCRM {...props()} />);
    const list = screen.getByRole("list", { name: "Leads" });
    expect(within(list).getByRole("link", { name: "Ana Souza" })).toHaveAttribute("href", "/admin/leads/l1");
    expect(within(list).getAllByText("Aguardando primeiro contato")).toHaveLength(1);
    expect(within(list).getByText("Veio de anúncio do Google")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 a 2 de 2 leads.")).toBeInTheDocument();
  });

  it("só oferece WhatsApp quando o telefone tem formato válido", () => {
    render(<LeadsCRM {...props()} />);
    const link = screen.getByRole("link", { name: /WhatsApp de Ana Souza/ });
    expect(link.getAttribute("href")).toContain("https://wa.me/5511987654321");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByRole("link", { name: /WhatsApp de Bruno Lima/ })).toBeNull();
    expect(screen.getByText("Telefone sem formato de WhatsApp.")).toBeInTheDocument();
  });

  it("grava a troca de status direto quando ela não encerra o atendimento", async () => {
    render(<LeadsCRM {...props()} />);
    fireEvent.change(screen.getByLabelText("Status de Ana Souza"), { target: { value: "contatado" } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/leads/status");
    expect(JSON.parse(init.body)).toEqual({ id: "l1", status: "contatado" });
    await waitFor(() => expect(screen.getByLabelText("Status de Ana Souza")).toHaveValue("contatado"));
    expect(screen.getAllByText("Ana Souza agora está como Contatado.").length).toBeGreaterThan(0);
    expect(refresh).toHaveBeenCalled();
  });

  it("pede confirmação antes de marcar como convertido", async () => {
    render(<LeadsCRM {...props()} />);
    fireEvent.change(screen.getByLabelText("Status de Ana Souza"), { target: { value: "convertido" } });
    expect(fetchMock).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("alertdialog").catch(() => screen.findByRole("dialog"));
    expect(within(dialog).getByText("Marcar Ana Souza como Convertido?")).toBeInTheDocument();
    expect(within(dialog).getByText(/venda estiver fechada de verdade/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Marcar como Convertido" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ id: "l1", status: "convertido" });
  });

  it("quando o banco recusa, o status volta e o motivo aparece", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "O banco recusou a gravação." }) });
    render(<LeadsCRM {...props()} />);
    fireEvent.change(screen.getByLabelText("Status de Ana Souza"), { target: { value: "qualificado" } });
    await waitFor(() =>
      expect(screen.getByText("O status de Ana Souza não mudou. O banco recusou a gravação.")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Status de Ana Souza")).toHaveValue("novo");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("aplica os filtros pelo endereço", () => {
    render(<LeadsCRM {...props()} />);
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "Ana (teste)" } });
    const more = screen.getByRole("button", { name: "Mais filtros" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(more);
    expect(screen.getByRole("button", { name: "Menos filtros" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.change(screen.getByLabelText("Cor desejada"), { target: { value: "Creme" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(push).toHaveBeenCalledWith("/admin/leads?color=Creme&search=Ana+teste");
  });

  it("separa lista vazia de filtro sem resultado", () => {
    const empty = { novo: 0, contatado: 0, qualificado: 0, convertido: 0, perdido: 0 };
    const { unmount } = render(<LeadsCRM {...props({ items: [], total: 0, statusSummary: empty })} />);
    expect(screen.getByRole("heading", { name: "Nenhum lead recebido ainda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar esta página (CSV)" })).toBeDisabled();
    unmount();
    render(<LeadsCRM {...props({ items: [], total: 0, filters: { statuses: ["perdido"], colors: [] } })} />);
    expect(screen.getByRole("heading", { name: "Nenhum lead com esses filtros" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpar" })).toHaveAttribute("href", "/admin/leads");
  });

  it("erro do banco não se disfarça de lista vazia", () => {
    render(<LeadsCRM {...props({ items: [], total: 0, error: { code: "42703" } })} />);
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Não foi possível ler os leads")).toBeInTheDocument();
    expect(within(alert).getByText(/código 42703/)).toBeInTheDocument();
    expect(screen.queryByText(/Nenhum lead recebido|Nenhum lead com esses filtros/)).toBeNull();
    expect(screen.queryByRole("list", { name: "Leads" })).toBeNull();
    fireEvent.click(within(alert).getByRole("button", { name: "Tentar de novo" }));
    expect(refresh).toHaveBeenCalled();
  });

  it("sem credenciais, avisa que a lista vazia não quer dizer zero leads", () => {
    render(<LeadsCRM {...props({ items: [], total: 0, configured: false })} />);
    expect(within(screen.getByRole("alert")).getByText("O painel não está ligado ao banco de dados")).toBeInTheDocument();
  });

  it("pagina mantendo os filtros", () => {
    render(<LeadsCRM {...props({ page: 2, hasNext: true, total: 120, filters: { statuses: ["novo"], colors: [] } })} />);
    const nav = screen.getByRole("navigation", { name: "Páginas" });
    expect(within(nav).getByRole("link", { name: "Página anterior" })).toHaveAttribute("href", "/admin/leads?status=novo");
    expect(within(nav).getByRole("link", { name: "Próxima página" })).toHaveAttribute(
      "href",
      "/admin/leads?status=novo&page=3",
    );
  });

  it("não tem violação de acessibilidade na lista nem no erro", async () => {
    const first = render(<LeadsCRM {...props()} />);
    await expectNoAxeViolations(first.container);
    first.unmount();
    const second = render(<LeadsCRM {...props({ items: [], total: 0, error: { code: "42703" } })} />);
    await expectNoAxeViolations(second.container);
  });
});

describe("cartões de regra do lead", () => {
  it("análise: começa vazia, chama a rota e mostra o resultado", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        insight: {
          intent: "alta",
          urgency: "media",
          risk: "baixo",
          score: 82,
          next_step: "Enviar fotos e vídeo.",
          alerts: ["Sem cidade informada"],
          suggested_puppies: [{ puppy_id: "p1", name: "Thor", reason: "Cor desejada" }],
        },
      }),
    });
    const { container } = render(<LeadIntelCard leadId="l1" />);
    expect(screen.getByText(/ainda não foi analisado/)).toBeInTheDocument();
    expect(screen.getByText(/enviada à OpenAI/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));
    expect(await screen.findByText("82 de 100")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ leadId: "l1", force: true });
    expect(screen.getByText("Enviar fotos e vídeo.")).toBeInTheDocument();
    expect(screen.getByText("Thor")).toBeInTheDocument();
    expect(screen.getAllByText("Não identificado").length).toBeGreaterThan(0);
    // O botao volta do estado "Analisando…" um instante depois do resultado aparecer.
    expect(await screen.findByRole("button", { name: "Analisar de novo" })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("análise: erro da rota aparece como alerta", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "Lead não encontrado." }) });
    render(<LeadIntelCard leadId="l1" />);
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Lead não encontrado.");
  });

  it("cruzamento: mostra o tipo, a nota e o link do filhote", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        suggestion: {
          suggestion_type: "upsell",
          puppyId: "p2",
          puppyName: "Mel",
          reasoning: "Mel bate na cor e no sexo.",
          probability_of_acceptance: 80,
          alternatives: [
            { id: "p2", name: "Mel", score: 80 },
            { id: "p3", name: null, score: 50 },
          ],
        },
      }),
    });
    const { container } = render(<LeadCrossMatchCard leadId="l1" />);
    fireEvent.click(screen.getByRole("button", { name: "Comparar" }));
    expect(await screen.findByText("Combina, com preço acima da mediana")).toBeInTheDocument();
    expect(screen.getByText("Nota 80 de 100")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Mel" })[0]).toHaveAttribute("href", "/admin/puppies/edit/p2");
    expect(screen.getByRole("link", { name: "Filhote sem nome" })).toHaveAttribute("href", "/admin/puppies/edit/p3");
    await expectNoAxeViolations(container);
  });

  it("cruzamento: sem estoque, não mostra nota nem link", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        suggestion: {
          suggestion_type: "fallback",
          puppyId: null,
          reasoning: "Não há filhote disponível ou reservado no estoque.",
          probability_of_acceptance: 0,
          alternatives: [],
        },
      }),
    });
    render(<LeadCrossMatchCard leadId="l1" />);
    fireEvent.click(screen.getByRole("button", { name: "Comparar" }));
    expect(await screen.findByText("Sem combinação forte")).toBeInTheDocument();
    expect(screen.queryByText(/Nota/)).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("sinais suspeitos: deixa claro que é indício, não prova", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        fraud: { score: 70, reason: "Telefone curto.", actions: ["Confirmar o número por ligação"], badge: "high" },
      }),
    });
    const { container } = render(<LeadFraudBadge leadId="l1" />);
    expect(screen.getByText(/não uma prova/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByText("Muitos sinais")).toBeInTheDocument();
    expect(screen.getByText("Nota 70 de 100")).toBeInTheDocument();
    expect(screen.getByText("Confirmar o número por ligação")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("recomendação: lista as opções com o motivo e guarda o resultado na sessão", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        recommendation: {
          puppyIdIdeal: "p3",
          top3Matches: [{ id: "p3", name: "Nina", score: 75, reason: "cor desejada, sexo desejado" }],
          reasoningText: "“Nina” teve a maior nota.",
          score: 75,
          upsellOpportunity: true,
        },
      }),
    });
    const first = render(<LeadPuppyRecommenderCard leadId="l1" />);
    fireEvent.click(screen.getByRole("button", { name: "Recomendar" }));
    expect(await screen.findByRole("link", { name: "Nina" })).toHaveAttribute("href", "/admin/puppies/edit/p3");
    expect(screen.getByText("Pontuou por: cor desejada, sexo desejado.")).toBeInTheDocument();
    expect(screen.getByText("Preço acima do orçamento citado pelo lead")).toBeInTheDocument();
    await expectNoAxeViolations(first.container);
    first.unmount();

    render(<LeadPuppyRecommenderCard leadId="l1" />);
    expect(await screen.findByRole("link", { name: "Nina" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
