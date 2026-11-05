/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { requireAdminApi } from "@/lib/adminAuth";
import {
  ADMIN_SESSION_MAX_AGE,
  signAdminSession,
  verifyAdminSession,
} from "@/lib/adminSession";
import { verifyAdminSessionSync } from "@/lib/adminSessionNode";

const SECRET = "0123456789abcdef0123456789abcdef";
const ORIGINAL_SECRET = process.env.ADMIN_SESSION_SECRET;
const ORIGINAL_PASS = process.env.ADMIN_PASS;

async function tokenFor(role: "owner" | "editor" | "viewer") {
  return signAdminSession({
    userId: "user-1",
    email: "byimperiodog@gmail.com",
    name: "By Imperio Dog",
    role,
  });
}

function request(path: string, method: string, token?: string, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  if (token) headers.set("cookie", `admin_session=${token}`);
  return new Request(`https://byimperiodog.com.br${path}`, { method, headers });
}

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = SECRET;
  process.env.ADMIN_PASS = "server-only-automation-secret";
});

afterEach(() => {
  vi.useRealTimers();
  if (ORIGINAL_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = ORIGINAL_SECRET;
  if (ORIGINAL_PASS === undefined) delete process.env.ADMIN_PASS;
  else process.env.ADMIN_PASS = ORIGINAL_PASS;
});

describe("sessao administrativa assinada", () => {
  it("aceita o mesmo token nos guards Edge e Node", async () => {
    const token = await tokenFor("owner");
    expect((await verifyAdminSession(token))?.email).toBe("byimperiodog@gmail.com");
    expect(verifyAdminSessionSync(token)?.role).toBe("owner");
  });

  it("rejeita adulteracao, formato extra e segredo fraco", async () => {
    const token = await tokenFor("owner");
    expect(await verifyAdminSession(`${token}x`)).toBeNull();
    expect(verifyAdminSessionSync(`${token}.extra`)).toBeNull();
    process.env.ADMIN_SESSION_SECRET = "curto";
    await expect(tokenFor("owner")).rejects.toThrow(/32 bytes/);
    expect(verifyAdminSessionSync(token)).toBeNull();
  });

  it("expira no limite absoluto da sessao", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-28T12:00:00Z"));
    const token = await tokenFor("owner");
    vi.setSystemTime(new Date(Date.now() + (ADMIN_SESSION_MAX_AGE + 1) * 1000));
    expect(await verifyAdminSession(token)).toBeNull();
    expect(verifyAdminSessionSync(token)).toBeNull();
  });
});

describe("autorizacao administrativa", () => {
  it("recusa cookies legadas nao assinadas", () => {
    const response = requireAdminApi(request(
      "/api/admin/leads",
      "GET",
      undefined,
      { cookie: "admin_auth=1; adm=true; admin_role=owner" },
    ));
    expect(response?.status).toBe(401);
  });

  it("viewer le, mas nao altera; editor escreve blog, mas nao configuracao", async () => {
    const viewer = await tokenFor("viewer");
    expect(requireAdminApi(request("/api/admin/leads", "GET", viewer))).toBeNull();
    expect(requireAdminApi(request("/api/admin/leads", "PATCH", viewer))?.status).toBe(403);

    const editor = await tokenFor("editor");
    expect(requireAdminApi(request("/api/admin/blog/publish", "POST", editor))).toBeNull();
    expect(requireAdminApi(request("/api/admin/settings", "POST", editor))?.status).toBe(403);
  });

  it("x-admin-pass e owner e ignora papel forjado pelo cliente", () => {
    const allowed = requireAdminApi(request(
      "/api/admin/settings",
      "POST",
      undefined,
      { "x-admin-pass": "server-only-automation-secret", "x-admin-role": "viewer" },
    ));
    expect(allowed).toBeNull();
  });

  it("recusa mutacao com origem cruzada mesmo com credencial valida", () => {
    const denied = requireAdminApi(request(
      "/api/admin/settings",
      "POST",
      undefined,
      {
        "x-admin-pass": "server-only-automation-secret",
        origin: "https://evil.example",
        "sec-fetch-site": "cross-site",
      },
    ));
    expect(denied?.status).toBe(403);
  });
});
