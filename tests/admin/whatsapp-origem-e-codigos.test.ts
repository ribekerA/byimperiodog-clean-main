import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildAdsConversoes, buildWhatsAppClicks, origemDoClique } from "../../src/lib/admin/dashboardMetrics";
import { codigoDigitado } from "../../src/lib/whatsapp-ref";
import { makeNextRequestStub } from "../helpers/nextRequestStub";

// Meio-dia de 10/11/2026 em Sao Paulo (UTC-3).
const AGORA = new Date("2026-11-10T15:00:00Z");

describe("origem do clique no WhatsApp", () => {
  it.each([
    ["google", "cpc", "google_ads"],
    ["Google", "PAID", "google_ads"],
    ["google", "organic", "google_organico"],
    ["instagram.com", "referral", "instagram"],
    ["l.instagram.com", "referral", "instagram"],
    ["ig", "social", "instagram"],
    ["(direct)", "(none)", "direto"],
    ["bing", "organic", "outros"],
    ["notinstagram.com", "referral", "outros"],
    ["(not set)", "(not set)", "nao_identificado"],
    ["", "", "nao_identificado"],
  ])("%s / %s vira %s", (source, medium, esperado) => {
    expect(origemDoClique(source, medium)).toBe(esperado);
  });

  it("soma 7 e 14 dias por origem e ignora o que esta fora da janela", () => {
    const dados = buildWhatsAppClicks({ "2026-11-10": 4, "2026-11-01": 2 }, AGORA, [
      { day: "2026-11-10", source: "google", medium: "cpc", count: 3 },
      { day: "2026-11-10", source: "instagram.com", medium: "referral", count: 1 },
      { day: "2026-11-01", source: "google", medium: "cpc", count: 2 },
      { day: "2026-10-20", source: "google", medium: "cpc", count: 50 },
    ]);
    const ads = dados.porOrigem.find((linha) => linha.origem === "google_ads");
    expect(ads).toMatchObject({ rotulo: "Anúncio do Google", last7: 3, last14: 5 });
    expect(dados.porOrigem.find((linha) => linha.origem === "instagram")).toMatchObject({ last7: 1, last14: 1 });
    expect(dados.porOrigem.map((linha) => linha.origem)).toEqual([
      "google_ads",
      "google_organico",
      "instagram",
      "direto",
      "outros",
      "nao_identificado",
    ]);
  });
});

describe("codigo colado no painel", () => {
  it.each([
    ["K7M2Q", "K7M2Q"],
    ["  k7m2q ", "K7M2Q"],
    ["Olá, quero saber do filhote (cód. K7M2Q)", "K7M2Q"],
    ["cod K7M2Q", "K7M2Q"],
  ])("%s vira %s", (texto, esperado) => {
    expect(codigoDigitado(texto)).toBe(esperado);
  });

  // Sem "cód." na frente, palavra de 5 letras no meio da conversa nao vira codigo.
  it.each(["Oi gente tudo bem", "K7M2", "K7M2Q9", "(cód. K0M2Q)", ""])("%s nao e codigo", (texto) => {
    expect(codigoDigitado(texto)).toBeNull();
  });
});

describe("conversoes do Ads por dia", () => {
  it("arredonda a conversao fracionada e soma as semanas", () => {
    const carga = buildAdsConversoes("Lead | WhatsApp | Site", { "2026-11-10": 1, "2026-11-08": 1.6, "2026-11-01": 2, "2026-10-01": 9 }, AGORA);
    expect(carga.status).toBe("ok");
    if (carga.status !== "ok") return;
    expect(carga.days).toHaveLength(14);
    expect(carga.last7).toBe(3);
    expect(carga.prev7).toBe(2);
    expect(carga.today).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* Rota /api/admin/whatsapp/codigos                                     */
/* ------------------------------------------------------------------ */

const guarda = vi.fn<(req: unknown, opts: { permission: string }) => Response | undefined>(() => undefined);
const buscarCodigo = vi.fn();
const marcarVenda = vi.fn();
const logAdminAction = vi.fn(async () => undefined);

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin: (req: unknown, opts: { permission: string }) => guarda(req, opts),
  logAdminAction: (...args: unknown[]) => logAdminAction(...(args as [])),
}));
vi.mock("@/lib/supabaseAdmin", () => ({ hasServiceRoleKey: () => true, supabaseAdmin: () => ({}) }));
vi.mock("@/lib/admin/whatsappRefs", () => ({
  buscarCodigo: (...args: unknown[]) => buscarCodigo(...args),
  marcarVenda: (...args: unknown[]) => marcarVenda(...args),
}));

const CODIGO = {
  ref: "K7M2Q",
  criadoEm: "2026-11-10T13:00:00Z",
  pagina: "/filhotes",
  filhote: null,
  clique: "gclid",
  vendaEm: null,
};

describe("rota dos codigos", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
    guarda.mockReset().mockReturnValue(undefined);
    buscarCodigo.mockReset();
    marcarVenda.mockReset();
    logAdminAction.mockClear();
  });

  it("busca pelo trecho colado da conversa", async () => {
    buscarCodigo.mockResolvedValue({ codigo: CODIGO, vendaDisponivel: true });
    const { GET } = await import("../../app/api/admin/whatsapp/codigos/route");
    const res = await GET(makeNextRequestStub(`https://x/api/admin/whatsapp/codigos?ref=${encodeURIComponent("(cód. k7m2q)")}`));
    expect(res.status).toBe(200);
    expect(buscarCodigo).toHaveBeenCalledWith("K7M2Q");
    expect(guarda.mock.calls[0][1]).toEqual({ permission: "dashboard:read" });
  });

  it("recusa texto que nao e codigo e diz quando nao achou", async () => {
    const { GET } = await import("../../app/api/admin/whatsapp/codigos/route");
    expect((await GET(makeNextRequestStub("https://x/api/admin/whatsapp/codigos?ref=oi"))).status).toBe(400);
    buscarCodigo.mockResolvedValue({ codigo: null, vendaDisponivel: true });
    expect((await GET(makeNextRequestStub("https://x/api/admin/whatsapp/codigos?ref=K7M2Q"))).status).toBe(404);
  });

  it("marca venda com permissao de escrita e registra no log", async () => {
    marcarVenda.mockResolvedValue({ ...CODIGO, vendaEm: "2026-11-10T15:00:00Z" });
    const { POST } = await import("../../app/api/admin/whatsapp/codigos/route");
    const res = await POST(
      makeNextRequestStub("https://x/api/admin/whatsapp/codigos", { method: "POST", body: { ref: "K7M2Q", vendido: true } }),
    );
    expect(res.status).toBe(200);
    expect(guarda.mock.calls[0][1]).toEqual({ permission: "cadastros:write" });
    expect(marcarVenda).toHaveBeenCalledWith("K7M2Q", true);
    expect(logAdminAction).toHaveBeenCalledTimes(1);
  });

  it("sem a coluna da venda pede para rodar o SQL", async () => {
    marcarVenda.mockResolvedValue("sem_coluna");
    const { POST } = await import("../../app/api/admin/whatsapp/codigos/route");
    const res = await POST(
      makeNextRequestStub("https://x/api/admin/whatsapp/codigos", { method: "POST", body: { ref: "K7M2Q", vendido: true } }),
    );
    expect(res.status).toBe(409);
    expect(((await res.json()) as { error: string }).error).toContain("20261118160000_whatsapp_refs_venda.sql");
    expect(logAdminAction).not.toHaveBeenCalled();
  });

  it("corpo com campo a mais e recusado", async () => {
    const { POST } = await import("../../app/api/admin/whatsapp/codigos/route");
    const res = await POST(
      makeNextRequestStub("https://x/api/admin/whatsapp/codigos", {
        method: "POST",
        body: { ref: "K7M2Q", vendido: true, gclid: "x" },
      }),
    );
    expect(res.status).toBe(400);
    expect(marcarVenda).not.toHaveBeenCalled();
  });

  it("sem login, a guarda responde e nada e lido", async () => {
    guarda.mockReturnValue(new Response(null, { status: 401 }));
    const { GET, POST } = await import("../../app/api/admin/whatsapp/codigos/route");
    expect((await GET(makeNextRequestStub("https://x/api/admin/whatsapp/codigos?ref=K7M2Q"))).status).toBe(401);
    expect(
      (await POST(makeNextRequestStub("https://x/api/admin/whatsapp/codigos", { method: "POST", body: { ref: "K7M2Q", vendido: true } })))
        .status,
    ).toBe(401);
    expect(buscarCodigo).not.toHaveBeenCalled();
    expect(marcarVenda).not.toHaveBeenCalled();
  });
});
