import { describe, expect, it } from "vitest";

import {
  CONTRACT_BASE_COLUMNS,
  listContracts,
  parseReaisToCents,
  payloadEntries,
  payloadText,
  type ContractsClient,
} from "../../src/lib/admin/contractsAdmin";
import { listReviews, parseReviewFilter, type ReviewsClient } from "../../src/lib/admin/reviewsAdmin";

type Result = { data: unknown[] | null; error: { code?: string; message?: string } | null; count?: number | null };

/** Cliente falso: responde por tabela + colunas pedidas e guarda o que foi pedido. */
function fakeClient(answer: (table: string, columns: string, filters: Record<string, unknown>) => Result) {
  const calls: Array<{ table: string; columns: string; filters: Record<string, unknown> }> = [];
  const client = {
    from(table: string) {
      return {
        select(columns: string) {
          const filters: Record<string, unknown> = {};
          calls.push({ table, columns, filters });
          const query = {
            eq(column: string, value: unknown) { filters[column] = value; return query; },
            in(column: string, values: unknown[]) { filters[column] = values; return query; },
            order() { return query; },
            limit() { return query; },
            then(resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) {
              return Promise.resolve(answer(table, columns, filters)).then(resolve, reject);
            },
          };
          return query;
        },
      };
    },
  };
  return { client, calls };
}

const BASE_ROWS = [
  { id: "c1", code: "AAA", status: "pendente", signed_at: null, created_at: "2026-11-01T12:00:00Z", payload: { nome_filhote: "Thor" }, hemograma_path: null, laudo_path: null, total_price_cents: 450000, lead_id: null },
  { id: "c2", code: "BBB", status: "assinado", signed_at: "2026-11-03T12:00:00Z", created_at: "2026-10-20T12:00:00Z", payload: null, hemograma_path: "h.pdf", laudo_path: null, total_price_cents: null, lead_id: null },
];

describe("listContracts", () => {
  it("lista os contratos mesmo quando o banco não tem as colunas opcionais", async () => {
    const { client, calls } = fakeClient((_table, columns) =>
      columns === CONTRACT_BASE_COLUMNS
        ? { data: BASE_ROWS, error: null }
        : { data: null, error: { code: "42703", message: "column does not exist" } },
    );

    const result = await listContracts(client as unknown as ContractsClient);

    expect(result.items.map((item) => item.code)).toEqual(["AAA", "BBB"]);
    expect(result.features).toEqual({ expiry: false, signature: false, zapsign: false });
    // O nucleo nunca pede coluna opcional: e isso que impedia a lista de abrir.
    expect(calls[0].columns).not.toMatch(/expires_at|signature_path|zapsign/);
  });

  it("junta as colunas opcionais que existem e liga só o recurso correspondente", async () => {
    const { client } = fakeClient((_table, columns) => {
      if (columns === CONTRACT_BASE_COLUMNS) return { data: BASE_ROWS, error: null };
      if (columns === "id,expires_at") return { data: [{ id: "c1", expires_at: "2027-01-30T12:00:00Z" }], error: null };
      return { data: null, error: { code: "42703" } };
    });

    const result = await listContracts(client as unknown as ContractsClient);

    expect(result.features).toEqual({ expiry: true, signature: false, zapsign: false });
    expect(result.items[0].expires_at).toBe("2027-01-30T12:00:00Z");
    expect(result.items[1].expires_at).toBeUndefined();
    expect(result.items[0].zapsign_doc_token).toBeUndefined();
  });

  it("falha de leitura do núcleo é erro, não lista vazia", async () => {
    const { client } = fakeClient(() => ({ data: null, error: { code: "57014", message: "timeout" } }));
    await expect(listContracts(client as unknown as ContractsClient)).rejects.toMatchObject({ code: "57014" });
  });

  it("falha que não é coluna ausente num grupo opcional também é erro", async () => {
    const { client } = fakeClient((_table, columns) =>
      columns === CONTRACT_BASE_COLUMNS ? { data: BASE_ROWS, error: null } : { data: null, error: { code: "57014" } },
    );
    await expect(listContracts(client as unknown as ContractsClient)).rejects.toMatchObject({ code: "57014" });
  });
});

describe("parseReaisToCents", () => {
  it.each([
    ["4500", 450000],
    ["4.500", 450000],
    ["4.500,00", 450000],
    ["4500,5", 450050],
    ["R$ 4.500,00", 450000],
    ["12.345,67", 1234567],
    ["4500.50", 450050],
    ["0", 0],
  ])("%s vira %i centavos", (input, cents) => {
    expect(parseReaisToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "4,5,0", "4.50.0,00", "-10", "1.000.000.000"])("recusa %s", (input) => {
    expect(parseReaisToCents(input)).toBeNull();
  });
});

describe("payload do contrato", () => {
  it("devolve só os campos preenchidos, com rótulo legível", () => {
    expect(payloadEntries({ nome: " Ana ", cpf: "", nome_filhote: "Thor", outro_campo: "x", lista: ["a"] })).toEqual([
      { key: "nome", label: "Nome", value: "Ana" },
      { key: "nome_filhote", label: "Filhote", value: "Thor" },
      { key: "outro_campo", label: "outro campo", value: "x" },
    ]);
    expect(payloadEntries(null)).toEqual([]);
  });

  it("payloadText só devolve texto", () => {
    expect(payloadText({ nome: " Ana " }, "nome")).toBe("Ana");
    expect(payloadText({ nome: 3 }, "nome")).toBe("");
    expect(payloadText(null, "nome")).toBe("");
  });
});

describe("listReviews", () => {
  const REVIEWS = [
    { id: "r1", puppy_id: "p1", author_name: "Ana", rating: 5, comment: "Ótimo", approved: false, created_at: "2026-11-01T12:00:00Z" },
    { id: "r2", puppy_id: null, author_name: null, rating: 4, comment: null, approved: false, created_at: "2026-10-01T12:00:00Z" },
  ];

  it("lê pelas colunas que a produção tem e filtra por approved", async () => {
    const { client, calls } = fakeClient((table, columns, filters) => {
      if (table === "puppies") return { data: [{ id: "p1", codigo: "BY-01", name: "Thor", nome: null }], error: null };
      if (columns === "id") return { data: null, error: null, count: filters.approved ? 7 : 2 };
      return { data: REVIEWS, error: null };
    });

    const result = await listReviews(client as unknown as ReviewsClient, "pending");

    expect(result.counts).toEqual({ pending: 2, approved: 7 });
    expect(result.items[0].puppy_label).toContain("Thor");
    expect(result.items[1].puppy_label).toBeNull();
    const list = calls.find((call) => call.table === "puppy_reviews" && call.columns !== "id");
    expect(list?.filters).toEqual({ approved: false });
    expect(list?.columns).not.toMatch(/puppy_slug|reviewer_name|reviewer_city|photo_url|status/);
  });

  it("falha de leitura é erro, não lista vazia", async () => {
    const { client } = fakeClient(() => ({ data: null, error: { code: "42703" } }));
    await expect(listReviews(client as unknown as ReviewsClient, "approved")).rejects.toMatchObject({ code: "42703" });
  });

  it("sem o nome do filhote as avaliações continuam listadas", async () => {
    const { client } = fakeClient((table, columns) => {
      if (table === "puppies") return { data: null, error: { code: "57014" } };
      if (columns === "id") return { data: null, error: null, count: 2 };
      return { data: REVIEWS, error: null };
    });
    const result = await listReviews(client as unknown as ReviewsClient, "pending");
    expect(result.items).toHaveLength(2);
    expect(result.items[0].puppy_label).toBeNull();
  });

  it("filtro desconhecido cai em aguardando", () => {
    expect(parseReviewFilter("approved")).toBe("approved");
    expect(parseReviewFilter("rejected")).toBe("pending");
    expect(parseReviewFilter(null)).toBe("pending");
  });
});
