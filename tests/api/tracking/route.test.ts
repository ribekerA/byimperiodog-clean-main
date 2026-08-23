import { describe, expect, it, beforeEach, vi } from "vitest";

import { GET, POST } from "../../../app/api/settings/tracking/route";
import { makeNextRequestStub } from "../../helpers/nextRequestStub";

type SupabaseMock = {
  from: ReturnType<typeof vi.fn>;
};

let supabaseMock: SupabaseMock;

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: () => supabaseMock,
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin: () => undefined,
}));

const makeSelectChain = (data: any, error: any = null) => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data, error })),
    })),
  })),
});

const makeUpsertChain = (data: any, error: any = null) => ({
  upsert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data, error })),
    })),
  })),
});

describe("/api/settings/tracking route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    supabaseMock = { from: vi.fn() };
  });

  it("GET sem registro retorna objeto vazio", async () => {
    supabaseMock.from.mockReturnValue(makeSelectChain(null, null));
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.settings.meta_pixel_id ?? null).toBeNull();
    expect(body.settings.ga4_id ?? null).toBeNull();
  });

  it("GET com erro no banco retorna fallback público e mantém cache", async () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "GTM-LOCAL123");
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-LOCAL12345");
    vi.stubEnv("ADMIN_PASS", "segredo-que-nao-pode-vazar");
    supabaseMock.from.mockReturnValue(makeSelectChain(null, { message: "offline" }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    expect(body.settings.gtm_id).toBe("GTM-LOCAL123");
    expect(body.settings.ga4_id).toBe("G-LOCAL12345");
    expect(JSON.stringify(body)).not.toContain("segredo-que-nao-pode-vazar");
    expect(body.settings).not.toHaveProperty("fb_capi_token");
    expect(body.settings).not.toHaveProperty("tiktok_api_token");
  });

  it("GET com exceção inesperada retorna fallback público", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "1234567890");
    supabaseMock.from.mockImplementation(() => {
      throw new Error("Supabase indisponível");
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.settings.meta_pixel_id).toBe("1234567890");
  });

  // O ID de GA4 do fixture era "G-ABC123", que o validador recusa: ele exige de
  // 8 a 15 caracteres depois do "G-", e IDs reais têm 10. O teste pedia 200 e
  // recebia 400 corretamente — o dado de teste é que não era realista.
  it("POST com dados válidos salva e retorna", async () => {
    supabaseMock.from.mockReturnValue(makeUpsertChain({ meta_pixel_id: "1234567890", ga4_id: "G-ABCD123456" }));
    const req = makeNextRequestStub("http://localhost/api/settings/tracking", {
      method: "POST",
      body: { facebookPixelId: "1234567890", googleAnalyticsId: "G-ABCD123456" },
    });
    const response = await POST(req);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.settings.meta_pixel_id).toBe("1234567890");
    expect(body.settings.ga4_id).toBe("G-ABCD123456");
  });

  it("POST com Pixel ID inválido retorna 400", async () => {
    const req = makeNextRequestStub("http://localhost/api/settings/tracking", {
      method: "POST",
      body: { facebookPixelId: "abc123" },
    });
    const response = await POST(req);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toMatch(/Facebook Pixel ID/);
  });

  it('POST com GA ID sem "G-" retorna 400', async () => {
    const req = makeNextRequestStub("http://localhost/api/settings/tracking", {
      method: "POST",
      body: { googleAnalyticsId: "ABC123" },
    });
    const response = await POST(req);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toMatch(/Google Analytics ID/);
  });
});
