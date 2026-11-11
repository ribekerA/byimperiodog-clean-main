/// <reference types="@testing-library/jest-dom" />
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import axe from "axe-core";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PuppiesPageClient,
  buildPuppiesHref,
  type PuppiesPageClientProps,
} from "../../app/(admin)/admin/(protected)/puppies/PuppiesPageClient";
import { formatPuppyDate, puppyDateLine } from "../../app/(admin)/admin/(protected)/puppies/PuppiesTable";
import { buildStatusSummary, type AdminPuppyListItem } from "../../src/lib/admin/puppyAdmin";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh }),
  usePathname: () => "/admin/puppies",
  useSearchParams: () => new URLSearchParams(),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function puppy(overrides: Partial<AdminPuppyListItem>): AdminPuppyListItem {
  return {
    id: "p1",
    name: "Thor",
    code: null,
    status: "available",
    rawStatus: "disponivel",
    color: "Laranja",
    sex: "male",
    city: "Bragança Paulista",
    state: "SP",
    priceCents: 450000,
    createdAt: "2026-10-01T15:00:00Z",
    soldAt: null,
    reservedAt: null,
    birthDate: null,
    imageUrl: "https://exemplo.supabase.co/storage/v1/object/public/puppies/a.jpg",
    photoCount: 3,
    videoCount: 1,
    demandScore: null,
    demandFlag: null,
    demandReason: null,
    ...overrides,
  };
}

const ITEMS: AdminPuppyListItem[] = [
  puppy({}),
  puppy({ id: "p2", name: "Mel", code: "BY-02", sex: "female", color: "Creme", status: "reserved", reservedAt: "2026-11-02T15:00:00Z" }),
  puppy({ id: "p3", name: "Nina", sex: "female", priceCents: 0, imageUrl: null, photoCount: 0, videoCount: 0 }),
];

function props(overrides: Partial<PuppiesPageClientProps> = {}): PuppiesPageClientProps {
  return {
    items: ITEMS,
    filters: { statuses: [], colors: [] },
    sort: "recent",
    total: ITEMS.length,
    truncated: false,
    statusSummary: buildStatusSummary(ITEMS),
    colorOptions: ["Creme", "Laranja"],
    hasDemand: false,
    configured: true,
    error: null,
    ...overrides,
  };
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

describe("formatação da lista de filhotes", () => {
  it("não desloca o dia de uma data sem hora", () => {
    expect(formatPuppyDate("2026-03-14")).toBe("14/03/2026");
  });

  it("usa o dia de São Paulo para data com hora", () => {
    expect(formatPuppyDate("2026-11-03T01:30:00Z")).toBe("02/11/2026");
  });

  it("mostra a data que combina com o status", () => {
    expect(puppyDateLine(ITEMS[1])).toBe("Reservado em 02/11/2026");
    expect(puppyDateLine(ITEMS[0])).toBe("Cadastrado em 01/10/2026");
  });

  it("monta o endereço só com o que foi preenchido", () => {
    expect(
      buildPuppiesHref({ statuses: [], colors: [], sex: "", priceMin: "", priceMax: "", search: " ", sort: "recent" }),
    ).toBe("/admin/puppies");
    expect(
      buildPuppiesHref({
        statuses: ["available", "reserved"],
        colors: ["Creme"],
        sex: "female",
        priceMin: "4500",
        priceMax: "",
        search: "mel",
        sort: "price-asc",
      }),
    ).toBe("/admin/puppies?status=available%2Creserved&color=Creme&sex=female&priceMin=4500&search=mel&sort=price-asc");
  });
});

describe("tela de Filhotes", () => {
  it("mostra o resumo real por status com link de filtro", () => {
    render(<PuppiesPageClient {...props()} />);
    const nav = screen.getByRole("navigation", { name: "Estoque por status" });
    const available = within(nav).getByRole("link", { name: /Disponível/ });
    expect(available).toHaveAttribute("href", "/admin/puppies?status=available");
    expect(available).toHaveTextContent("2");
    expect(within(nav).getByRole("link", { name: /Vendido/ })).toHaveTextContent("0");
    expect(within(nav).getAllByRole("link")).toHaveLength(4);
  });

  it("lista os filhotes com preço, sinais de cadastro e link de edição", () => {
    render(<PuppiesPageClient {...props()} />);
    const list = screen.getByRole("list", { name: "Filhotes do estoque" });
    expect(within(list).getByRole("link", { name: "Thor" })).toHaveAttribute("href", "/admin/puppies/edit/p1");
    expect(within(list).getAllByText(/4\.500,00/)).toHaveLength(2);
    expect(within(list).getByText("Sem foto")).toBeInTheDocument();
    expect(within(list).getAllByText("Sem preço").length).toBeGreaterThan(0);
    expect(within(list).getByText("Cód. BY-02")).toBeInTheDocument();
    expect(screen.getByText("3 filhotes no estoque.")).toBeInTheDocument();
  });

  it("troca para Reservado sem confirmação e chama a rota de status", async () => {
    render(<PuppiesPageClient {...props()} />);
    fireEvent.change(screen.getByLabelText("Status de Thor"), { target: { value: "reserved" } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/puppies/status");
    expect(JSON.parse(init.body)).toEqual({ id: "p1", status: "reserved" });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByLabelText("Status de Thor")).toHaveValue("reserved");
  });

  it("pede confirmação antes de marcar como Vendido e diz que o site não muda", async () => {
    render(<PuppiesPageClient {...props()} />);
    fireEvent.change(screen.getByLabelText("Status de Thor"), { target: { value: "sold" } });
    expect(fetchMock).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Marcar Thor como Vendido?")).toBeInTheDocument();
    expect(within(dialog).getByText(/as páginas do site não são alteradas por aqui/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Marcar como Vendido" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ id: "p1", status: "sold" });
  });

  it("não finge que mudou quando a rota recusa", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "falhou" }) });
    render(<PuppiesPageClient {...props()} />);
    fireEvent.change(screen.getByLabelText("Status de Thor"), { target: { value: "reserved" } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByLabelText("Status de Thor")).not.toBeDisabled());
    expect(screen.getByLabelText("Status de Thor")).toHaveValue("available");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("muda vários de uma vez, pulando quem já está no status", async () => {
    render(<PuppiesPageClient {...props()} />);
    fireEvent.click(screen.getByLabelText("Selecionar todos"));
    expect(screen.getByText("3 selecionados")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Novo status para os selecionados"), { target: { value: "reserved" } });
    fireEvent.click(screen.getByRole("button", { name: "Mudar status" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls.map((call) => JSON.parse(call[1].body).id)).toEqual(["p1", "p3"]);
  });

  it("aplica os filtros pelo endereço", () => {
    render(<PuppiesPageClient {...props()} />);
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "mel" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Creme" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(push).toHaveBeenCalledWith("/admin/puppies?color=Creme&search=mel");
  });

  it("esconde a ordem por procura quando não há nota de procura", () => {
    render(<PuppiesPageClient {...props()} />);
    expect(within(screen.getByLabelText("Ordenar por")).queryByRole("option", { name: "Mais procurados" })).toBeNull();
    cleanup();
    render(<PuppiesPageClient {...props({ hasDemand: true })} />);
    expect(within(screen.getByLabelText("Ordenar por")).getByRole("option", { name: "Mais procurados" })).toBeInTheDocument();
  });

  it("mostra o kanban com as quatro colunas reais", () => {
    render(<PuppiesPageClient {...props()} />);
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }));
    for (const label of ["Disponível", "Reservado", "Vendido", "Indisponível"]) {
      expect(screen.getByRole("region", { name: new RegExp(`^${label}`) })).toBeInTheDocument();
    }
    expect(screen.queryByText("Em breve")).toBeNull();
    expect(window.localStorage.getItem("byimperiodog:admin:puppies:view")).toBe("board");
  });

  it("diz a verdade quando o banco não está ligado ou falha", () => {
    render(<PuppiesPageClient {...props({ items: [], total: 0, configured: false })} />);
    expect(screen.getByRole("alert")).toHaveTextContent("O painel não está ligado ao banco de dados");
    cleanup();
    render(<PuppiesPageClient {...props({ items: [], total: 0, error: { code: "42703" } })} />);
    expect(screen.getByRole("alert")).toHaveTextContent("código 42703");
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(refresh).toHaveBeenCalled();
  });

  it("separa estoque vazio de filtro sem resultado", () => {
    render(<PuppiesPageClient {...props({ items: [], total: 0, statusSummary: buildStatusSummary([]) })} />);
    expect(screen.getByText("Nenhum filhote cadastrado")).toBeInTheDocument();
    cleanup();
    render(<PuppiesPageClient {...props({ items: [], filters: { statuses: ["sold"], colors: [] } })} />);
    expect(screen.getByText("Nenhum filhote com esses filtros")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 0 de 3 filhotes do estoque.")).toBeInTheDocument();
  });

  it("não tem violação de acessibilidade na lista nem no kanban", async () => {
    const { container } = render(<PuppiesPageClient {...props({ hasDemand: true })} />);
    await expectNoAxeViolations(container);
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }));
    await expectNoAxeViolations(container);
  });
});
