// @vitest-environment node
// happy-dom descarta cookie, origin e sec-fetch-site na construcao do Request
// (lista de headers proibidos do fetch). Aqui os headers precisam chegar como
// chegariam de verdade.
/**
 * O middleware e a porta da frente: ele responde antes de qualquer route
 * handler. Ate agora ele tinha regra propria e mais fraca que a das rotas —
 * comparava ADMIN_PASS com `===`, aceitava segredo de qualquer tamanho e nao
 * olhava origem. Adiantava pouco endurecer o portao das rotas se a porta da
 * frente abria com menos.
 *
 * Estes testes existem para que as duas nao voltem a divergir.
 */
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SEGREDO_SESSAO = "segredo-de-teste-com-tamanho-suficiente-123456";
const SEGREDO_MAQUINA = "chave-de-maquina-longa-o-suficiente-2026";

let middleware: typeof import("../../middleware").middleware;
let signAdminSession: typeof import("@/lib/adminSession").signAdminSession;
let ADMIN_SESSION_COOKIE: string;

const envAnterior = {
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  ADMIN_PASS: process.env.ADMIN_PASS,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};

beforeAll(async () => {
  process.env.ADMIN_SESSION_SECRET = SEGREDO_SESSAO;
  delete process.env.ADMIN_PASS;
  // Sem isso o middleware entraria na regra de forcar www e devolveria 308
  // antes de chegar na checagem de autenticacao.
  delete process.env.NEXT_PUBLIC_SITE_URL;

  const sessao = await import("@/lib/adminSession");
  signAdminSession = sessao.signAdminSession;
  ADMIN_SESSION_COOKIE = sessao.ADMIN_SESSION_COOKIE;
  middleware = (await import("../../middleware")).middleware;
});

afterAll(() => {
  for (const [chave, valor] of Object.entries(envAnterior)) {
    if (valor === undefined) delete process.env[chave];
    else process.env[chave] = valor;
  }
});

function pedido(
  caminho: string,
  headers: Record<string, string> = {},
  method = "GET"
): NextRequest {
  return new NextRequest(new Request(`https://byimperiodog.com.br${caminho}`, { method, headers }));
}

async function cookieDeSessao(role: "owner" | "editor" | "viewer" = "owner") {
  const token = await signAdminSession({
    userId: "u-1",
    email: "admin@byimperiodog.com.br",
    name: "Admin",
    role,
  });
  return `${ADMIN_SESSION_COOKIE}=${token}`;
}

describe("middleware — /api/admin", () => {
  it("sem cookie nenhum devolve 401", async () => {
    const r = await middleware(pedido("/api/admin/leads"));
    expect(r.status).toBe(401);
  });

  it("cookie admin_auth=1 forjado devolve 401", async () => {
    const r = await middleware(pedido("/api/admin/leads", { cookie: "admin_auth=1" }));
    expect(r.status).toBe(401);
  });

  it("POST de outra origem com sessao valida devolve 403 (CSRF)", async () => {
    const r = await middleware(
      pedido(
        "/api/admin/puppies",
        { cookie: await cookieDeSessao("owner"), origin: "https://site-do-atacante.example" },
        "POST"
      )
    );
    expect(r.status).toBe(403);
  });

  it("POST com sec-fetch-site cross-site devolve 403 (CSRF)", async () => {
    const r = await middleware(
      pedido(
        "/api/admin/puppies",
        { cookie: await cookieDeSessao("owner"), "sec-fetch-site": "cross-site" },
        "POST"
      )
    );
    expect(r.status).toBe(403);
  });

  it("ADMIN_PASS curto demais nao autentica", async () => {
    process.env.ADMIN_PASS = "curta";
    try {
      const r = await middleware(pedido("/api/admin/leads", { "x-admin-pass": "curta" }));
      expect(r.status).toBe(401);
    } finally {
      delete process.env.ADMIN_PASS;
    }
  });

  it("x-admin-pass errado com ADMIN_PASS forte devolve 401", async () => {
    process.env.ADMIN_PASS = SEGREDO_MAQUINA;
    try {
      const r = await middleware(
        pedido("/api/admin/leads", { "x-admin-pass": SEGREDO_MAQUINA.slice(0, -1) + "X" })
      );
      expect(r.status).toBe(401);
    } finally {
      delete process.env.ADMIN_PASS;
    }
  });

  it("sessao assinada valida segue adiante", async () => {
    const r = await middleware(pedido("/api/admin/leads", { cookie: await cookieDeSessao() }));
    expect(r.status).toBe(200);
    expect(r.headers.get("X-Robots-Tag")).toContain("noindex");
  });

  it("segredo de maquina forte segue adiante", async () => {
    process.env.ADMIN_PASS = SEGREDO_MAQUINA;
    try {
      const r = await middleware(pedido("/api/admin/leads", { "x-admin-pass": SEGREDO_MAQUINA }));
      expect(r.status).toBe(200);
    } finally {
      delete process.env.ADMIN_PASS;
    }
  });

  it("/api/admin/login continua aberto", async () => {
    const r = await middleware(pedido("/api/admin/login", {}, "POST"));
    expect(r.status).toBe(200);
  });
});

describe("middleware — paginas /admin", () => {
  it("sem sessao redireciona para o login", async () => {
    const r = await middleware(pedido("/admin/dashboard"));
    expect(r.status).toBe(307);
    expect(r.headers.get("location")).toContain("/admin/login");
  });

  it("com sessao valida deixa passar e marca noindex", async () => {
    const r = await middleware(pedido("/admin/dashboard", { cookie: await cookieDeSessao() }));
    expect(r.status).toBe(200);
    expect(r.headers.get("X-Robots-Tag")).toContain("noindex");
  });

  it("com sessao valida o login redireciona para o dashboard", async () => {
    const r = await middleware(pedido("/admin/login", { cookie: await cookieDeSessao() }));
    expect(r.status).toBe(307);
    expect(r.headers.get("location")).toContain("/admin/dashboard");
  });
});
