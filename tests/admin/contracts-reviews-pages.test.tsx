/// <reference types="@testing-library/jest-dom" />
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import axe from "axe-core";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ContractsPage from "../../app/(admin)/admin/(protected)/contracts/page";
import ReviewsAdminPage from "../../app/(admin)/admin/(protected)/reviews/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/admin/contracts",
  useSearchParams: () => new URLSearchParams(),
}));

const toast = vi.fn();
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ push: toast, remove: vi.fn() }) }));

// A tabela virtualizada depende de medidas de layout que o happy-dom nao tem:
// aqui ela vira uma tabela simples que desenha as mesmas celulas.
vi.mock("@/components/admin/table/VirtualizedDataTable", () => ({
  VirtualizedDataTable: ({ columns, data, "aria-label": label }: {
    columns: Array<{ id: string; header: string; cell: (ctx: { row: { original: unknown } }) => React.ReactNode }>;
    data: Array<{ id: string }>;
    "aria-label"?: string;
  }) => (
    <table aria-label={label}>
      <thead><tr>{columns.map((column) => <th key={column.id} scope="col">{column.header}</th>)}</tr></thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>{columns.map((column) => <td key={column.id}>{column.cell({ row: { original: row } })}</td>)}</tr>
        ))}
      </tbody>
    </table>
  ),
}));

const fetchMock = vi.fn();

function answer(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  toast.mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function violations(container: HTMLElement) {
  const result = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return result.violations.map((violation) => violation.id);
}

const CONTRACTS = [
  { id: "c1", code: "AAA111", status: "pendente", signed_at: null, created_at: "2026-11-01T12:00:00Z", payload: { nome_filhote: "Thor", nome: "Ana" }, hemograma_path: null, laudo_path: null, total_price_cents: 450000, lead_id: null, access_token: "tok1" },
  { id: "c2", code: "BBB222", status: "assinado", signed_at: "2026-11-03T12:00:00Z", created_at: "2026-10-20T12:00:00Z", payload: null, hemograma_path: "h.pdf", laudo_path: null, total_price_cents: null, lead_id: null, access_token: "tok2" },
];
const ALL_ON = { expiry: true, signature: true, zapsign: true };
const ALL_OFF = { expiry: false, signature: false, zapsign: false };

describe("Contratos", () => {
  it("lista os contratos e passa no axe", async () => {
    fetchMock.mockResolvedValue(answer({ ok: true, items: CONTRACTS, features: ALL_ON }));
    const { container } = render(<ContractsPage />);

    const table = await screen.findByRole("table", { name: /contratos/i });
    expect(within(table).getByText("AAA111")).toBeInTheDocument();
    expect(within(table).getByText("Thor")).toBeInTheDocument();
    expect(within(table).getByText("Assinado")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /novo contrato/i })).toBeEnabled();
    expect(screen.getByRole("link", { name: /abrir o documento do contrato AAA111/i })).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });

  it("falha de leitura aparece como erro, nunca como lista vazia", async () => {
    fetchMock.mockResolvedValue(answer({ ok: false, error: "x" }, 500));
    render(<ContractsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível ler os contratos/i);
    expect(screen.queryByText(/nenhum contrato/i)).not.toBeInTheDocument();

    fetchMock.mockResolvedValue(answer({ ok: true, items: CONTRACTS, features: ALL_ON }));
    fireEvent.click(screen.getByRole("button", { name: /tentar de novo/i }));
    expect(await screen.findByText("AAA111")).toBeInTheDocument();
  });

  it("banco sem as colunas: avisa, mantém a lista, desliga criar e ZapSign", async () => {
    fetchMock.mockResolvedValue(answer({ ok: true, items: CONTRACTS, features: ALL_OFF }));
    const { container } = render(<ContractsPage />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/expires_at/);
    expect(alert).toHaveTextContent(/20260828140000_security_and_lgpd_hardening\.sql/);
    expect(alert).toHaveTextContent(/20261111120000_contracts_colunas_de_assinatura\.sql/);
    expect(screen.getByText("AAA111")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /novo contrato/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /zapsign/i })).not.toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });

  it("cria contrato lendo 4.500,00 como quatro mil e quinhentos reais", async () => {
    fetchMock.mockResolvedValue(answer({ ok: true, items: [], features: ALL_ON }));
    const { container } = render(<ContractsPage />);

    fireEvent.click(await screen.findByRole("button", { name: /novo contrato/i }));
    fireEvent.change(screen.getByLabelText(/nome do filhote/i), { target: { value: "Thor" } });
    const price = screen.getByLabelText(/valor total/i);

    fireEvent.change(price, { target: { value: "quatro mil" } });
    fireEvent.click(screen.getByRole("button", { name: /gerar link/i }));
    expect(await screen.findByText(/valor inválido/i)).toBeInTheDocument();
    expect(price).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
    expect(await violations(container)).toEqual([]);

    fireEvent.change(price, { target: { value: "4.500,00" } });
    fetchMock.mockResolvedValue(answer({ ok: true, code: "NOVO1", link: "x" }));
    fireEvent.click(screen.getByRole("button", { name: /gerar link/i }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: "success" })));
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({ nome_filhote: "Thor", total_price_cents: 450000 });
  });

  it("mostra a explicação da API quando o banco recusa a criação", async () => {
    fetchMock.mockResolvedValue(answer({ ok: true, items: [], features: ALL_ON }));
    render(<ContractsPage />);
    fireEvent.click(await screen.findByRole("button", { name: /novo contrato/i }));

    fetchMock.mockResolvedValue(answer({ ok: false, error: "expires_at_missing", message: "O banco ainda não tem a coluna de validade." }, 422));
    fireEvent.click(screen.getByRole("button", { name: /gerar link/i }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith({ type: "error", message: "O banco ainda não tem a coluna de validade." }));
  });
});

const REVIEWS = [
  { id: "11111111-1111-4111-8111-111111111111", puppy_id: "p1", puppy_label: "Thor", author_name: "Ana", rating: 5, comment: "Chegou bem.", approved: false, created_at: "2026-11-01T12:00:00Z" },
  { id: "22222222-2222-4222-8222-222222222222", puppy_id: null, puppy_label: null, author_name: null, rating: null, comment: null, approved: false, created_at: "2026-10-01T12:00:00Z" },
];

describe("Avaliações", () => {
  it("lista as avaliações aguardando, com contagem das abas, e passa no axe", async () => {
    fetchMock.mockResolvedValue(answer({ ok: true, filter: "pending", items: REVIEWS, counts: { pending: 2, approved: 7 } }));
    const { container } = render(<ReviewsAdminPage />);

    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByText(/filhote: thor/i)).toBeInTheDocument();
    expect(screen.getByText(/de 5 estrelas/i).parentElement).toHaveTextContent("5 de 5 estrelas");
    expect(screen.getByRole("heading", { name: "Sem nome" })).toBeInTheDocument();
    expect(screen.getByText("Sem nota")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aguardando/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /aprovadas/i })).toHaveTextContent("(7)");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/reviews?filter=pending");
    expect(await violations(container)).toEqual([]);
  });

  it("falha de leitura aparece como erro, nunca como lista vazia", async () => {
    fetchMock.mockResolvedValue(answer({ ok: false, error: "x" }, 500));
    render(<ReviewsAdminPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível ler as avaliações/i);
    expect(screen.queryByText(/nenhuma avaliação/i)).not.toBeInTheDocument();
  });

  it("aprovar envia approved: true", async () => {
    fetchMock.mockResolvedValue(answer({ ok: true, items: REVIEWS, counts: { pending: 2, approved: 0 } }));
    render(<ReviewsAdminPage />);

    fireEvent.click(await screen.findByRole("button", { name: /aprovar a avaliação de ana/i }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith({ type: "success", message: "Avaliação aprovada." }));
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH");
    expect(patch?.[0]).toBe(`/api/admin/reviews/${REVIEWS[0].id}`);
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ approved: true });
  });

  it("excluir pede confirmação antes de apagar", async () => {
    fetchMock.mockResolvedValue(answer({ ok: true, items: REVIEWS, counts: { pending: 2, approved: 0 } }));
    render(<ReviewsAdminPage />);

    fireEvent.click(await screen.findByRole("button", { name: /excluir a avaliação de ana/i }));
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(false);

    fireEvent.click(await screen.findByRole("button", { name: /sim, excluir/i }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(true));
  });

  it("trocar de aba busca as aprovadas e oferece tirar a aprovação", async () => {
    fetchMock.mockResolvedValue(answer({ ok: true, items: [], counts: { pending: 0, approved: 1 } }));
    render(<ReviewsAdminPage />);
    expect(await screen.findByText(/nenhuma avaliação aguardando/i)).toBeInTheDocument();

    fetchMock.mockResolvedValue(answer({ ok: true, items: [{ ...REVIEWS[0], approved: true }], counts: { pending: 0, approved: 1 } }));
    fireEvent.click(screen.getByRole("button", { name: /aprovadas/i }));

    expect(await screen.findByRole("button", { name: /tirar a aprovação da avaliação de ana/i })).toBeInTheDocument();
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe("/api/admin/reviews?filter=approved");
  });
});
