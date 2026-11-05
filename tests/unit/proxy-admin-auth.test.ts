/** @vitest-environment node */
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { signAdminSession } from "@/lib/adminSession";

import { proxy } from "../../proxy";

const ORIGINAL_SECRET = process.env.ADMIN_SESSION_SECRET;

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "0123456789abcdef0123456789abcdef";
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = ORIGINAL_SECRET;
});

describe("proxy administrativo", () => {
  it("bloqueia origem cruzada antes do login", async () => {
    const req = new NextRequest("https://byimperiodog.com.br/api/admin/login", {
      method: "POST",
      headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
    });
    expect((await proxy(req)).status).toBe(403);
  });

  it("deixa o login da mesma origem chegar ao route handler", async () => {
    const req = new NextRequest("https://byimperiodog.com.br/api/admin/login", {
      method: "POST",
      headers: { origin: "https://byimperiodog.com.br", "sec-fetch-site": "same-origin" },
    });
    const response = await proxy(req);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("aplica RBAC usando somente o papel assinado", async () => {
    const token = await signAdminSession({
      userId: "viewer-1",
      email: "byimperiodog@gmail.com",
      name: "Viewer",
      role: "viewer",
    });
    const req = new NextRequest("https://byimperiodog.com.br/api/admin/leads", {
      method: "PATCH",
      headers: {
        cookie: "admin_session=" + token + "; admin_role=owner",
        origin: "https://byimperiodog.com.br",
        "sec-fetch-site": "same-origin",
      },
    });
    expect((await proxy(req)).status).toBe(403);
  });
});
