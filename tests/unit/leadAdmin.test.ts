import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: vi.fn() }));

import {
  advisorSuggestionToStatus,
  buildLeadsHref,
  csvCell,
  dedupeSorted,
  hasActiveLeadFilters,
  leadGreeting,
  leadSearchOrFilter,
  leadStatusNeedsConfirm,
  leadStatusPatch,
  leadWhatsappLink,
  leadsToCsv,
  normalizeWhatsapp,
  parseLeadFilters,
  parseSuggestedPuppies,
  rowToLeadFields,
  sanitizeLeadSearch,
  saoPauloDayEnd,
  saoPauloDayStart,
} from "../../src/lib/admin/leadAdmin";
import { PUPPY_COLUMNS } from "../../src/lib/admin/puppyAdmin";
import {
  STOCK_PUPPY_SELECT,
  medianPriceCents,
  rowToStockPuppy,
  rowsToStockPuppies,
  sameColor,
  sameSex,
  stockStatusValues,
} from "../../src/lib/admin/puppyStock";
import { crossMatch } from "../../src/lib/ai/crossmatch";
import { parseBudget, rankStockPuppies } from "../../src/lib/puppyRecommender";

describe("telefone e WhatsApp do lead", () => {
  it("põe o 55 em número brasileiro com DDD", () => {
    expect(normalizeWhatsapp("(11) 98765-4321")).toBe("5511987654321");
    expect(normalizeWhatsapp("11 3456-7890")).toBe("551134567890");
  });

  it("mantém número que já veio com 55", () => {
    expect(normalizeWhatsapp("+55 11 98765-4321")).toBe("5511987654321");
  });

  it("recusa o que não parece telefone, em vez de abrir conversa errada", () => {
    expect(normalizeWhatsapp("12345")).toBeNull();
    expect(normalizeWhatsapp("")).toBeNull();
    expect(normalizeWhatsapp(null)).toBeNull();
  });

  it("monta o link só quando há número válido", () => {
    const lead = { name: "Ana Souza", color: "Laranja", preferredSex: "Fêmea", whatsapp: "5511987654321" };
    const link = leadWhatsappLink(lead);
    expect(link).toContain("https://wa.me/5511987654321?text=");
    expect(decodeURIComponent(link ?? "")).toContain("Oi Ana!");
    expect(leadWhatsappLink({ ...lead, whatsapp: null })).toBeNull();
  });

  it("a saudação não promete filhote separado nem reserva", () => {
    const text = leadGreeting({ name: "Ana Souza", color: "Laranja", preferredSex: null });
    expect(text).toContain("(Laranja)");
    expect(text).not.toMatch(/separ|reserv|garant/i);
    expect(leadGreeting({ name: "Sem nome", color: null, preferredSex: null })).toMatch(/^Oi! /);
  });
});

describe("linha do banco para a tela", () => {
  it("usa as colunas que existem e cai no nome padrão", () => {
    const lead = rowToLeadFields({
      id: "l1",
      nome: "  ",
      first_name: null,
      telefone: null,
      phone: "11987654321",
      cidade: "Campinas",
      estado: "SP",
      status: "em_contato",
      utm_source: "google",
      gclid: "abc",
      mensagem: null,
      notes: "Quer fêmea",
      page_slug: "filhotes",
    });
    expect(lead.name).toBe("Sem nome");
    expect(lead.phone).toBe("11987654321");
    expect(lead.whatsapp).toBe("5511987654321");
    expect(lead.status).toBe("contatado");
    expect(lead.source).toBe("google");
    expect(lead.message).toBe("Quer fêmea");
    expect(lead.page).toBe("filhotes");
  });

  it("status desconhecido não vira venda", () => {
    expect(rowToLeadFields({ id: "l2", status: "qualquer coisa" }).status).not.toBe("convertido");
  });

  it("lê sugestões só no formato esperado", () => {
    expect(parseSuggestedPuppies("texto")).toEqual([]);
    expect(parseSuggestedPuppies([{ puppy_id: "p1", name: "Thor", reason: "Cor desejada" }, { name: "sem id" }, null])).toEqual([
      { id: "p1", name: "Thor", reason: "Cor desejada", color: null, sex: null },
    ]);
  });
});

describe("filtros da lista de leads", () => {
  it("converte status antigos do endereço para os cinco reais", () => {
    const { filters, page } = parseLeadFilters({ status: "em_contato,fechado,inventado", page: "3" });
    expect(filters.statuses).toEqual(["contatado", "convertido"]);
    expect(page).toBe(3);
  });

  it("ignora data inválida e desinverte o intervalo", () => {
    const { filters } = parseLeadFilters({ from: "2026-11-10", to: "2026-11-01" });
    expect(filters.dateFrom).toBe("2026-11-01");
    expect(filters.dateTo).toBe("2026-11-10");
    expect(parseLeadFilters({ from: "10/11/2026" }).filters.dateFrom).toBeUndefined();
  });

  it("página inválida volta para a primeira", () => {
    expect(parseLeadFilters({ page: "-2" }).page).toBe(1);
    expect(parseLeadFilters({ page: "abc" }).page).toBe(1);
  });

  it("limpa da busca o que quebraria o filtro do banco", () => {
    expect(sanitizeLeadSearch("Ana, (teste)*%")).toBe("Ana teste");
    expect(sanitizeLeadSearch("   ")).toBeUndefined();
    expect(leadSearchOrFilter("Ana")).toBe("nome.ilike.*Ana*,telefone.ilike.*Ana*,phone.ilike.*Ana*");
  });

  it("monta o endereço sem página 1 nem filtro vazio", () => {
    expect(buildLeadsHref({ statuses: [], colors: [] })).toBe("/admin/leads");
    expect(buildLeadsHref({ statuses: ["novo"], colors: [], search: "Ana" }, 2)).toBe(
      "/admin/leads?status=novo&search=Ana&page=2",
    );
  });

  it("sabe quando há filtro ligado", () => {
    expect(hasActiveLeadFilters({ statuses: [], colors: [] })).toBe(false);
    expect(hasActiveLeadFilters({ statuses: [], colors: [], city: "Campinas" })).toBe(true);
  });

  it("o dia do filtro é o dia de São Paulo", () => {
    expect(new Date(saoPauloDayStart("2026-11-10")).toISOString()).toBe("2026-11-10T03:00:00.000Z");
    expect(new Date(saoPauloDayEnd("2026-11-10")).toISOString()).toBe("2026-11-11T02:59:59.999Z");
  });

  it("junta opções repetidas sem contar caixa", () => {
    expect(dedupeSorted(["Laranja", "laranja", " Creme ", null, ""])).toEqual(["Creme", "Laranja"]);
  });
});

describe("troca de status", () => {
  const now = "2026-11-11T12:00:00.000Z";

  it("registra a primeira resposta uma vez só", () => {
    expect(leadStatusPatch("contatado", { first_responded_at: null }, now)).toEqual({
      status: "contatado",
      updated_at: now,
      first_responded_at: now,
    });
    expect(leadStatusPatch("qualificado", { first_responded_at: "2026-11-01T00:00:00Z" }, now)).toEqual({
      status: "qualificado",
      updated_at: now,
    });
  });

  it("marcar perdido ou voltar para novo não conta como resposta", () => {
    expect(leadStatusPatch("perdido", null, now).first_responded_at).toBeUndefined();
    expect(leadStatusPatch("novo", null, now).first_responded_at).toBeUndefined();
  });

  it("pede confirmação só para o que encerra o atendimento", () => {
    expect(leadStatusNeedsConfirm("convertido")).toBe(true);
    expect(leadStatusNeedsConfirm("perdido")).toBe(true);
    expect(leadStatusNeedsConfirm("contatado")).toBe(false);
  });

  it("traduz a etapa da regra para um status real", () => {
    expect(advisorSuggestionToStatus("em_conversa")).toBe("contatado");
    expect(advisorSuggestionToStatus("quase_fechado")).toBe("qualificado");
    expect(advisorSuggestionToStatus("fechado")).toBe("convertido");
    expect(advisorSuggestionToStatus("outra")).toBeNull();
  });
});

describe("exportação em CSV", () => {
  it("neutraliza célula que a planilha leria como fórmula", () => {
    expect(csvCell("=SOMA(A1)")).toBe(`"'=SOMA(A1)"`);
    expect(csvCell('diz "oi"')).toBe('"diz ""oi"""');
    expect(csvCell(null)).toBe('""');
  });

  it("gera cabeçalho e uma linha por lead", () => {
    const csv = leadsToCsv(
      [
        {
          name: "Ana",
          phone: "11987654321",
          city: "Campinas",
          state: "SP",
          color: "Laranja",
          preferredSex: "Fêmea",
          status: "contatado",
          message: "@promo",
          source: "google",
          gclid: null,
          createdAt: "2026-11-10T12:00:00Z",
        },
      ],
      () => "10/11/2026",
    );
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('"Nome","Telefone"');
    expect(lines[1]).toContain('"Contatado"');
    expect(lines[1]).toContain(`"'@promo"`);
  });
});

describe("estoque para as regras de sugestão", () => {
  it("só pede colunas que existem em puppies", () => {
    const known = new Set<string>(PUPPY_COLUMNS);
    for (const column of STOCK_PUPPY_SELECT.split(",")) expect(known.has(column), column).toBe(true);
  });

  it("filtra o status com os valores do enum do banco", () => {
    expect(stockStatusValues(["available", "reserved"])).toEqual(["disponivel", "reservado"]);
  });

  it("traduz a linha com os nomes de coluna em uso", () => {
    expect(
      rowToStockPuppy({ id: "p1", nome: "Thor", name: null, cor: "Laranja", sexo: "macho", preco: 4500, cidade: "Atibaia", status: "disponivel" }),
    ).toEqual({
      id: "p1",
      name: "Thor",
      color: "Laranja",
      sex: "male",
      priceCents: 450000,
      city: "Atibaia",
      state: null,
      status: "available",
    });
    expect(rowToStockPuppy({ nome: "sem id" })).toBeNull();
    expect(rowsToStockPuppies(null)).toEqual([]);
  });

  it("status desconhecido nunca conta como disponível", () => {
    expect(rowToStockPuppy({ id: "p2", status: "xyz" })?.status).toBe("unavailable");
  });

  it("compara cor e sexo sem acento nem idioma", () => {
    expect(sameColor("laranja", "Laranja claro")).toBe(true);
    expect(sameColor("", "Laranja")).toBe(false);
    expect(sameSex("Fêmea", "female")).toBe(true);
    expect(sameSex("macho", "female")).toBe(false);
    expect(sameSex(null, null)).toBe(false);
  });

  it("calcula a mediana só dos preços preenchidos", () => {
    expect(medianPriceCents([{ priceCents: 100 }, { priceCents: null }, { priceCents: 300 }, { priceCents: 200 }])).toBe(200);
    expect(medianPriceCents([{ priceCents: 100 }, { priceCents: 300 }])).toBe(200);
    expect(medianPriceCents([])).toBe(0);
  });
});

describe("regras de recomendação e cruzamento", () => {
  const thor = rowToStockPuppy({ id: "p1", nome: "Thor", color: "Laranja", sexo: "macho", price_cents: 450000, status: "disponivel" })!;
  const mel = rowToStockPuppy({ id: "p2", nome: "Mel", color: "Creme", sexo: "femea", price_cents: 900000, status: "reservado" })!;
  const nina = rowToStockPuppy({ id: "p3", nome: "Nina", color: "Creme", sexo: "femea", price_cents: 460000, status: "disponivel" })!;

  it("lê o orçamento citado", () => {
    expect(parseBudget("5 mil")).toBe(5000);
    expect(parseBudget("R$ 4500")).toBe(4500);
    expect(parseBudget("barato")).toBeNull();
    expect(parseBudget(null)).toBeNull();
  });

  it("recomenda quem soma mais pontos e explica o motivo", () => {
    const rec = rankStockPuppies([thor, nina], { color: "creme", sex: "fêmea", budget: 4500 });
    expect(rec.puppyIdIdeal).toBe("p3");
    expect(rec.top3Matches[0].reason).toContain("cor desejada");
    expect(rec.top3Matches[0].reason).toContain("preço perto do orçamento");
    expect(rec.upsellOpportunity).toBe(false);
  });

  it("sem estoque, diz que não há o que comparar", () => {
    const rec = rankStockPuppies([], { color: "creme" });
    expect(rec.puppyIdIdeal).toBeNull();
    expect(rec.top3Matches).toEqual([]);
    expect(rec.score).toBe(0);
  });

  it("cruzamento marca combinação quando cor ou sexo batem", () => {
    const result = crossMatch({ color: "Laranja", sex: "macho" }, [thor, mel, nina]);
    expect(result.suggestion_type).toBe("match");
    expect(result.puppyId).toBe("p1");
    expect(result.probability_of_acceptance).toBe(100);
  });

  it("estar disponível sozinho não é combinação", () => {
    const result = crossMatch({ color: "preto", sex: null }, [thor, nina]);
    expect(result.suggestion_type).toBe("fallback");
    expect(result.reasoning).toMatch(/Nenhum filhote do estoque bate/);
  });

  it("avisa quando a opção que combina custa bem acima da mediana", () => {
    const result = crossMatch({ color: "creme", sex: "femea" }, [thor, mel, { ...nina, color: "Branco", sex: "male" }]);
    expect(result.puppyId).toBe("p2");
    expect(result.suggestion_type).toBe("upsell");
  });

  it("sem estoque, não inventa sugestão", () => {
    const result = crossMatch({ color: "creme" }, []);
    expect(result.puppyId).toBeNull();
    expect(result.alternatives).toEqual([]);
  });
});
