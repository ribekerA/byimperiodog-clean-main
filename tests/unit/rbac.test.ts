import { describe, expect, it } from "vitest";

import {
  DEFAULT_ROLE,
  assertPermission,
  getClientAdminRole,
  getRoleFromHeaderCookie,
  hasPermission,
  normalizeRole,
} from "@/lib/rbac";

describe("rbac helpers", () => {
  it("normalizes roles desconhecidos como owner", () => {
    expect(normalizeRole("owner")).toBe("owner");
    expect(normalizeRole("EDITOR")).toBe("editor");
    expect(normalizeRole("viewer")).toBe("viewer");
    expect(normalizeRole("")).toBe(DEFAULT_ROLE);
    expect(normalizeRole(undefined)).toBe(DEFAULT_ROLE);
    expect(normalizeRole("squad")).toBe(DEFAULT_ROLE);
  });

  it("valida permissões por role", () => {
    expect(hasPermission("owner", "settings:write")).toBe(true);
    expect(hasPermission("editor", "blog:write")).toBe(true);
    expect(hasPermission("viewer", "blog:write")).toBe(false);
  });

  it("gera erro quando permissao nao existe para role", () => {
    expect(() => assertPermission("viewer", "blog:write")).toThrowError();
  });

  it("resolve role a partir do header Cookie", () => {
    const header = "admin_role=editor; adm=true";
    expect(getRoleFromHeaderCookie(header)).toBe("editor");
  });

  it("getClientAdminRole retorna owner no ambiente de teste", () => {
    expect(getClientAdminRole()).toBe(DEFAULT_ROLE);
  });
});

