// @vitest-environment node
/**
 * O fluxo de OAuth das integracoes (Meta, GA4, GTM) sorteava um `state`, mandava
 * para o provedor e nunca mais olhava para ele. Havia ate um comentario dizendo
 * "opcionalmente guarde o state num cookie". Sem essa conferencia, um `code`
 * obtido na conta do atacante, entregue ao /callback, ficava gravado como se
 * fosse a integracao do canil — e o bloco de auto-configuracao no fim da rota
 * ainda trocava os IDs de GA4, GTM e pixel da Meta do site inteiro.
 *
 * Estes testes descrevem o que precisa continuar sendo recusado.
 */
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { conferirEstadoOAuth, criarEstadoOAuth, OAUTH_STATE_COOKIE } from "@/lib/oauthState";
import {
  ChaveDeCifraAusente,
  cifrarToken,
  decifrarToken,
  pareceCifrado,
} from "@/lib/tokenCipher";

const SEGREDO_SESSAO = "segredo-de-teste-com-tamanho-suficiente-123456";
// 32 bytes em hexadecimal. Valor de teste, sem uso em lugar nenhum.
const CHAVE_CIFRA = "a".repeat(64);
const USER_ID = "u-1";

const { upsert, exchangeCode } = vi.hoisted(() => ({
  upsert: vi.fn(async () => ({ error: null })),
  exchangeCode: vi.fn(async () => ({ accessToken: "token-de-acesso", refreshToken: "token-de-refresh" })),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: () => ({
    from: () => ({
      upsert,
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
    }),
  }),
}));

vi.mock("@/lib/tracking/providers/registry", () => ({
  getProvider: (key: string) =>
    key === "google_analytics"
      ? {
          id: "google_analytics",
          buildAuthUrl: ({ state, codeChallenge }: { state: string; codeChallenge?: string }) => ({
            authUrl: `https://exemplo.invalid/auth?state=${state}&code_challenge=${codeChallenge ?? ""}`,
            scope: [],
            provider: "google_analytics",
          }),
          exchangeCode,
          listResources: async () => [],
        }
      : null,
}));

let GET: typeof import("../../app/api/integrations/[provider]/callback/route").GET;
let signAdminSession: typeof import("@/lib/adminSession").signAdminSession;
let ADMIN_SESSION_COOKIE: string;

const envAnterior = {
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  INTEGRATIONS_ENCRYPTION_KEY: process.env.INTEGRATIONS_ENCRYPTION_KEY,
};

beforeAll(async () => {
  process.env.ADMIN_SESSION_SECRET = SEGREDO_SESSAO;
  process.env.INTEGRATIONS_ENCRYPTION_KEY = CHAVE_CIFRA;

  const sessao = await import("@/lib/adminSession");
  signAdminSession = sessao.signAdminSession;
  ADMIN_SESSION_COOKIE = sessao.ADMIN_SESSION_COOKIE;
  GET = (await import("../../app/api/integrations/[provider]/callback/route")).GET;
});

afterEach(() => {
  upsert.mockClear();
  exchangeCode.mockClear();
});

afterAll(() => {
  for (const [chave, valor] of Object.entries(envAnterior)) {
    if (valor === undefined) delete process.env[chave];
    else process.env[chave] = valor;
  }
});

async function cookieDeSessao(userId = USER_ID) {
  const token = await signAdminSession({
    userId,
    email: "admin@byimperiodog.com.br",
    name: "Admin",
    role: "owner",
  });
  return `${ADMIN_SESSION_COOKIE}=${token}`;
}

function callback(opts: {
  provider?: string;
  code?: string;
  state?: string;
  cookies?: string[];
}) {
  const provider = opts.provider ?? "google_analytics";
  const url = new URL(`https://byimperiodog.com.br/api/integrations/${provider}/callback`);
  if (opts.code !== undefined) url.searchParams.set("code", opts.code);
  if (opts.state !== undefined) url.searchParams.set("state", opts.state);

  const headers: Record<string, string> = {};
  if (opts.cookies?.length) headers.cookie = opts.cookies.join("; ");

  return GET(new NextRequest(new Request(url, { headers })), { params: { provider } });
}

describe("estado de OAuth", () => {
  it("o estado emitido volta a ser reconhecido", async () => {
    const { state, cookie } = await criarEstadoOAuth({ provider: "google_analytics", userId: USER_ID });
    const conferido = await conferirEstadoOAuth({
      cookie,
      stateRecebido: state,
      provider: "google_analytics",
    });
    expect(conferido?.userId).toBe(USER_ID);
    expect(conferido?.verifier).toBeTruthy();
  });

  it("o desafio PKCE nao repete o verificador", async () => {
    const { codeChallenge, cookie } = await criarEstadoOAuth({
      provider: "google_analytics",
      userId: USER_ID,
    });
    expect(codeChallenge).not.toContain(JSON.parse(atob(cookie.split(".")[0].replace(/-/g, "+").replace(/_/g, "/") + "==")).verifier);
  });

  it("state diferente do emitido nao passa", async () => {
    const { cookie } = await criarEstadoOAuth({ provider: "google_analytics", userId: USER_ID });
    const conferido = await conferirEstadoOAuth({
      cookie,
      stateRecebido: "inventado",
      provider: "google_analytics",
    });
    expect(conferido).toBeNull();
  });

  it("provedor trocado no meio do caminho nao passa", async () => {
    const { state, cookie } = await criarEstadoOAuth({ provider: "google_analytics", userId: USER_ID });
    const conferido = await conferirEstadoOAuth({ cookie, stateRecebido: state, provider: "facebook" });
    expect(conferido).toBeNull();
  });

  it("cookie adulterado nao passa", async () => {
    const { state, cookie } = await criarEstadoOAuth({ provider: "google_analytics", userId: USER_ID });
    const [corpo, assinatura] = cookie.split(".");
    const adulterado = `${corpo}x.${assinatura}`;
    const conferido = await conferirEstadoOAuth({
      cookie: adulterado,
      stateRecebido: state,
      provider: "google_analytics",
    });
    expect(conferido).toBeNull();
  });

  it("cookie assinado com outro segredo nao passa", async () => {
    const { state, cookie } = await criarEstadoOAuth({ provider: "google_analytics", userId: USER_ID });
    process.env.ADMIN_SESSION_SECRET = "outro-segredo-completamente-diferente-000";
    try {
      const conferido = await conferirEstadoOAuth({
        cookie,
        stateRecebido: state,
        provider: "google_analytics",
      });
      expect(conferido).toBeNull();
    } finally {
      process.env.ADMIN_SESSION_SECRET = SEGREDO_SESSAO;
    }
  });
});

describe("cifra dos tokens de integracao", () => {
  it("cifra e decifra de volta", async () => {
    const cifrado = await cifrarToken("token-de-refresh-do-google");
    expect(pareceCifrado(cifrado)).toBe(true);
    expect(cifrado).not.toContain("token-de-refresh-do-google");
    expect(await decifrarToken(cifrado)).toBe("token-de-refresh-do-google");
  });

  it("dois envelopes do mesmo texto sao diferentes", async () => {
    expect(await cifrarToken("mesmo-token")).not.toBe(await cifrarToken("mesmo-token"));
  });

  it("envelope adulterado nao decifra", async () => {
    const cifrado = await cifrarToken("token-qualquer");
    const [v, iv, corpo] = cifrado.split(".");
    const trocado = corpo.startsWith("A") ? "B" + corpo.slice(1) : "A" + corpo.slice(1);
    await expect(decifrarToken([v, iv, trocado].join("."))).rejects.toThrow();
  });

  it("valor gravado antes da cifra volta como esta", async () => {
    expect(await decifrarToken("token-antigo-em-texto-puro")).toBe("token-antigo-em-texto-puro");
  });

  it("sem chave configurada, cifrar falha em vez de gravar em texto puro", async () => {
    delete process.env.INTEGRATIONS_ENCRYPTION_KEY;
    try {
      await expect(cifrarToken("token")).rejects.toBeInstanceOf(ChaveDeCifraAusente);
    } finally {
      process.env.INTEGRATIONS_ENCRYPTION_KEY = CHAVE_CIFRA;
    }
  });
});

describe("callback de OAuth", () => {
  it("sem sessao de administrador devolve 401", async () => {
    const r = await callback({ code: "abc", state: "qualquer" });
    expect(r.status).toBe(401);
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("com sessao mas sem o cookie de estado devolve 400 e nao troca o code", async () => {
    const r = await callback({ code: "abc", state: "qualquer", cookies: [await cookieDeSessao()] });
    expect(r.status).toBe(400);
    expect(await r.json()).toMatchObject({ error: "invalid_state" });
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("state da URL diferente do cookie devolve 400", async () => {
    const { cookie } = await criarEstadoOAuth({ provider: "google_analytics", userId: USER_ID });
    const r = await callback({
      code: "abc",
      state: "state-do-atacante",
      cookies: [await cookieDeSessao(), `${OAUTH_STATE_COOKIE}=${cookie}`],
    });
    expect(r.status).toBe(400);
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("estado emitido para outra pessoa devolve 403", async () => {
    const { state, cookie } = await criarEstadoOAuth({
      provider: "google_analytics",
      userId: "outra-pessoa",
    });
    const r = await callback({
      code: "abc",
      state,
      cookies: [await cookieDeSessao(USER_ID), `${OAUTH_STATE_COOKIE}=${cookie}`],
    });
    expect(r.status).toBe(403);
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("sem code devolve 400", async () => {
    const r = await callback({ state: "qualquer", cookies: [await cookieDeSessao()] });
    expect(r.status).toBe(400);
  });

  it("provedor desconhecido devolve 400", async () => {
    const r = await callback({
      provider: "provedor-inventado",
      code: "abc",
      state: "x",
      cookies: [await cookieDeSessao()],
    });
    expect(r.status).toBe(400);
  });

  it("estado valido troca o code e grava os tokens cifrados", async () => {
    const { state, cookie } = await criarEstadoOAuth({ provider: "google_analytics", userId: USER_ID });
    const r = await callback({
      code: "abc",
      state,
      cookies: [await cookieDeSessao(), `${OAUTH_STATE_COOKIE}=${cookie}`],
    });

    expect(r.status).toBe(307);
    expect(r.headers.get("location")).toContain("/admin/tracking");

    // O verificador PKCE precisa ter ido junto na troca do code.
    expect(exchangeCode).toHaveBeenCalledTimes(1);
    expect(exchangeCode.mock.calls[0][0]).toMatchObject({ codeVerifier: expect.any(String) });

    const gravado = upsert.mock.calls[0][0] as Record<string, string>;
    expect(gravado.user_id).toBe(USER_ID);
    expect(gravado.access_token).not.toBe("token-de-acesso");
    expect(pareceCifrado(gravado.access_token)).toBe(true);
    expect(pareceCifrado(gravado.refresh_token)).toBe(true);
  });

  it("sem chave de cifra o callback recusa em vez de gravar token em texto puro", async () => {
    const { state, cookie } = await criarEstadoOAuth({ provider: "google_analytics", userId: USER_ID });
    delete process.env.INTEGRATIONS_ENCRYPTION_KEY;
    try {
      const r = await callback({
        code: "abc",
        state,
        cookies: [await cookieDeSessao(), `${OAUTH_STATE_COOKIE}=${cookie}`],
      });
      expect(r.status).toBe(503);
      expect(upsert).not.toHaveBeenCalled();
    } finally {
      process.env.INTEGRATIONS_ENCRYPTION_KEY = CHAVE_CIFRA;
    }
  });
});
