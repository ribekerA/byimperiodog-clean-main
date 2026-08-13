import { cleanup, render, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Componentes compilados com o runtime classico procuram React no escopo global.
(globalThis as unknown as { React?: typeof React }).React = React;

import { POST as analyticsPost } from "../../app/api/analytics/route";
import { makeNextRequestStub } from "../helpers/nextRequestStub";

const ENV_ORIGINAL = { ...process.env };

let corpos: string[] = [];

function pedido(corpo: string) {
  return makeNextRequestStub("http://localhost/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: corpo,
  });
}

/** Importa o componente depois do env, porque src/lib/analytics le os gates no load. */
async function carregar() {
  vi.resetModules();
  const mod = await import("@/components/blog/ScrollAnalytics");
  return mod.default;
}

beforeEach(() => {
  process.env = { ...ENV_ORIGINAL };
  // Em dev/test o cliente nao envia nada; forcamos para poder inspecionar o corpo.
  process.env.NEXT_PUBLIC_FORCE_ANALYTICS = "1";
  delete process.env.DISABLE_ANALYTICS;

  corpos = [];
  // sendBeacon devolvendo false faz o cliente cair no fetch, onde da para ler o corpo.
  Object.defineProperty(navigator, "sendBeacon", { value: () => false, configurable: true });
  vi.stubGlobal("fetch", (_url: string, init?: { body?: string }) => {
    if (init?.body) corpos.push(init.body);
    return Promise.resolve({ ok: true } as Response);
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  process.env = { ...ENV_ORIGINAL };
});

describe("ScrollAnalytics — o corpo tem que passar pela rota", () => {
  it("post_view sai com name no topo e post_id dentro de meta", async () => {
    const ScrollAnalytics = await carregar();
    render(
      <>
        <article>corpo do artigo</article>
        <ScrollAnalytics postId="spitz-alemao-anao-dentes" readingTimeMin={7} />
      </>,
    );

    await waitFor(() => expect(corpos.length).toBeGreaterThan(0));
    const enviado = JSON.parse(corpos[0]);
    expect(enviado.name).toBe("post_view");
    expect(enviado.meta.post_id).toBe("spitz-alemao-anao-dentes");
    expect(enviado).not.toHaveProperty("event");
  });

  it("a rota real aceita esse corpo em vez de responder 400", async () => {
    const ScrollAnalytics = await carregar();
    render(
      <>
        <article>corpo do artigo</article>
        <ScrollAnalytics postId="spitz-alemao-anao-dentes" readingTimeMin={7} />
      </>,
    );

    await waitFor(() => expect(corpos.length).toBeGreaterThan(0));
    const res = await analyticsPost(pedido(corpos[0]));
    expect(res.status).not.toBe(400);
    expect([200, 202]).toContain(res.status);
  });

  it("o formato antigo, com event no lugar de name, volta 400", async () => {
    // Era exatamente isso que /blog/[slug] mandava em toda visita: o evento
    // batia na rota, tomava 400 e nenhuma leitura foi gravada.
    const antigo = JSON.stringify({ event: "post_view", post_id: "spitz-alemao-anao-dentes" });
    const res = await analyticsPost(pedido(antigo));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("name required");
  });
});
