// @vitest-environment node
// Ambiente node de proposito: em jsdom o fetch passa pela politica de origem do
// navegador e bloqueia a chamada para o servidor de teste. A funcao agendada
// roda em Node na Netlify, entao e em Node que ela tem de ser testada.

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

// A funcao agendada da Netlify e o unico lugar que dispara os agendadores em
// producao. Se ela parar de mandar o header do segredo, ou parar de chamar um
// dos tres endpoints, o agendamento morre em silencio — ninguem recebe erro,
// as coisas so nunca acontecem. Este teste sobe um servidor de mentira e
// confere o que ela realmente pede.

type Chamada = { url: string; metodo: string; auth: string | undefined };

let servidor: Server;
let chamadas: Chamada[];
let base: string;
const envOriginal = {
  URL: process.env.URL,
  DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  CRON_SECRET: process.env.CRON_SECRET,
};

async function rodarFuncao() {
  // Import dinamico a cada teste: a funcao le process.env na chamada, entao o
  // modulo pode ser reaproveitado sem problema.
  const modulo = await import("../../netlify/functions/cron-due.mjs");
  return modulo.default();
}

beforeEach(async () => {
  chamadas = [];
  servidor = createServer((req, res) => {
    chamadas.push({
      url: req.url ?? "",
      metodo: req.method ?? "",
      auth: req.headers.authorization,
    });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });
  await new Promise<void>((resolve) => servidor.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  process.env.URL = base;
});

afterEach(async () => {
  await new Promise<void>((resolve) => {
    servidor.close(() => resolve());
  });
  for (const [chave, valor] of Object.entries(envOriginal)) {
    if (valor === undefined) delete process.env[chave];
    else process.env[chave] = valor;
  }
});

describe("funcao agendada cron-due", () => {
  it("chama os tres agendadores, cada um no seu metodo", async () => {
    delete process.env.CRON_SECRET;
    await rodarFuncao();

    expect(chamadas).toHaveLength(3);
    expect(chamadas.map((c) => `${c.metodo} ${c.url}`)).toEqual([
      "GET /api/cron/publish-scheduled",
      "POST /api/blog/publish-due",
      "GET /api/cron/autosales-due",
    ]);
  });

  it("manda o CRON_SECRET como Bearer em todas as chamadas", async () => {
    process.env.CRON_SECRET = "segredo-da-funcao";
    await rodarFuncao();

    expect(chamadas.every((c) => c.auth === "Bearer segredo-da-funcao")).toBe(true);
  });

  it("sem CRON_SECRET, nao inventa header de autorizacao", async () => {
    delete process.env.CRON_SECRET;
    await rodarFuncao();

    expect(chamadas.every((c) => c.auth === undefined)).toBe(true);
  });

  it("um endpoint fora do ar nao impede os outros dois", async () => {
    delete process.env.CRON_SECRET;
    // Derruba a resposta do primeiro endpoint e deixa os outros responderem.
    servidor.removeAllListeners("request");
    servidor.on("request", (req, res) => {
      chamadas.push({ url: req.url ?? "", metodo: req.method ?? "", auth: req.headers.authorization });
      if (req.url === "/api/cron/publish-scheduled") {
        res.destroy();
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });

    const resposta = await rodarFuncao();
    const corpo = await resposta.json();

    expect(chamadas).toHaveLength(3);
    expect(corpo.ok).toBe(false);
    expect(corpo.resultados[0].status).toBe(0);
    expect(corpo.resultados[1].status).toBe(200);
    expect(corpo.resultados[2].status).toBe(200);
  });

  it("sem URL do site no ambiente, responde 500 e nao chama ninguem", async () => {
    delete process.env.URL;
    delete process.env.DEPLOY_PRIME_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const resposta = await rodarFuncao();

    expect(resposta.status).toBe(500);
    expect(chamadas).toHaveLength(0);
  });
});
