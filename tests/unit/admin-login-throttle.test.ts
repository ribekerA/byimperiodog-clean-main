/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: () => {
    throw new Error("banco indisponivel no teste");
  },
}));

import {
  clearAdminLoginAttempts,
  consumeAdminLoginAttempt,
} from "@/lib/adminLoginThrottle";

function request(ip: string) {
  return new Request("https://byimperiodog.com.br/api/admin/login", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

describe("bloqueio de forca bruta do admin", () => {
  it("bloqueia a sexta tentativa do mesmo e-mail mesmo sem o banco", async () => {
    const req = request("203.0.113.10");
    const email = "teste-unico@example.com";
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      expect((await consumeAdminLoginAttempt(req, email)).allowed).toBe(true);
    }
    const blocked = await consumeAdminLoginAttempt(req, email);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    await clearAdminLoginAttempts(req, email);
    expect((await consumeAdminLoginAttempt(req, email)).allowed).toBe(true);
  });

  it("versiona a camada distribuida sem expor IP ou e-mail ao banco", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260828130000_admin_login_throttle.sql"),
      "utf8",
    );
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/grant execute[\s\S]+service_role/i);
    expect(sql).toMatch(/key_hash text primary key/i);
    expect(sql).not.toMatch(/\bemail\b|\bip_address\b/i);
  });
});
