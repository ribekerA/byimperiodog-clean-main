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

  it("POST com dados válidos salva e retorna", async () => {
    supabaseMock.from.mockReturnValue(makeUpsertChain({ meta_pixel_id: "1234567890", ga4_id: "G-ABC123" }));
    const req = makeNextRequestStub("http://localhost/api/settings/tracking", {
      method: "POST",
      body: { facebookPixelId: "1234567890", googleAnalyticsId: "G-ABC123" },
    });
    const response = await POST(req);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.settings.meta_pixel_id).toBe("1234567890");
    expect(body.settings.ga4_id).toBe("G-ABC123");
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
