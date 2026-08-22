// @vitest-environment node
/**
 * O webhook do WhatsApp era o endpoint mais barato de abusar do projeto: POST
 * publico, sem assinatura, que rodava o agente de IA e mandava mensagem pela
 * conta comercial para o numero escrito no proprio payload. Estes testes
 * descrevem o que precisa continuar sendo recusado.
 */
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { hmacSha256Hex } from "@/lib/webhookSignature";

import { GET, POST } from "../../app/api/whatsapp/webhook/route";

const APP_SECRET = "app-secret-de-teste-com-tamanho-suficiente";
const VERIFY_TOKEN = "verify-token-de-teste-1234567890";

// vi.hoisted porque vi.mock sobe para o topo do arquivo: sem isso a fabrica do
// mock rodaria antes da declaracao do espiao.
const { runAgent } = vi.hoisted(() => ({ runAgent: vi.fn() }));
vi.mock("@/lib/whatsapp/agent", () => ({ runAgent }));

const envAnterior = {
  WA_APP_SECRET: process.env.WA_APP_SECRET,
  WA_VERIFY_TOKEN: process.env.WA_VERIFY_TOKEN,
  WA_ACCESS_TOKEN: process.env.WA_ACCESS_TOKEN,
  WA_PHONE_NUMBER_ID: process.env.WA_PHONE_NUMBER_ID,
};

beforeAll(() => {
  runAgent.mockResolvedValue({ reply: "ok", escalate: false });
  process.env.WA_APP_SECRET = APP_SECRET;
  process.env.WA_VERIFY_TOKEN = VERIFY_TOKEN;
  // Sem token de envio o handler nem chega a chamar a Meta — e o que queremos
  // num teste de portao: verificar quem entra, nao a integracao.
  delete process.env.WA_ACCESS_TOKEN;
  delete process.env.WA_PHONE_NUMBER_ID;
});

afterEach(() => runAgent.mockClear());

afterAll(() => {
  for (const [chave, valor] of Object.entries(envAnterior)) {
    if (valor === undefined) delete process.env[chave];
    else process.env[chave] = valor;
  }
});

function payload(messageId = "wamid.TESTE1", timestamp = Math.floor(Date.now() / 1000)) {
  return JSON.stringify({
    entry: [
      {
        changes: [
          {
            field: "messages",
            value: {
              // O payload aponta um numero de origem que nao e o nosso. A rota
              // precisa ignorar isso e usar so o que esta no ambiente.
              metadata: { phone_number_id: "numero-do-atacante" },
              contacts: [{ wa_id: "5511999999999", profile: { name: "Fulano" } }],
              messages: [
                {
                  id: messageId,
                  type: "text",
                  from: "5511999999999",
                  timestamp: String(timestamp),
                  text: { body: "ola" },
                },
              ],
            },
          },
        ],
      },
    ],
  });
}

function post(corpo: string, assinatura?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (assinatura !== undefined) headers["x-hub-signature-256"] = assinatura;
  return POST(
    new NextRequest(
      new Request("https://byimperiodog.com.br/api/whatsapp/webhook", {
        method: "POST",
        headers,
        body: corpo,
      })
    )
  );
}

async function assinar(corpo: string) {
  return "sha256=" + (await hmacSha256Hex(APP_SECRET, corpo));
}

describe("webhook do WhatsApp — POST", () => {
  it("sem header de assinatura devolve 401 e nao roda o agente", async () => {
    const r = await post(payload());
    expect(r.status).toBe(401);
    expect(runAgent).not.toHaveBeenCalled();
  });

  it("assinatura invalida devolve 401 e nao roda o agente", async () => {
    const r = await post(payload(), "sha256=" + "0".repeat(64));
    expect(r.status).toBe(401);
    expect(runAgent).not.toHaveBeenCalled();
  });

  it("assinatura feita com outro segredo devolve 401", async () => {
    const corpo = payload();
    const errada = "sha256=" + (await hmacSha256Hex("outro-segredo-qualquer", corpo));
    const r = await post(corpo, errada);
    expect(r.status).toBe(401);
    expect(runAgent).not.toHaveBeenCalled();
  });

  it("assinatura valida de OUTRO corpo devolve 401", async () => {
    const assinaturaDoOriginal = await assinar(payload("wamid.ORIGINAL"));
    const r = await post(payload("wamid.TROCADO"), assinaturaDoOriginal);
    expect(r.status).toBe(401);
  });

  it("outro algoritmo no header devolve 401", async () => {
    const corpo = payload();
    const r = await post(corpo, "sha1=" + (await hmacSha256Hex(APP_SECRET, corpo)));
    expect(r.status).toBe(401);
  });

  it("corpo acima do teto devolve 413 e nao roda o agente", async () => {
    const gigante = JSON.stringify({ entry: [], lixo: "x".repeat(200 * 1024) });
    const r = await post(gigante, await assinar(gigante));
    expect(r.status).toBe(413);
    expect(runAgent).not.toHaveBeenCalled();
  });

  it("sem WA_APP_SECRET configurado falha fechado com 503", async () => {
    delete process.env.WA_APP_SECRET;
    try {
      const corpo = payload();
      const r = await post(corpo, "sha256=" + (await hmacSha256Hex(APP_SECRET, corpo)));
      expect(r.status).toBe(503);
      expect(runAgent).not.toHaveBeenCalled();
    } finally {
      process.env.WA_APP_SECRET = APP_SECRET;
    }
  });

  it("assinatura correta e aceita e roda o agente", async () => {
    const corpo = payload("wamid.VALIDA");
    const r = await post(corpo, await assinar(corpo));
    expect(r.status).toBe(200);
    expect(runAgent).toHaveBeenCalledTimes(1);
  });

  it("mensagem fora da janela de replay e descartada", async () => {
    const antiga = payload("wamid.ANTIGA", Math.floor(Date.now() / 1000) - 3600);
    const r = await post(antiga, await assinar(antiga));
    expect(r.status).toBe(200);
    expect(runAgent).not.toHaveBeenCalled();
  });

  it("a mesma mensagem nao roda o agente duas vezes", async () => {
    const corpo = payload("wamid.REPETIDA");
    const assinatura = await assinar(corpo);
    await post(corpo, assinatura);
    await post(corpo, assinatura);
    expect(runAgent).toHaveBeenCalledTimes(1);
  });
});

describe("webhook do WhatsApp — verificacao (GET)", () => {
  function get(params: Record<string, string>) {
    const url = new URL("https://byimperiodog.com.br/api/whatsapp/webhook");
    for (const [chave, valor] of Object.entries(params)) url.searchParams.set(chave, valor);
    return GET(new NextRequest(new Request(url)));
  }

  it("token errado devolve 403", () => {
    const r = get({ "hub.mode": "subscribe", "hub.verify_token": "errado", "hub.challenge": "123" });
    expect(r.status).toBe(403);
  });

  it("token correto devolve o challenge", async () => {
    const r = get({
      "hub.mode": "subscribe",
      "hub.verify_token": VERIFY_TOKEN,
      "hub.challenge": "123",
    });
    expect(r.status).toBe(200);
    expect(await r.text()).toBe("123");
  });

  it("sem WA_VERIFY_TOKEN configurado devolve 503, e nao aceita o valor de fabrica", () => {
    delete process.env.WA_VERIFY_TOKEN;
    try {
      const r = get({
        "hub.mode": "subscribe",
        "hub.verify_token": "byimperiodog_verify",
        "hub.challenge": "123",
      });
      expect(r.status).toBe(503);
    } finally {
      process.env.WA_VERIFY_TOKEN = VERIFY_TOKEN;
    }
  });
});
