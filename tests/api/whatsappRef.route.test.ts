/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: () => ({ from: () => ({ upsert: (...args: unknown[]) => upsert(...args) }) }),
}));
vi.mock("@/lib/limitePublico", async (original) => ({
  ...(await original<typeof import("@/lib/limitePublico")>()),
  limiteDeTaxa: vi.fn(async () => null),
}));

import { POST } from "../../app/api/whatsapp/ref/route";

function pedido(corpo: unknown) {
  return new NextRequest("http://localhost/api/whatsapp/ref", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
}

beforeEach(() => {
  upsert.mockReset();
  upsert.mockResolvedValue({ error: null });
});

describe("POST /api/whatsapp/ref", () => {
  it("grava código e clique do anúncio", async () => {
    const res = await POST(pedido({ ref: "K7M2Q", gclid: "Cj0KCQabc_DEF-123", page: "/filhotes", puppySlug: "branca-femea" }));
    expect(res.status).toBe(204);
    expect(upsert).toHaveBeenCalledWith(
      { ref: "K7M2Q", gclid: "Cj0KCQabc_DEF-123", wbraid: null, gbraid: null, page: "/filhotes", puppy_slug: "branca-femea" },
      { onConflict: "ref", ignoreDuplicates: true },
    );
  });

  it("recusa sem nenhum clique de anúncio", async () => {
    const res = await POST(pedido({ ref: "K7M2Q", gclid: null }));
    expect(res.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("recusa código fora do formato e campo a mais", async () => {
    expect((await POST(pedido({ ref: "k7m2q", gclid: "abc" }))).status).toBe(400);
    expect((await POST(pedido({ ref: "K0M2Q", gclid: "abc" }))).status).toBe(400);
    expect((await POST(pedido({ ref: "K7M2Q", gclid: "abc", telefone: "11999999999" }))).status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("banco fora do ar não vira erro para o visitante", async () => {
    upsert.mockResolvedValue({ error: { message: "PGRST205" } });
    expect((await POST(pedido({ ref: "K7M2Q", wbraid: "abc" }))).status).toBe(204);
  });
});
