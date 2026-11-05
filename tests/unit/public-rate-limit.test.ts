/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ipAnonimo, limiteDeTaxa } from "@/lib/limitePublico";

const sessionSecretOriginal = process.env.ADMIN_SESSION_SECRET;
const rateLimitSecretOriginal = process.env.PUBLIC_RATE_LIMIT_SECRET;

function request(ip: string) {
  return new Request("https://byimperiodog.com.br/api/test", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

describe("limite de taxa publico", () => {
  beforeAll(() => {
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.PUBLIC_RATE_LIMIT_SECRET;
  });

  afterAll(() => {
    if (sessionSecretOriginal === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = sessionSecretOriginal;
    if (rateLimitSecretOriginal === undefined) delete process.env.PUBLIC_RATE_LIMIT_SECRET;
    else process.env.PUBLIC_RATE_LIMIT_SECRET = rateLimitSecretOriginal;
  });

  it("mantem a barreira local quando o banco ou segredo nao estao disponiveis", async () => {
    const req = request("203.0.113.92");
    expect(await limiteDeTaxa(req, "teste-publico-unico", 2)).toBeNull();
    expect(await limiteDeTaxa(req, "teste-publico-unico", 2)).toBeNull();
    const bloqueio = await limiteDeTaxa(req, "teste-publico-unico", 2);
    expect(bloqueio?.status).toBe(429);
    expect(Number(bloqueio?.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("anonimiza IPv4 e IPv6 antes de persistir dados de diagnostico", () => {
    expect(ipAnonimo("203.0.113.92")).toBe("203.0.113.0");
    expect(ipAnonimo("2001:db8:abcd:1234::10")).toBe("2001:db8:abcd::");
  });

  it("versiona um contador atomico acessivel somente pela service role", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260828150000_public_rate_limits.sql"),
      "utf8",
    );
    expect(sql).toMatch(/on conflict \(key_hash\) do update/i);
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/grant execute[\s\S]+service_role/i);
    expect(sql).not.toMatch(/\bip_address\b|\bemail\b/i);
  });
});
