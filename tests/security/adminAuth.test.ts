// @vitest-environment node
// happy-dom aplica a lista de headers proibidos do fetch e descarta cookie,
// origin e sec-fetch-site na construcao do Request. Este e codigo de servidor:
// precisa do ambiente node, onde os headers chegam como chegariam de verdade.
/**
 * Testes negativos do portao administrativo.
 *
 * Cada caso aqui descreve uma requisicao que ANTES entrava. O cookie
 * `admin_auth=1` e o header `x-admin-role: owner` eram aceitos sem assinatura
 * nenhuma: qualquer curl virava administrador. Os testes existem para que essa
 * porta nao volte sem alguem perceber.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SEGREDO = "segredo-de-teste-com-tamanho-suficiente-123456";

let signAdminSession: typeof import("@/lib/adminSession").signAdminSession;
let ADMIN_SESSION_COOKIE: string;
let requireAdminApi: typeof import("@/lib/adminAuth").requireAdminApi;

const envAnterior = {
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  ADMIN_PASS: process.env.ADMIN_PASS,
};

beforeAll(async () => {
  process.env.ADMIN_SESSION_SECRET = SEGREDO;
  delete process.env.ADMIN_PASS;
  const sessao = await import("@/lib/adminSession");
  signAdminSession = sessao.signAdminSession;
  ADMIN_SESSION_COOKIE = sessao.ADMIN_SESSION_COOKIE;
  requireAdminApi = (await import("@/lib/adminAuth")).requireAdminApi;
});

afterAll(() => {
  if (envAnterior.ADMIN_SESSION_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = envAnterior.ADMIN_SESSION_SECRET;
  if (envAnterior.ADMIN_PASS === undefined) delete process.env.ADMIN_PASS;
  else process.env.ADMIN_PASS = envAnterior.ADMIN_PASS;
});

function pedido(headers: Record<string, string> = {}, method = "GET") {
  return new Request("https://byimperiodog.com.br/api/admin/qualquer", { method, headers });
}

async function cookieValido(role: "owner" | "editor" | "viewer" = "owner") {
  const token = await signAdminSession({
    userId: "u-1",
    email: "admin@byimperiodog.com.br",
    name: "Admin",
    role,
  });
  return `${ADMIN_SESSION_COOKIE}=${token}`;
}

describe("requireAdminApi — o que precisa ser recusado", () => {
  it("sem cookie nenhum devolve 401", async () => {
    const r = await requireAdminApi(pedido());
    expect(r?.status).toBe(401);
  });

  it("cookie admin_auth=1 forjado devolve 401", async () => {
    const r = await requireAdminApi(pedido({ cookie: "admin_auth=1" }));
    expect(r?.status).toBe(401);
  });

  it("cookie adm=true forjado devolve 401", async () => {
    const r = await requireAdminApi(pedido({ cookie: "adm=true" }));
    expect(r?.status).toBe(401);
  });

  it("header x-admin-role: owner forjado devolve 401", async () => {
    const r = await requireAdminApi(
      pedido({ "x-admin-role": "owner" }, "GET"),
      { permission: "settings:write" }
    );
    expect(r?.status).toBe(401);
  });

  it("cookie admin_role=owner forjado nao concede permissao", async () => {
    const r = await requireAdminApi(
      pedido({ cookie: `${await cookieValido("viewer")}; admin_role=owner` }),
      { permission: "settings:write" }
    );
    expect(r?.status).toBe(403);
  });

  it("assinatura adulterada devolve 401", async () => {
    const cookie = await cookieValido("owner");
    const adulterado = cookie.slice(0, -3) + "AAA";
    const r = await requireAdminApi(pedido({ cookie: adulterado }));
    expect(r?.status).toBe(401);
  });

  it("payload trocado sem reassinar devolve 401", async () => {
    const cookie = await cookieValido("viewer");
    const [nome, token] = cookie.split("=");
    const [corpo, assinatura] = token.split(".");
    const json = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8"));
    json.role = "owner";
    const novoCorpo = Buffer.from(JSON.stringify(json), "utf8").toString("base64url");
    const r = await requireAdminApi(pedido({ cookie: `${nome}=${novoCorpo}.${assinatura}` }));
    expect(r?.status).toBe(401);
  });

  it("x-admin-pass sem ADMIN_PASS configurado devolve 401", async () => {
    const r = await requireAdminApi(pedido({ "x-admin-pass": "qualquer-coisa" }));
    expect(r?.status).toBe(401);
  });

  it("ADMIN_PASS curto demais nao autentica", async () => {
    process.env.ADMIN_PASS = "curta";
    try {
      const r = await requireAdminApi(pedido({ "x-admin-pass": "curta" }));
      expect(r?.status).toBe(401);
    } finally {
      delete process.env.ADMIN_PASS;
    }
  });

  it("POST de outra origem com sessao valida devolve 403 (CSRF)", async () => {
    const r = await requireAdminApi(
      pedido({ cookie: await cookieValido("owner"), origin: "https://site-do-atacante.example" }, "POST")
    );
    expect(r?.status).toBe(403);
  });

  it("POST com sec-fetch-site cross-site devolve 403 (CSRF)", async () => {
    const r = await requireAdminApi(
      pedido({ cookie: await cookieValido("owner"), "sec-fetch-site": "cross-site" }, "POST")
    );
    expect(r?.status).toBe(403);
  });
});

describe("requireAdminApi — o que precisa passar", () => {
  it("sessao assinada valida passa", async () => {
    const r = await requireAdminApi(pedido({ cookie: await cookieValido("owner") }));
    expect(r).toBeNull();
  });

  it("owner passa em permissao de escrita", async () => {
    const r = await requireAdminApi(pedido({ cookie: await cookieValido("owner") }), {
      permission: "settings:write",
    });
    expect(r).toBeNull();
  });

  it("viewer e barrado com 403 em permissao de escrita", async () => {
    const r = await requireAdminApi(pedido({ cookie: await cookieValido("viewer") }), {
      permission: "blog:write",
    });
    expect(r?.status).toBe(403);
  });

  it("editor passa em blog:write e e barrado em settings:write", async () => {
    const cookie = await cookieValido("editor");
    expect(await requireAdminApi(pedido({ cookie }), { permission: "blog:write" })).toBeNull();
    expect(
      (await requireAdminApi(pedido({ cookie }), { permission: "settings:write" }))?.status
    ).toBe(403);
  });

  it("POST da mesma origem com sessao valida passa", async () => {
    const r = await requireAdminApi(
      pedido(
        { cookie: await cookieValido("owner"), origin: "https://byimperiodog.com.br" },
        "POST"
      ),
      { permission: "blog:write" }
    );
    expect(r).toBeNull();
  });

  it("segredo de maquina forte autentica pelo header", async () => {
    process.env.ADMIN_PASS = "chave-de-maquina-longa-o-suficiente-2026";
    try {
      const r = await requireAdminApi(pedido({ "x-admin-pass": process.env.ADMIN_PASS }));
      expect(r).toBeNull();
    } finally {
      delete process.env.ADMIN_PASS;
    }
  });
});
