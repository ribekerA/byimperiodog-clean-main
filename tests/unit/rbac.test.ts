import { describe, expect, it } from "vitest";

import {
  LEAST_PRIVILEGE_ROLE,
  assertPermission,
  hasPermission,
  normalizeRole,
} from "@/lib/rbac";

describe("rbac helpers", () => {
  it("cai no menor privilegio quando o valor nao e reconhecido", () => {
    expect(normalizeRole("owner")).toBe("owner");
    expect(normalizeRole("EDITOR")).toBe("editor");
    expect(normalizeRole("viewer")).toBe("viewer");
    // Estes tres devolviam "owner" antes: valor vazio ou desconhecido virava
    // dono do painel. Agora vira viewer.
    expect(normalizeRole("")).toBe(LEAST_PRIVILEGE_ROLE);
    expect(normalizeRole(undefined)).toBe(LEAST_PRIVILEGE_ROLE);
    expect(normalizeRole("squad")).toBe(LEAST_PRIVILEGE_ROLE);
  });

  it("aceita fallback explicito apenas onde o chamador informa", () => {
    expect(normalizeRole(null, "owner")).toBe("owner");
    expect(normalizeRole("squad", "editor")).toBe("editor");
  });

  it("valida permissões por role", () => {
    expect(hasPermission("owner", "settings:write")).toBe(true);
    expect(hasPermission("editor", "blog:write")).toBe(true);
    expect(hasPermission("editor", "settings:write")).toBe(false);
    expect(hasPermission("viewer", "blog:write")).toBe(false);
    expect(hasPermission("viewer", "blog:read")).toBe(true);
  });

  it("gera erro quando permissao nao existe para role", () => {
    expect(() => assertPermission("viewer", "blog:write")).toThrowError();
  });

  it("NEXT_PUBLIC_ADMIN_OPEN nao libera mais permissao", () => {
    const anterior = process.env.NEXT_PUBLIC_ADMIN_OPEN;
    process.env.NEXT_PUBLIC_ADMIN_OPEN = "1";
    try {
      expect(hasPermission("viewer", "settings:write")).toBe(false);
    } finally {
      if (anterior === undefined) delete process.env.NEXT_PUBLIC_ADMIN_OPEN;
      else process.env.NEXT_PUBLIC_ADMIN_OPEN = anterior;
    }
  });

  it("nao exporta mais leitores de role controlados pelo cliente", async () => {
    const rbac = await import("@/lib/rbac");
    for (const removido of [
      "getRoleFromHeaders",
      "getRoleFromHeaderCookie",
      "getRoleFromCookies",
      "getClientAdminRole",
      "serializeRoleCookie",
      "ADMIN_ROLE_COOKIE",
    ]) {
      expect(removido in rbac).toBe(false);
    }
  });
});
