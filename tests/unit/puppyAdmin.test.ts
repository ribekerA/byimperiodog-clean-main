import { describe, expect, it } from "vitest";

import {
  ADMIN_PUPPY_STATUSES,
  PUPPY_COLUMNS,
  PUPPY_LIST_SELECT,
  buildPuppyWritePayload,
  buildStatusSummary,
  colorOptions,
  filterPuppies,
  fromDbPuppyStatus,
  hasActiveFilters,
  parseAdminPuppyStatus,
  parseMidia,
  parsePuppyFilters,
  parsePuppySex,
  rowPriceCents,
  rowToListItem,
  sortPuppies,
  statusPatch,
  toDbPuppyStatus,
  unknownPuppyColumns,
  type AdminPuppyListItem,
  type PuppyRow,
} from "@/lib/admin/puppyAdmin";

const NOW = "2026-11-10T15:00:00.000Z";

function item(overrides: Partial<AdminPuppyListItem> = {}): AdminPuppyListItem {
  return {
    id: "1",
    name: "Thor",
    code: null,
    status: "available",
    rawStatus: "disponivel",
    color: "Laranja",
    sex: "male",
    city: "Bragança Paulista",
    state: "SP",
    priceCents: 450000,
    createdAt: "2026-11-01T12:00:00.000Z",
    soldAt: null,
    reservedAt: null,
    birthDate: null,
    imageUrl: null,
    photoCount: 0,
    videoCount: 0,
    demandScore: null,
    demandFlag: null,
    demandReason: null,
    ...overrides,
  };
}

describe("status do filhote", () => {
  it("aceita os quatro status do banco, em portugues ou em ingles", () => {
    expect(toDbPuppyStatus("available")).toBe("disponivel");
    expect(toDbPuppyStatus("Disponível")).toBe("disponivel");
    expect(toDbPuppyStatus("reserved")).toBe("reservado");
    expect(toDbPuppyStatus("sold")).toBe("vendido");
    expect(toDbPuppyStatus("VENDIDO")).toBe("vendido");
    expect(toDbPuppyStatus("unavailable")).toBe("indisponivel");
    expect(toDbPuppyStatus("arquivado")).toBe("indisponivel");
  });

  it("recusa status que o banco nao tem, em vez de gravar disponivel", () => {
    for (const value of ["coming_soon", "em_breve", "pending", "pendente", "", "qualquer", null, undefined, 3]) {
      expect(toDbPuppyStatus(value)).toBeNull();
      expect(parseAdminPuppyStatus(value)).toBeNull();
    }
  });

  it("status desconhecido lido do banco nunca vira disponivel", () => {
    expect(fromDbPuppyStatus("disponivel")).toBe("available");
    expect(fromDbPuppyStatus("em_breve")).toBe("unavailable");
    expect(fromDbPuppyStatus(null)).toBe("unavailable");
  });
});

describe("linha do banco para item da lista", () => {
  it("le nome, cor, sexo, cidade e preco das colunas que existem", () => {
    const row: PuppyRow = {
      id: "abc",
      codigo: "F-012",
      nome: "  Mel ",
      status: "reservado",
      cor: "Creme",
      sexo: "femea",
      cidade: "Bragança Paulista",
      estado: "SP",
      preco: "4500.00",
      created_at: "2026-10-01T10:00:00Z",
      reserved_at: "2026-10-05T10:00:00Z",
      midia: [
        { url: "https://exemplo.test/v.mp4", type: "video" },
        { url: "https://exemplo.test/a.jpg", type: "image" },
        "https://exemplo.test/b.webp",
      ],
      catalog_ranking: [{ score: 82, flag: "hot", reason: "muita procura" }],
    };
    const result = rowToListItem(row);
    expect(result).toMatchObject({
      id: "abc",
      name: "Mel",
      code: "F-012",
      status: "reserved",
      color: "Creme",
      sex: "female",
      city: "Bragança Paulista",
      state: "SP",
      priceCents: 450000,
      reservedAt: "2026-10-05T10:00:00Z",
      imageUrl: "https://exemplo.test/a.jpg",
      photoCount: 2,
      videoCount: 1,
      demandScore: 82,
      demandFlag: "hot",
    });
  });

  it("nao usa video como capa e resolve caminho de arquivo", () => {
    const result = rowToListItem(
      { id: "1", midia: ["puppies/v.mov", "puppies/foto.jpg"] },
      (url) => `https://cdn.test/${url}`,
    );
    expect(result.imageUrl).toBe("https://cdn.test/puppies/foto.jpg");
    expect(rowToListItem({ id: "2", midia: ["so-video.mp4"] }).imageUrl).toBeNull();
  });

  it("sem nome cai no codigo e depois em um texto fixo", () => {
    expect(rowToListItem({ id: "1", codigo: "F-1" }).name).toBe("F-1");
    expect(rowToListItem({ id: "1" }).name).toBe("Filhote sem nome");
  });

  it("preco: centavos primeiro, depois reais; vazio da zero", () => {
    expect(rowPriceCents({ price_cents: 450000, preco: 1 })).toBe(450000);
    expect(rowPriceCents({ price_cents: null, preco: 4500 })).toBe(450000);
    expect(rowPriceCents({ price_cents: 0, preco: null })).toBe(0);
    expect(rowPriceCents({})).toBe(0);
  });

  it("midia em texto JSON, texto solto ou vazia", () => {
    expect(parseMidia('[{"url":"a.jpg"}]')).toEqual([{ url: "a.jpg", type: "image" }]);
    expect(parseMidia("a.mp4?x=1")).toEqual([{ url: "a.mp4?x=1", type: "video" }]);
    expect(parseMidia(null)).toEqual([]);
    expect(parseMidia([{ url: "" }, null, 3])).toEqual([]);
  });

  it("sexo: macho/femea, male/female; o resto e nulo", () => {
    expect(parsePuppySex("macho")).toBe("male");
    expect(parsePuppySex("Fêmea")).toBe("female");
    expect(parsePuppySex("female")).toBe("female");
    expect(parsePuppySex("x")).toBeNull();
    expect(parsePuppySex(null)).toBeNull();
  });

  it("a consulta da lista so pede colunas que existem", () => {
    const columns = PUPPY_LIST_SELECT.replace(/,catalog_ranking\(.*\)$/, "").split(",");
    expect(unknownPuppyColumns(Object.fromEntries(columns.map((c) => [c, 1])))).toEqual([]);
  });
});

describe("filtros da URL", () => {
  it("le status, cor, sexo, preco, busca e ordem", () => {
    const { filters, sort } = parsePuppyFilters({
      status: "available,sold",
      color: "Laranja,Creme",
      sex: "female",
      priceMin: "4.500",
      priceMax: "6500,50",
      search: " thor ",
      sort: "price-asc",
    });
    expect(filters).toEqual({
      statuses: ["available", "sold"],
      colors: ["Laranja", "Creme"],
      sex: "female",
      minPrice: 4500,
      maxPrice: 6500.5,
      search: "thor",
    });
    expect(sort).toBe("price-asc");
  });

  it("ignora status que nao existe e ordem invalida", () => {
    const { filters, sort } = parsePuppyFilters({ status: "coming_soon,reserved,reserved", sort: "xyz" });
    expect(filters.statuses).toEqual(["reserved"]);
    expect(sort).toBe("recent");
    expect(hasActiveFilters(filters)).toBe(true);
    expect(hasActiveFilters(parsePuppyFilters({}).filters)).toBe(false);
  });

  it("os links do dashboard caem em um status valido", () => {
    for (const status of ADMIN_PUPPY_STATUSES) {
      expect(parsePuppyFilters({ status }).filters.statuses).toEqual([status]);
    }
  });
});

describe("filtrar, ordenar e resumir", () => {
  const items = [
    item({ id: "a", name: "Thor", color: "Laranja", sex: "male", priceCents: 450000, createdAt: "2026-11-01T00:00:00Z" }),
    item({ id: "b", name: "Mel", color: "creme", sex: "female", priceCents: 650000, status: "reserved", createdAt: "2026-11-03T00:00:00Z" }),
    item({ id: "c", name: "Luna", color: "Creme", sex: "female", priceCents: 0, status: "sold", createdAt: "2026-11-02T00:00:00Z", demandScore: 90 }),
    item({ id: "d", name: "Bóris", code: "F-77", color: null, sex: null, priceCents: 500000, status: "unavailable", createdAt: "2026-10-01T00:00:00Z", demandScore: 40 }),
  ];
  const none = parsePuppyFilters({}).filters;

  it("filtra por status, cor (sem ligar para maiuscula) e sexo", () => {
    expect(filterPuppies(items, { ...none, statuses: ["reserved", "sold"] }).map((i) => i.id)).toEqual(["b", "c"]);
    expect(filterPuppies(items, { ...none, colors: ["CREME"] }).map((i) => i.id)).toEqual(["b", "c"]);
    expect(filterPuppies(items, { ...none, sex: "male" }).map((i) => i.id)).toEqual(["a"]);
  });

  it("faixa de preco deixa de fora quem nao tem preco", () => {
    expect(filterPuppies(items, { ...none, minPrice: 5000 }).map((i) => i.id)).toEqual(["b", "d"]);
    expect(filterPuppies(items, { ...none, maxPrice: 5000 }).map((i) => i.id)).toEqual(["a", "d"]);
  });

  it("busca por nome ou codigo sem ligar para acento", () => {
    expect(filterPuppies(items, { ...none, search: "boris" }).map((i) => i.id)).toEqual(["d"]);
    expect(filterPuppies(items, { ...none, search: "f-77" }).map((i) => i.id)).toEqual(["d"]);
    expect(filterPuppies(items, { ...none, search: "braganca" })).toHaveLength(4);
  });

  it("ordena por data, preco (sem preco no fim) e procura", () => {
    expect(sortPuppies(items, "recent").map((i) => i.id)).toEqual(["b", "c", "a", "d"]);
    expect(sortPuppies(items, "price-asc").map((i) => i.id)).toEqual(["a", "d", "b", "c"]);
    expect(sortPuppies(items, "price-desc").map((i) => i.id)).toEqual(["b", "d", "a", "c"]);
    expect(sortPuppies(items, "demand").map((i) => i.id)).toEqual(["c", "d", "b", "a"]);
    expect(items.map((i) => i.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("resumo conta os quatro status e as cores saem sem repeticao", () => {
    expect(buildStatusSummary(items)).toEqual({ available: 1, reserved: 1, sold: 1, unavailable: 1 });
    expect(colorOptions(items)).toEqual(["creme", "Laranja"]);
  });
});

describe("mudanca de status", () => {
  it("vendido carimba a data e preserva a que ja existia", () => {
    expect(statusPatch(null, "sold", NOW)).toEqual({ status: "vendido", sold_at: NOW });
    expect(statusPatch({ sold_at: "2026-10-01T00:00:00Z" }, "sold", NOW)).toEqual({
      status: "vendido",
      sold_at: "2026-10-01T00:00:00Z",
    });
  });

  it("reservado carimba a reserva e limpa a venda", () => {
    expect(statusPatch({ sold_at: "2026-10-01T00:00:00Z" }, "reserved", NOW)).toEqual({
      status: "reservado",
      reserved_at: NOW,
      sold_at: null,
    });
  });

  it("disponivel limpa as duas datas; indisponivel nao mexe nelas", () => {
    expect(statusPatch({ sold_at: "x", reserved_at: "y" }, "available", NOW)).toEqual({
      status: "disponivel",
      sold_at: null,
      reserved_at: null,
    });
    expect(statusPatch({ sold_at: "x" }, "unavailable", NOW)).toEqual({ status: "indisponivel" });
  });
});

describe("gravacao do filhote", () => {
  const full = {
    name: " Thor ",
    code: "F-1",
    color: "Laranja",
    sex: "male",
    city: "Bragança Paulista",
    state: "SP",
    priceCents: 450000,
    status: "sold" as const,
    description: "Texto",
    notes: "",
    birthDate: "2026-08-15T00:00:00Z",
    media: [
      { url: " https://exemplo.test/a.jpg ", type: "image" as const },
      { url: "", type: "image" as const },
      { url: "https://exemplo.test/v.mp4", type: "video" as const },
    ],
  };

  it("so grava colunas que existem no banco", () => {
    const insert = buildPuppyWritePayload(full, { nowIso: NOW, isInsert: true });
    expect(unknownPuppyColumns(insert)).toEqual([]);
    for (const banned of ["slug", "city", "state", "description", "image_url", "video_url", "images", "media", "sex"]) {
      expect(insert).not.toHaveProperty(banned);
    }
    expect((PUPPY_COLUMNS as readonly string[]).includes("slug")).toBe(false);
  });

  it("preenche as colunas em dobro e as datas", () => {
    expect(buildPuppyWritePayload(full, { nowIso: NOW, isInsert: true })).toEqual({
      nome: "Thor",
      name: "Thor",
      codigo: "F-1",
      cor: "Laranja",
      color: "Laranja",
      sexo: "macho",
      gender: "male",
      cidade: "Bragança Paulista",
      estado: "SP",
      price_cents: 450000,
      preco: 4500,
      status: "vendido",
      sold_at: NOW,
      descricao: "Texto",
      notes: null,
      nascimento: "2026-08-15",
      midia: [
        { url: "https://exemplo.test/a.jpg", type: "image" },
        { url: "https://exemplo.test/v.mp4", type: "video" },
      ],
      updated_at: NOW,
      created_at: NOW,
    });
  });

  it("na edicao, campo que nao veio nao e tocado", () => {
    const update = buildPuppyWritePayload({ priceCents: 500000 }, { nowIso: NOW, isInsert: false });
    expect(update).toEqual({ price_cents: 500000, preco: 5000, updated_at: NOW });
  });

  it("preco vazio vira nulo e sexo desconhecido nao e gravado", () => {
    const update = buildPuppyWritePayload({ priceCents: null, sex: "?" }, { nowIso: NOW, isInsert: false });
    expect(update).toEqual({ price_cents: null, preco: null, updated_at: NOW });
  });

  it("editar um vendido preserva a data da venda", () => {
    const update = buildPuppyWritePayload(
      { status: "sold" },
      { nowIso: NOW, isInsert: false, current: { sold_at: "2026-10-01T00:00:00Z" } },
    );
    expect(update.sold_at).toBe("2026-10-01T00:00:00Z");
  });
});
